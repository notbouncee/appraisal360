from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response

from src.api.schema.admin import AdminCreateUserRequest, ForcePasswordChangeRequest
from src.api.schema.feedback_question import (
    FeedbackQuestionCreateRequest,
    FeedbackQuestionItem,
    FeedbackQuestionUpdateRequest,
)
from src.core.security import hash_password
from src.middleware.auth import require_admin
from src.service.admin_service import AdminService
from src.service.feedback_question_service import FeedbackQuestionService

router = APIRouter(prefix="/admin", tags=["admin"])
admin_service = AdminService()
question_service = FeedbackQuestionService()


@router.get("/feedback-questions", response_model=list[FeedbackQuestionItem])
def list_feedback_questions(_: str = Depends(require_admin)) -> list[dict]:
    return question_service.list_all()


@router.post("/feedback-questions", response_model=FeedbackQuestionItem)
def create_feedback_question(payload: FeedbackQuestionCreateRequest, _: str = Depends(require_admin)) -> dict:
    return question_service.create(payload.model_dump())


@router.put("/feedback-questions/{question_id}", response_model=FeedbackQuestionItem)
def update_feedback_question(
    question_id: str,
    payload: FeedbackQuestionUpdateRequest,
    _: str = Depends(require_admin),
) -> dict:
    return question_service.update(question_id=question_id, payload=payload.model_dump())


@router.delete("/feedback-questions/{question_id}")
def delete_feedback_question(question_id: str, _: str = Depends(require_admin)) -> dict[str, str]:
    question_service.delete(question_id=question_id)
    return {"message": "Feedback question deleted"}


@router.post("/users", response_model=dict)
def create_user(payload: AdminCreateUserRequest, _: str = Depends(require_admin)) -> dict:
    created = admin_service.create_user(
        {
            "email": payload.email,
            "display_name": payload.display_name,
            "team": payload.team,
            "role": payload.role,
            "raw_password": payload.temp_password,
            "password_hash": hash_password(payload.temp_password),
        }
    )
    return {
        "id": str(created["id"]),
        "user_id": str(created["user_id"]),
        "email": created["email"],
        "display_name": created["display_name"],
        "team": created["team"],
        "role": created["role"],
        "must_change_password": created["must_change_password"],
    }


@router.post("/users/force-password-change")
def force_password_change(payload: ForcePasswordChangeRequest, _: str = Depends(require_admin)) -> dict:
    return admin_service.force_password_change(email=payload.email)


@router.get("/feedback/export")
def export_feedback(
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    recipient_id: str | None = Query(default=None),
    author_id: str | None = Query(default=None),
    is_anonymous: bool | None = Query(default=None),
    _: str = Depends(require_admin),
) -> Response:
    csv_data = admin_service.export_feedback_csv(
        start_date=start_date,
        end_date=end_date,
        recipient_id=recipient_id,
        author_id=author_id,
        is_anonymous=is_anonymous,
    )
    headers = {"Content-Disposition": "attachment; filename=feedback_export.csv"}
    return Response(content=csv_data, media_type="text/csv", headers=headers)
