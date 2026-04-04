from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.security.deps import require_roles
from app.schemas.dashboard import DashboardSummaryResponse
from app.services.dashboard import DashboardService

router = APIRouter()


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_summary(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
) -> DashboardSummaryResponse:
    return DashboardService(db).get_summary()
