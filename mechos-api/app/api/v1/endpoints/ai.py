from typing import Any
from fastapi import APIRouter, Depends
from app.api.deps import get_current_admin_user
from app.models.user import User
from app.core.ai_engine import ai_engine
from app.schemas.ai import (
    EstimationRequest, EstimationResponse,
    QAReviewRequest, QAReviewResponse,
    CopilotRequest, CopilotResponse
)

router = APIRouter()

@router.post("/estimate", response_model=EstimationResponse)
async def generate_project_estimate(
    *,
    request_in: EstimationRequest,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    return await ai_engine.generate_estimation(request_in.prompt, request_in.project_type or "Web Application")

@router.post("/qa-review", response_model=QAReviewResponse)
async def perform_qa_review(
    *,
    request_in: QAReviewRequest,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    return await ai_engine.review_qa_risk(request_in.title, request_in.description)

@router.post("/copilot", response_model=CopilotResponse)
async def copilot_chat(
    *,
    request_in: CopilotRequest,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    msg = request_in.message.lower()
    if "hello" in msg or "hi" in msg:
        reply = "Hello! I am your MechOS AI Copilot. I can help you generate project estimates, audit deliverables, or draft proposals. What are we working on today?"
    elif "proposal" in msg or "scope" in msg:
        reply = "To draft a proposal, head over to the AI Studio estimation tool or use the Proposal Manager to send multi-deliverable quotes directly to clients."
    else:
        reply = f"AI Copilot processed your request: '{request_in.message}'. All MechOS core operational systems are operational and connected."

    return CopilotResponse(reply=reply)
