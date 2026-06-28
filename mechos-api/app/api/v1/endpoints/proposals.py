from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.api.deps import get_current_admin_user, get_current_client_user
from app.models.user import User
from app.models.proposal import Proposal, ProposalScopeItem
from app.models.client_portal import ClientProject
from app.schemas.proposal import ProposalCreate, ProposalUpdate, ProposalResponse

router = APIRouter()

# --- Admin Routes ---
@router.post("/admin", response_model=ProposalResponse)
async def create_proposal(
    *,
    db: AsyncSession = Depends(get_db),
    proposal_in: ProposalCreate,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    # Verify client exists
    query = select(User).where(User.id == proposal_in.client_id)
    result = await db.execute(query)
    client = result.scalars().first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    total = sum(item.price for item in proposal_in.scope_items or [])

    proposal = Proposal(
        client_id=proposal_in.client_id,
        title=proposal_in.title,
        notes=proposal_in.notes,
        valid_until=proposal_in.valid_until,
        total_amount=total,
        status="DRAFT"
    )
    db.add(proposal)
    await db.flush()

    for idx, item in enumerate(proposal_in.scope_items or []):
        scope_item = ProposalScopeItem(
            proposal_id=proposal.id,
            title=item.title,
            description=item.description,
            price=item.price,
            display_order=item.display_order or idx
        )
        db.add(scope_item)

    await db.commit()
    
    # Reload with scope items
    query = select(Proposal).options(selectinload(Proposal.scope_items)).where(Proposal.id == proposal.id)
    res = await db.execute(query)

    from app.services.notifications import create_and_broadcast
    await create_and_broadcast(db, proposal.client_id, "New Proposal", f"A new proposal '{proposal.title}' is ready for your review.", "proposal", "/portal/proposals")

    return res.scalars().first()

@router.get("/admin", response_model=List[ProposalResponse])
async def read_admin_proposals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    query = select(Proposal).options(selectinload(Proposal.scope_items)).order_by(Proposal.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/admin/{proposal_id}", response_model=ProposalResponse)
async def update_proposal_status(
    *,
    db: AsyncSession = Depends(get_db),
    proposal_id: str,
    proposal_in: ProposalUpdate,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    query = select(Proposal).options(selectinload(Proposal.scope_items)).where(Proposal.id == proposal_id)
    result = await db.execute(query)
    proposal = result.scalars().first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    update_data = proposal_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(proposal, field, value)

    if proposal.status == "ACCEPTED":
        # Check if project already exists for this proposal
        project_q = select(ClientProject).where(
            ClientProject.client_id == proposal.client_id,
            ClientProject.name == proposal.title
        )
        project_res = await db.execute(project_q)
        existing_project = project_res.scalars().first()
        if not existing_project:
            project = ClientProject(
                client_id=proposal.client_id,
                name=proposal.title,
                description=proposal.notes or f"Created automatically from accepted proposal '{proposal.title}'",
                status="In Progress",
                progress_percent=0
            )
            db.add(project)

    await db.commit()
    await db.refresh(proposal)
    return proposal

from app.services.webhook import dispatch_webhook_event
from app.services.pdf_generator import generate_proposal_pdf
from fastapi.responses import Response

# --- Client Routes ---
@router.get("/client", response_model=List[ProposalResponse])
async def read_client_proposals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_client_user)
) -> Any:
    query = select(Proposal).options(selectinload(Proposal.scope_items)).where(
        Proposal.client_id == current_user.id,
        Proposal.status != "DRAFT" # Clients should only see proposals that were SENT, ACCEPTED, or REJECTED
    ).order_by(Proposal.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/client/{proposal_id}/accept", response_model=ProposalResponse)
async def accept_proposal(
    *,
    db: AsyncSession = Depends(get_db),
    proposal_id: str,
    current_user: User = Depends(get_current_client_user)
) -> Any:
    query = select(Proposal).options(selectinload(Proposal.scope_items)).where(
        Proposal.id == proposal_id, 
        Proposal.client_id == current_user.id
    )
    result = await db.execute(query)
    proposal = result.scalars().first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    proposal.status = "ACCEPTED"

    # Automatically create ClientProject for seamlessly converting proposals to active projects!
    project = ClientProject(
        client_id=current_user.id,
        name=proposal.title,
        description=proposal.notes or f"Created automatically from accepted proposal '{proposal.title}'",
        status="In Progress",
        progress_percent=0
    )
    db.add(project)

    await db.commit()
    await db.refresh(proposal)

    await dispatch_webhook_event("proposal_accepted", {
        "proposal_id": proposal.id,
        "title": proposal.title,
        "client_id": current_user.id,
        "total_amount": proposal.total_amount
    })

    from app.services.notifications import create_and_broadcast
    from app.models.user import UserRole
    admin_query = select(User).where(User.role == UserRole.ADMIN)
    admin_res = await db.execute(admin_query)
    for admin in admin_res.scalars().all():
        await create_and_broadcast(db, admin.id, "Proposal Accepted", f"Client accepted proposal '{proposal.title}'", "payment", "/admin/proposals")

    return proposal

@router.get("/client/{proposal_id}/pdf")
async def download_proposal_pdf(
    proposal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_client_user)
):
    query = select(Proposal).options(selectinload(Proposal.scope_items)).where(
        Proposal.id == proposal_id,
        Proposal.client_id == current_user.id
    )
    result = await db.execute(query)
    proposal = result.scalars().first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    scope_data = [{"title": s.title, "description": s.description, "price": s.price} for s in (proposal.scope_items or [])]
    p_dict = {
        "id": proposal.id,
        "title": proposal.title,
        "client_id": proposal.client_id,
        "status": proposal.status,
        "total_amount": proposal.total_amount,
        "scope_deliverables": scope_data
    }

    pdf_bytes = generate_proposal_pdf(p_dict)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Proposal_{proposal.id[:8]}.pdf"}
    )

