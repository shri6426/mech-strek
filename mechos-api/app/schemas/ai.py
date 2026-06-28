from pydantic import BaseModel
from typing import Optional, List

class ScopeItemEstimate(BaseModel):
    title: str
    description: str
    estimated_hours: int
    price: float

class EstimationRequest(BaseModel):
    prompt: str
    project_type: Optional[str] = "Web Application"

class EstimationResponse(BaseModel):
    project_title: str
    summary: str
    total_hours: int
    total_price: float
    scope_items: List[ScopeItemEstimate]

class QAReviewRequest(BaseModel):
    title: str
    description: str

class QAReviewResponse(BaseModel):
    risk_score: str # "LOW", "MEDIUM", "HIGH"
    findings: List[str]
    recommendations: List[str]

class CopilotRequest(BaseModel):
    message: str

class CopilotResponse(BaseModel):
    reply: str
