from fastapi import APIRouter

from app.api.routes import assets, auth, dashboard, documents, employees, lookups, maintenance, software, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(employees.router, prefix="/employees", tags=["employees"])
api_router.include_router(lookups.router, tags=["lookups"])
api_router.include_router(assets.router, prefix="/assets", tags=["assets"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(maintenance.router, prefix="/maintenance-tickets", tags=["maintenance"])
api_router.include_router(software.router, prefix="/software-licenses", tags=["software-licenses"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
