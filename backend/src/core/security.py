from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from src.core.settings import settings

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


class AuthError(ValueError):
    pass


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: str) -> str:
    expires_delta = timedelta(minutes=settings.jwt_access_expires_minutes)
    now = datetime.now(timezone.utc)
    expire = now + expires_delta
    payload = {"sub": user_id, "type": "access", "exp": expire, "iat": int(now.timestamp())}
    return jwt.encode(payload, settings.jwt_access_secret, algorithm="HS256")


def create_refresh_token(user_id: str) -> str:
    expires_delta = timedelta(hours=settings.jwt_refresh_expires_hours)
    now = datetime.now(timezone.utc)
    expire = now + expires_delta
    payload = {"sub": user_id, "type": "refresh", "exp": expire, "iat": int(now.timestamp())}
    return jwt.encode(payload, settings.jwt_refresh_secret, algorithm="HS256")


def create_password_change_token(user_id: str) -> str:
    expires_delta = timedelta(minutes=settings.jwt_password_change_expires_minutes)
    now = datetime.now(timezone.utc)
    expire = now + expires_delta
    payload = {"sub": user_id, "type": "password_change", "exp": expire, "iat": int(now.timestamp())}
    return jwt.encode(payload, settings.jwt_refresh_secret, algorithm="HS256")


def _decode_token(token: str, secret: str, token_type: str, error_label: str) -> dict:
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
    except JWTError as exc:
        raise AuthError(f"Invalid {error_label} token") from exc

    if payload.get("type") != token_type:
        raise AuthError("Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise AuthError("Missing token subject")

    return payload


def decode_access_token_payload(token: str) -> dict:
    return _decode_token(token, settings.jwt_access_secret, "access", "access")


def decode_refresh_token_payload(token: str) -> dict:
    return _decode_token(token, settings.jwt_refresh_secret, "refresh", "refresh")


def decode_password_change_token_payload(token: str) -> dict:
    return _decode_token(token, settings.jwt_refresh_secret, "password_change", "password change")


def decode_access_token(token: str) -> str:
    payload = decode_access_token_payload(token)
    return str(payload["sub"])


def decode_refresh_token(token: str) -> str:
    payload = decode_refresh_token_payload(token)
    return str(payload["sub"])


def decode_password_change_token(token: str) -> str:
    payload = decode_password_change_token_payload(token)
    return str(payload["sub"])
