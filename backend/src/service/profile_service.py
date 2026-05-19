from src.repository.profile_repository import ProfileRepository
from src.service.mapper.dto_mapper import row_to_dict, rows_to_dicts


class ProfileService:
    def __init__(self) -> None:
        self.repo = ProfileRepository()

    def list_profiles(self, ids: list[str] | None = None) -> list[dict]:
        return rows_to_dicts(self.repo.list_profiles(ids=ids))

    def get_profile_by_user_id(self, user_id: str) -> dict | None:
        row = self.repo.get_profile_by_user_id(user_id)
        return row_to_dict(row) if row else None
