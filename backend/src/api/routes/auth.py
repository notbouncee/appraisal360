from fastapi import APIRouter, Depends

from src.api.schema.auth import AuthResponse, MeResponse, SignInRequest, SignUpRequest
from src.middleware.auth import get_current_user_id
from src.service.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
service = AuthService()


@router.post("/signup", response_model=AuthResponse)
def signup(payload: SignUpRequest) -> dict:
    return service.signup(email=payload.email, password=payload.password, display_name=payload.display_name)


@router.post("/signin", response_model=AuthResponse)
def signin(payload: SignInRequest) -> dict:
    return service.signin(email=payload.email, password=payload.password)


@router.get("/me", response_model=MeResponse)
def me(current_user_id: str = Depends(get_current_user_id)) -> dict:
    return service.me(user_id=current_user_id)


@router.post("/signout")
def signout() -> dict[str, str]:
    return {"message": "Signed out"}
