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


class ReviewCycleCreateRequest(BaseModel):
    year: int
    quarter: int
    title: str
    description: str
    start_date: str
    end_date: str


class ReviewCycleUpdateRequest(BaseModel):
    title: str
    description: str
    start_date: str
    end_date: str
