from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.core.security import AuthError, decode_access_token_payload
from src.repository.user_repository import UserRepository

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")

    try:
        payload = decode_access_token_payload(credentials.credentials)
    except AuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    user_id = str(payload["sub"])
    issued_at = payload.get("iat")
    if not issued_at:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")

    repo = UserRepository()
    profile = repo.get_user_by_id(user_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    revoked_at = profile.get("tokens_revoked_at") if isinstance(profile, dict) else None
    if revoked_at:
        revoked_ts = revoked_at.astimezone(timezone.utc)
        issued_dt = datetime.fromtimestamp(int(issued_at), tz=timezone.utc)
        if issued_dt <= revoked_ts:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked")

    return user_id


def require_admin(current_user_id: str = Depends(get_current_user_id)) -> str:
    repo = UserRepository()
    profile = repo.get_user_by_id(current_user_id)
    role = (profile.get("role") or "").lower() if profile else ""
    if role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    return current_user_id
