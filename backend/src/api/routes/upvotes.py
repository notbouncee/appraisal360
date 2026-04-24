from fastapi import APIRouter, Depends, Query

from src.api.schema.upvote import UpvoteCreateRequest, UpvoteItem, UpvoteListResponse
from src.middleware.auth import get_current_user_id
from src.service.upvote_service import UpvoteService

router = APIRouter(prefix="/upvotes", tags=["upvotes"])
service = UpvoteService()


@router.get("/count")
def count_received(upvoted_id: str = Query(...)) -> dict[str, int]:
    return {"count": service.count_received(upvoted_id=upvoted_id)}


@router.get("/received", response_model=UpvoteListResponse)
def list_received(
    upvoted_id: str = Query(...),
    page: int = Query(default=0, ge=0),
    page_size: int = Query(default=10, ge=1, le=100),
) -> dict:
    return service.list_received(upvoted_id=upvoted_id, page=page, page_size=page_size)


@router.get("/feed", response_model=list[UpvoteItem])
def list_feed() -> list[dict]:
    return service.list_all()


@router.post("", response_model=UpvoteItem)
def create_upvote(payload: UpvoteCreateRequest, current_user_id: str = Depends(get_current_user_id)) -> dict:
    return service.create(user_id=current_user_id, voter_id=payload.voter_id, upvoted_id=payload.upvoted_id, message=payload.message)
