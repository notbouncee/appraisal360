from fastapi import HTTPException, status

from src.repository.upvote_repository import UpvoteRepository
from src.repository.user_repository import UserRepository
from src.service.mapper.dto_mapper import row_to_dict, rows_to_dicts


class UpvoteService:
    def __init__(self) -> None:
        self.repo = UpvoteRepository()
        self.user_repo = UserRepository()

    def count_received(self, upvoted_id: str) -> int:
        return self.repo.count_received(upvoted_id)

    def list_received(self, upvoted_id: str, page: int, page_size: int) -> dict:
        rows, count = self.repo.list_received(upvoted_id=upvoted_id, page=page, page_size=page_size)
        return {"data": rows_to_dicts(rows), "count": count}

    def list_all(self) -> list[dict]:
        return rows_to_dicts(self.repo.list_all())

    def create(self, user_id: str, voter_id: str, upvoted_id: str, message: str) -> dict:
        profile_id = self.user_repo.get_profile_id_for_user(user_id)
        if not profile_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
        if voter_id != profile_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="voter_id does not match token")

        created = self.repo.insert(voter_id=voter_id, upvoted_id=upvoted_id, message=message)
        return row_to_dict(created)
