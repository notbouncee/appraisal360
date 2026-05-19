from fastapi import HTTPException, status

from src.repository.review_cycle_repository import ReviewCycleRepository
from src.service.mapper.dto_mapper import row_to_dict, rows_to_dicts


class ReviewCycleService:
    def __init__(self) -> None:
        self.repo = ReviewCycleRepository()

    def list_by_year(self, year: int) -> list[dict]:
        return rows_to_dicts(self.repo.list_by_year(year=year))

    def create(self, payload: dict) -> dict:
        return row_to_dict(self.repo.create(payload))

    def update(self, cycle_id: str, payload: dict) -> dict:
        updated = self.repo.update(cycle_id=cycle_id, payload=payload)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review cycle not found")
        return row_to_dict(updated)

    def delete(self, cycle_id: str) -> None:
        self.repo.delete(cycle_id)
