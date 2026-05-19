from fastapi import APIRouter, Depends, Query

from src.api.schema.feedback import FeedbackCreateRequest, FeedbackListResponse
from src.middleware.auth import get_current_user_id
from src.service.feedback_service import FeedbackService

router = APIRouter(prefix="/feedback", tags=["feedback"])
service = FeedbackService()


@router.get("/count")
def count_received(recipient_id: str = Query(...)) -> dict[str, int]:
    return {"count": service.count_received(recipient_id=recipient_id)}


@router.get("/received", response_model=FeedbackListResponse)
def list_received(
    recipient_id: str = Query(...),
    page: int = Query(default=0, ge=0),
    page_size: int = Query(default=10, ge=1, le=100),
) -> dict:
    return service.list_received(recipient_id=recipient_id, page=page, page_size=page_size)


@router.post("/bulk")
def create_feedback(payload: FeedbackCreateRequest, current_user_id: str = Depends(get_current_user_id)) -> dict[str, str]:
    service.create_many(user_id=current_user_id, rows=[item.model_dump() for item in payload.items])
    return {"message": "Feedback created"}
