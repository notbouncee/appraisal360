import csv
from io import StringIO

from fastapi import HTTPException, status

from src.repository.feedback_repository import FeedbackRepository
from src.repository.user_repository import UserRepository
from src.service.mapper.dto_mapper import rows_to_dicts


class AdminService:
    def __init__(self) -> None:
        self.user_repo = UserRepository()
        self.feedback_repo = FeedbackRepository()

    def _validate_password(self, password: str) -> None:
        if len(password) < 8:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters")
        if not any(char.isdigit() for char in password):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must include at least one number")

    def create_user(self, payload: dict) -> dict:
        existing = self.user_repo.get_user_by_email(payload["email"])
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

        self._validate_password(payload["raw_password"])

        role = (payload["role"] or "member").lower()
        if role not in {"admin", "member"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")

        return self.user_repo.create_user_admin(
            email=payload["email"],
            password_hash=payload["password_hash"],
            display_name=payload["display_name"],
            team=payload["team"],
            role=role,
        )

    def force_password_change(self, email: str) -> dict:
        updated = self.user_repo.force_password_change(email=email)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return updated

    def export_feedback_csv(
        self,
        start_date: str | None,
        end_date: str | None,
        recipient_id: str | None,
        author_id: str | None,
        is_anonymous: bool | None,
    ) -> str:
        rows = self.feedback_repo.list_for_export(
            start_date=start_date,
            end_date=end_date,
            recipient_id=recipient_id,
            author_id=author_id,
            is_anonymous=is_anonymous,
        )
        items = rows_to_dicts(rows)

        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "id",
                "author_id",
                "recipient_id",
                "situation",
                "behaviour",
                "impact",
                "optional",
                "is_anonymous",
                "created_at",
            ]
        )
        for item in items:
            writer.writerow(
                [
                    item.get("id"),
                    item.get("author_id"),
                    item.get("recipient_id"),
                    item.get("situation"),
                    item.get("behaviour"),
                    item.get("impact"),
                    item.get("optional"),
                    item.get("is_anonymous"),
                    item.get("created_at"),
                ]
            )

        return output.getvalue()
