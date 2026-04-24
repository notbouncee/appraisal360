from fastapi import APIRouter, Query

from src.api.schema.profile import ProfileResponse
from src.service.profile_service import ProfileService

router = APIRouter(prefix="/profiles", tags=["profiles"])
service = ProfileService()


@router.get("", response_model=list[ProfileResponse])
def list_profiles(ids: str | None = Query(default=None)) -> list[dict]:
    parsed_ids = [i for i in (ids or "").split(",") if i] or None
    return service.list_profiles(ids=parsed_ids)
