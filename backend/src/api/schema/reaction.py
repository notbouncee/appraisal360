from pydantic import BaseModel


class ReactionUpsertRequest(BaseModel):
    appreciation_id: str
    emoji: str


class ReactionItem(BaseModel):
    id: str
    appreciation_id: str
    user_id: str
    emoji: str
    created_at: str
