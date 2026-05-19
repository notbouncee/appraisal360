from pydantic import BaseModel


class FeedbackQuestionItem(BaseModel):
    id: str
    label: str
    description: str
    is_required: bool
    sort_order: int
    is_active: bool
    created_at: str
    updated_at: str


class FeedbackQuestionCreateRequest(BaseModel):
    label: str
    description: str
    is_required: bool = True
    sort_order: int = 0
    is_active: bool = True


class FeedbackQuestionUpdateRequest(BaseModel):
    label: str
    description: str
    is_required: bool
    sort_order: int
    is_active: bool
