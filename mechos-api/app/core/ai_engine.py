import os
from typing import List
from app.schemas.ai import EstimationResponse, ScopeItemEstimate, QAReviewResponse

class AIEngine:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY")

    async def generate_estimation(self, prompt: str, project_type: str) -> EstimationResponse:
        # Structured estimation logic (with intelligent heuristic parsing for V1)
        keywords = prompt.lower()
        
        items = []
        if "e-commerce" in keywords or "shop" in keywords or "store" in keywords:
            items = [
                ScopeItemEstimate(title="Product Catalog & Filtering", description="Searchable product matrix with category tags.", estimated_hours=40, price=3000.0),
                ScopeItemEstimate(title="Shopping Cart & Stripe Checkout", description="Secure payment integration and order management.", estimated_hours=35, price=2500.0),
                ScopeItemEstimate(title="Client Portal & Order Tracking", description="Customer dashboard for tracking delivery status.", estimated_hours=25, price=2000.0)
            ]
            title = "E-Commerce Digital Platform"
            summary = "Comprehensive online store built with Next.js and FastAPI."
        elif "mobile" in keywords or "app" in keywords:
            items = [
                ScopeItemEstimate(title="Cross-Platform Mobile UI", description="iOS and Android responsive app interfaces.", estimated_hours=50, price=4000.0),
                ScopeItemEstimate(title="Push Notifications Engine", description="Real-time alerts and background synchronization.", estimated_hours=20, price=1500.0),
                ScopeItemEstimate(title="Backend REST API Services", description="Scalable cloud endpoints and database storage.", estimated_hours=30, price=2500.0)
            ]
            title = "Mobile Application Suite"
            summary = "High-performance mobile application with cloud backend synchronization."
        else:
            items = [
                ScopeItemEstimate(title="Custom Web Application UI", description="Modern dark-mode web application architecture.", estimated_hours=30, price=2500.0),
                ScopeItemEstimate(title="Admin CMS & Lead Management", description="Internal dashboard for content and inquiry tracking.", estimated_hours=25, price=2000.0),
                ScopeItemEstimate(title="API Integration & Database Setup", description="FastAPI core services backed by PostgreSQL.", estimated_hours=20, price=1500.0)
            ]
            title = "Bespoke Web Application"
            summary = "Tailored digital solution modernizing legacy workflows."

        total_hours = sum(i.estimated_hours for i in items)
        total_price = sum(i.price for i in items)

        return EstimationResponse(
            project_title=title,
            summary=summary,
            total_hours=total_hours,
            total_price=total_price,
            scope_items=items
        )

    async def review_qa_risk(self, title: str, description: str) -> QAReviewResponse:
        # AI QA risk evaluator
        desc_lower = (description or "").lower()
        
        findings = []
        recommendations = []
        risk = "LOW"

        if "ai" in desc_lower or "agent" in desc_lower:
            findings.append("Task involves non-deterministic AI agent behavior.")
            recommendations.append("Ensure fallback heuristics and strict Pydantic output validation are enabled.")
            risk = "MEDIUM"
        
        if "payment" in desc_lower or "stripe" in desc_lower or "auth" in desc_lower:
            findings.append("Task impacts security or financial transaction paths.")
            recommendations.append("Conduct security token validation and verify HTTPS headers.")
            risk = "HIGH"

        if not findings:
            findings.append("Standard deliverable scope detected with no high-risk operational dependencies.")
            recommendations.append("Proceed with regular code review and unit testing.")

        return QAReviewResponse(
            risk_score=risk,
            findings=findings,
            recommendations=recommendations
        )

ai_engine = AIEngine()
