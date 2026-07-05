from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class ProposalScopeItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    price: float = 0.0
    display_order: Optional[int] = 0

class ProposalScopeItemCreate(ProposalScopeItemBase):
    pass

class ProposalScopeItemResponse(ProposalScopeItemBase):
    id: str
    proposal_id: str

    model_config = ConfigDict(from_attributes=True)

class ProposalBase(BaseModel):
    title: str
    notes: Optional[str] = None
    valid_until: Optional[datetime] = None

class ProposalCreate(ProposalBase):
    client_id: str
    scope_items: Optional[List[ProposalScopeItemCreate]] = []

class ProposalUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    valid_until: Optional[datetime] = None

class ProposalResponse(ProposalBase):
    id: str
    client_id: str
    status: str
    total_amount: float
    created_at: datetime
    updated_at: datetime
    scope_items: List[ProposalScopeItemResponse] = []

    model_config = ConfigDict(from_attributes=True)
