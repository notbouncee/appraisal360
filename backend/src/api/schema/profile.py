from pydantic import BaseModel


class ProfileResponse(BaseModel):
    id: str
    display_name: str
    team: str
    avatar_url: str | None = None
    role: str | None = None
