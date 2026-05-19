from datetime import datetime, timezone

from fastapi import HTTPException, status

from src.core.security import (
    create_access_token,
    create_password_change_token,
    create_refresh_token,
    decode_refresh_token,
    decode_password_change_token,
    decode_refresh_token_payload,
    hash_password,
    verify_password,
)
from src.repository.user_repository import UserRepository
from src.service.mapper.dto_mapper import row_to_dict


class AuthService:
    def __init__(self) -> None:
        self.user_repo = UserRepository()

    def _validate_password(self, password: str) -> None:
        if len(password) < 8:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters")
        if not any(char.isdigit() for char in password):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must include at least one number")

    def signup(self, email: str, password: str, display_name: str) -> dict:
        existing = self.user_repo.get_user_by_email(email)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

        self._validate_password(password)

        profile = self.user_repo.create_user(email=email, password_hash=hash_password(password), display_name=display_name)
        token = create_access_token(user_id=str(profile["id"]))

        profile_payload = {
            "id": str(profile["id"]),
            "user_id": str(profile["user_id"]),
            "display_name": profile["display_name"],
            "team": profile["team"],
            "avatar_url": profile["avatar_url"],
            "role": profile["role"],
        }

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {"id": str(profile["id"]), "email": profile["email"]},
            "profile": row_to_dict(profile_payload),
        }

    def signin(self, email: str, password: str) -> dict:
        profile = self.user_repo.get_user_by_email(email)
        if not profile or not verify_password(password, profile["password_hash"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        if profile["must_change_password"]:
            password_change_token = create_password_change_token(user_id=str(profile["id"]))
            profile_payload = {
                "id": str(profile["id"]),
                "user_id": str(profile["user_id"]),
                "display_name": profile["display_name"],
                "team": profile["team"],
                "avatar_url": profile["avatar_url"],
                "role": profile["role"],
                "must_change_password": True,
            }
            return {
                "must_change_password": True,
                "password_change_token": password_change_token,
                "user": {"id": str(profile["id"]), "email": profile["email"]},
                "profile": row_to_dict(profile_payload),
            }

        token = create_access_token(user_id=str(profile["id"]))
        refresh_token = create_refresh_token(user_id=str(profile["id"]))
        profile_payload = {
            "id": str(profile["id"]),
            "user_id": str(profile["user_id"]),
            "display_name": profile["display_name"],
            "team": profile["team"],
            "avatar_url": profile["avatar_url"],
            "role": profile["role"],
            "must_change_password": False,
        }

        return {
            "access_token": token,
            "token_type": "bearer",
            "refresh_token": refresh_token,
            "must_change_password": False,
            "user": {"id": str(profile["id"]), "email": profile["email"]},
            "profile": row_to_dict(profile_payload),
        }

    def change_password(self, password_change_token: str, new_password: str) -> dict:
        user_id = decode_password_change_token(password_change_token)
        self._validate_password(new_password)

        existing = self.user_repo.get_user_by_id(user_id)
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        if verify_password(new_password, existing["password_hash"]):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be different from the current password")

        updated = self.user_repo.update_password_for_user(user_id=user_id, password_hash=hash_password(new_password))
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        access_token = create_access_token(user_id=str(updated["id"]))
        refresh_token = create_refresh_token(user_id=str(updated["id"]))
        profile_payload = {
            "id": str(updated["id"]),
            "user_id": str(updated["user_id"]),
            "display_name": updated["display_name"],
            "team": updated["team"],
            "avatar_url": updated["avatar_url"],
            "role": updated["role"],
            "must_change_password": updated["must_change_password"],
        }

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "refresh_token": refresh_token,
            "user": {"id": str(updated["id"]), "email": updated["email"]},
            "profile": row_to_dict(profile_payload),
        }

    def refresh(self, refresh_token: str) -> dict:
        payload = decode_refresh_token_payload(refresh_token)
        user_id = str(payload["sub"])
        issued_at = payload.get("iat")
        if not issued_at:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        profile = self.user_repo.get_user_by_id(user_id)
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        revoked_at = profile.get("tokens_revoked_at") if isinstance(profile, dict) else None
        if revoked_at:
            issued_dt = datetime.fromtimestamp(int(issued_at), tz=timezone.utc)
            revoked_dt = revoked_at.astimezone(timezone.utc)
            if issued_dt <= revoked_dt:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked")

        access_token = create_access_token(user_id=str(profile["id"]))
        rotated_refresh_token = create_refresh_token(user_id=str(profile["id"]))

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "refresh_token": rotated_refresh_token,
        }

    def me(self, user_id: str) -> dict:
        profile = self.user_repo.get_user_by_id(user_id)
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        profile_payload = {
            "id": str(profile["id"]),
            "user_id": str(profile["user_id"]),
            "display_name": profile["display_name"],
            "team": profile["team"],
            "avatar_url": profile["avatar_url"],
            "role": profile["role"],
            "must_change_password": profile["must_change_password"],
        }

        return {
            "user": {"id": str(profile["id"]), "email": profile["email"]},
            "profile": row_to_dict(profile_payload),
        }
