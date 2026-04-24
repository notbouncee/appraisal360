from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from src.core.settings import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthError(ValueError):
    pass


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: str) -> str:
    expires_delta = timedelta(minutes=settings.jwt_access_expires_minutes)
    expire = datetime.now(timezone.utc) + expires_delta
    payload = {"sub": user_id, "type": "access", "exp": expire}
    return jwt.encode(payload, settings.jwt_access_secret, algorithm="HS256")


def decode_access_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.jwt_access_secret, algorithms=["HS256"])
    except JWTError as exc:
        raise AuthError("Invalid access token") from exc

    token_type = payload.get("type")
    if token_type != "access":
        raise AuthError("Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise AuthError("Missing token subject")

    return str(user_id)
