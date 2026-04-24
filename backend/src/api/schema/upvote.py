from pydantic import BaseModel


class UpvoteCreateRequest(BaseModel):
    voter_id: str
    upvoted_id: str
    message: str


class UpvoteItem(BaseModel):
    id: str
    voter_id: str
    upvoted_id: str
    message: str
    created_at: str


class UpvoteListResponse(BaseModel):
    data: list[UpvoteItem]
    count: int
