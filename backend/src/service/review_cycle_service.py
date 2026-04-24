from src.repository.review_cycle_repository import ReviewCycleRepository
from src.service.mapper.dto_mapper import rows_to_dicts


class ReviewCycleService:
    def __init__(self) -> None:
        self.repo = ReviewCycleRepository()

    def list_by_year(self, year: int) -> list[dict]:
        return rows_to_dicts(self.repo.list_by_year(year=year))
