from pydantic import BaseModel


class ReviewCycleItem(BaseModel):
    id: str
    year: int
    quarter: int
    title: str
    description: str
    start_date: str
    end_date: str
    created_at: str
    updated_at: str
