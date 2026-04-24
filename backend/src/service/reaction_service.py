from src.repository.reaction_repository import ReactionRepository
from src.repository.user_repository import UserRepository
from src.service.mapper.dto_mapper import row_to_dict, rows_to_dicts


class ReactionService:
    def __init__(self) -> None:
        self.repo = ReactionRepository()
        self.user_repo = UserRepository()

    def list_all(self) -> list[dict]:
        return rows_to_dicts(self.repo.list_all())

    def upsert(self, user_id: str, appreciation_id: str, emoji: str) -> dict:
        profile_id = self.user_repo.get_profile_id_for_user(user_id)
        row = self.repo.upsert(appreciation_id=appreciation_id, user_id=profile_id, emoji=emoji)
        return row_to_dict(row)

    def delete(self, user_id: str, appreciation_id: str) -> None:
        profile_id = self.user_repo.get_profile_id_for_user(user_id)
        self.repo.delete_for_user(appreciation_id=appreciation_id, user_id=profile_id)
