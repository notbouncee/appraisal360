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

        default_labels = [
            "Situation",
            "Behaviour",
            "Impact",
            "Additional Comments",
        ]

        for row in rows:
            if row["author_id"] != profile_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="author_id does not match token")

            responses = row.get("responses") or []
            if not isinstance(responses, list):
                responses = []

            if not responses:
                legacy_values = [
                    row.get("situation") or "",
                    row.get("behaviour") or "",
                    row.get("impact") or "",
                    row.get("optional") or "",
                ]
                responses = [
                    {"label": label, "answer": value, "sort_order": index + 1}
                    for index, (label, value) in enumerate(zip(default_labels, legacy_values))
                    if value.strip() or index < 3
                ]

            row["responses"] = responses
            row["situation"] = row.get("situation") or (responses[0]["answer"] if len(responses) > 0 else "")
            row["behaviour"] = row.get("behaviour") or (responses[1]["answer"] if len(responses) > 1 else "")
            row["impact"] = row.get("impact") or (responses[2]["answer"] if len(responses) > 2 else "")
            row["optional"] = row.get("optional") or (responses[3]["answer"] if len(responses) > 3 else None)

        self.repo.insert_many(rows)
