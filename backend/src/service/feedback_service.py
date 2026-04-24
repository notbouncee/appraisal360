from fastapi import HTTPException, status

from src.repository.feedback_repository import FeedbackRepository
from src.repository.user_repository import UserRepository
from src.service.mapper.dto_mapper import rows_to_dicts


class FeedbackService:
    def __init__(self) -> None:
        self.repo = FeedbackRepository()
        self.user_repo = UserRepository()

    def count_received(self, recipient_id: str) -> int:
        return self.repo.count_received(recipient_id)

    def list_received(self, recipient_id: str, page: int, page_size: int) -> dict:
        rows, count = self.repo.list_received(recipient_id=recipient_id, page=page, page_size=page_size)
        return {"data": rows_to_dicts(rows), "count": count}

    def create_many(self, user_id: str, rows: list[dict]) -> None:
        profile_id = self.user_repo.get_profile_id_for_user(user_id)
        if not profile_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

        for row in rows:
            if row["author_id"] != profile_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="author_id does not match token")

        self.repo.insert_many(rows)
