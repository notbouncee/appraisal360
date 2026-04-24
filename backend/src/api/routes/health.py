from datetime import datetime, timezone

from fastapi import APIRouter

from src.api.schema.health import HealthResponse

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok", utc_timestamp=datetime.now(timezone.utc))
