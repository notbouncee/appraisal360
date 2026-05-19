from pydantic import BaseModel, EmailStr


class AdminCreateUserRequest(BaseModel):
    email: EmailStr
    display_name: str
    team: str
    role: str = "member"
    temp_password: str


class ForcePasswordChangeRequest(BaseModel):
    email: EmailStr
