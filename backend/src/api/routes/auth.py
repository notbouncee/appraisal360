from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from src.api.schema.auth import AuthResponse, ChangePasswordRequest, MeResponse, RefreshResponse, SignInRequest, SignInResponse, SignUpRequest
from src.core.settings import settings
from src.middleware.auth import get_current_user_id
from src.service.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
service = AuthService()
REFRESH_COOKIE_NAME = "appraisal360_refresh_token"


@router.post("/signup", response_model=AuthResponse)
def signup(payload: SignUpRequest) -> dict:
    return service.signup(email=payload.email, password=payload.password, display_name=payload.display_name)


@router.post("/signin", response_model=SignInResponse)
def signin(payload: SignInRequest, response: Response) -> dict:
    data = service.signin(email=payload.email, password=payload.password)
    refresh_token = data.pop("refresh_token", None)
    if refresh_token:
        response.set_cookie(
            key=REFRESH_COOKIE_NAME,
            value=refresh_token,
            httponly=True,
            samesite="lax",
            max_age=settings.jwt_refresh_expires_hours * 3600,
        )
    return data


@router.get("/me", response_model=MeResponse)
def me(current_user_id: str = Depends(get_current_user_id)) -> dict:
    return service.me(user_id=current_user_id)


@router.post("/change-password", response_model=AuthResponse)
def change_password(payload: ChangePasswordRequest, response: Response) -> dict:
    data = service.change_password(password_change_token=payload.token, new_password=payload.new_password)
    refresh_token = data.pop("refresh_token", None)
    if refresh_token:
        response.set_cookie(
            key=REFRESH_COOKIE_NAME,
            value=refresh_token,
            httponly=True,
            samesite="lax",
            max_age=settings.jwt_refresh_expires_hours * 3600,
        )
    return data


@router.post("/refresh", response_model=RefreshResponse)
def refresh(request: Request, response: Response) -> dict:
    refresh_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")

    data = service.refresh(refresh_token=refresh_token)
    rotated_refresh_token = data.pop("refresh_token", None)
    if rotated_refresh_token:
        response.set_cookie(
            key=REFRESH_COOKIE_NAME,
            value=rotated_refresh_token,
            httponly=True,
            samesite="lax",
            max_age=settings.jwt_refresh_expires_hours * 3600,
        )
    return data


@router.post("/signout")
def signout(response: Response) -> dict[str, str]:
    response.delete_cookie(REFRESH_COOKIE_NAME)
    return {"message": "Signed out"}
