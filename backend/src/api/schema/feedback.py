from pydantic import BaseModel


class FeedbackAnswer(BaseModel):
    question_id: str | None = None
    label: str
    answer: str
    sort_order: int | None = None


class FeedbackCreateItem(BaseModel):
    author_id: str
    recipient_id: str
    situation: str | None = None
    behaviour: str | None = None
    impact: str | None = None
    optional: str | None = None
    responses: list[FeedbackAnswer] | None = None
    is_anonymous: bool = False


class FeedbackCreateRequest(BaseModel):
    items: list[FeedbackCreateItem]


class FeedbackItem(BaseModel):
    id: str
    situation: str
    behaviour: str
    impact: str
    optional: str | None = None
    responses: list[FeedbackAnswer] = []
    created_at: str
    author_id: str
    recipient_id: str
    is_anonymous: bool


class FeedbackListResponse(BaseModel):
    data: list[FeedbackItem]
    count: int
