from datetime import date

from fastapi import APIRouter, Depends, Query

from src.api.schema.review_cycle import ReviewCycleCreateRequest, ReviewCycleItem, ReviewCycleUpdateRequest
from src.middleware.auth import require_admin
from src.service.review_cycle_service import ReviewCycleService

router = APIRouter(prefix="/review-cycles", tags=["review-cycles"])
service = ReviewCycleService()


@router.get("", response_model=list[ReviewCycleItem])
def list_review_cycles(year: int | None = Query(default=None)) -> list[dict]:
    target_year = year or date.today().year
    return service.list_by_year(year=target_year)


@router.post("", response_model=ReviewCycleItem)
def create_review_cycle(payload: ReviewCycleCreateRequest, _: str = Depends(require_admin)) -> dict:
    return service.create(payload.model_dump())


@router.put("/{cycle_id}", response_model=ReviewCycleItem)
def update_review_cycle(cycle_id: str, payload: ReviewCycleUpdateRequest, _: str = Depends(require_admin)) -> dict:
    return service.update(cycle_id=cycle_id, payload=payload.model_dump())


@router.delete("/{cycle_id}")
def delete_review_cycle(cycle_id: str, _: str = Depends(require_admin)) -> dict[str, str]:
    service.delete(cycle_id=cycle_id)
    return {"message": "Review cycle deleted"}
