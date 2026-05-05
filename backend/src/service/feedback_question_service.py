from fastapi import HTTPException, status

from src.repository.feedback_question_repository import FeedbackQuestionRepository
from src.service.mapper.dto_mapper import row_to_dict, rows_to_dicts


class FeedbackQuestionService:
    def __init__(self) -> None:
        self.repo = FeedbackQuestionRepository()

    def list_all(self) -> list[dict]:
        return rows_to_dicts(self.repo.list_all())

    def create(self, payload: dict) -> dict:
        created = self.repo.create(
            label=payload["label"],
            description=payload["description"],
            is_required=payload["is_required"],
            sort_order=payload["sort_order"],
            is_active=payload["is_active"],
        )
        return row_to_dict(created)

    def update(self, question_id: str, payload: dict) -> dict:
        updated = self.repo.update(
            question_id=question_id,
            label=payload["label"],
            description=payload["description"],
            is_required=payload["is_required"],
            sort_order=payload["sort_order"],
            is_active=payload["is_active"],
        )
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback question not found")
        return row_to_dict(updated)

    def delete(self, question_id: str) -> None:
        self.repo.delete(question_id)
