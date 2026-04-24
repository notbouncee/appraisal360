from pydantic import BaseModel, EmailStr


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class AuthUser(BaseModel):
    id: str
    email: str


class AuthProfile(BaseModel):
    id: str
    user_id: str
    display_name: str
    team: str
    avatar_url: str | None = None
    role: str | None = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: AuthUser
    profile: AuthProfile


class MeResponse(BaseModel):
    user: AuthUser
    profile: AuthProfile
