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
    must_change_password: bool | None = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: AuthUser
    profile: AuthProfile


class SignInResponse(BaseModel):
    access_token: str | None = None
    token_type: str | None = None
    must_change_password: bool = False
    password_change_token: str | None = None
    user: AuthUser
    profile: AuthProfile


class ChangePasswordRequest(BaseModel):
    token: str
    new_password: str


class RefreshResponse(BaseModel):
    access_token: str
    token_type: str


class MeResponse(BaseModel):
    user: AuthUser
    profile: AuthProfile
