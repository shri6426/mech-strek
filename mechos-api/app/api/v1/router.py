from fastapi import APIRouter
from app.api.v1.endpoints import contact, portfolio, testimonials, cms, auth, admin, admin_portal, client_portal, proposals, invoices, project_management, ai, websockets, payments, notifications

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(contact.router, tags=["contact"])
api_router.include_router(portfolio.router, tags=["portfolio"])
api_router.include_router(testimonials.router, tags=["testimonials"])
api_router.include_router(cms.router, tags=["cms"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(admin_portal.router, prefix="/admin/portal", tags=["admin_portal"])
api_router.include_router(client_portal.router, prefix="/client", tags=["client_portal"])
api_router.include_router(proposals.router, prefix="/proposals", tags=["proposals"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["invoices"])
api_router.include_router(project_management.router, prefix="/pm", tags=["project_management"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(websockets.router, tags=["websockets"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

