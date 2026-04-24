from pydantic import BaseModel


class FeedbackCreateItem(BaseModel):
    author_id: str
    recipient_id: str
    situation: str
    behaviour: str
    impact: str
    optional: str | None = None
    is_anonymous: bool = False


class FeedbackCreateRequest(BaseModel):
    items: list[FeedbackCreateItem]


class FeedbackItem(BaseModel):
    id: str
    situation: str
    behaviour: str
    impact: str
    optional: str | None = None
    created_at: str
    author_id: str
    recipient_id: str
    is_anonymous: bool


class FeedbackListResponse(BaseModel):
    data: list[FeedbackItem]
    count: int
