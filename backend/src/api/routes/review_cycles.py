from datetime import date

from fastapi import APIRouter, Query

from src.api.schema.review_cycle import ReviewCycleItem
from src.service.review_cycle_service import ReviewCycleService

router = APIRouter(prefix="/review-cycles", tags=["review-cycles"])
service = ReviewCycleService()


@router.get("", response_model=list[ReviewCycleItem])
def list_review_cycles(year: int | None = Query(default=None)) -> list[dict]:
    target_year = year or date.today().year
    return service.list_by_year(year=target_year)
