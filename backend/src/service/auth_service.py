from fastapi import HTTPException, status

from src.core.security import create_access_token, hash_password, verify_password
from src.repository.user_repository import UserRepository
from src.service.mapper.dto_mapper import row_to_dict


class AuthService:
    def __init__(self) -> None:
        self.user_repo = UserRepository()

    def signup(self, email: str, password: str, display_name: str) -> dict:
        existing = self.user_repo.get_user_by_email(email)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

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
        }

        return {
            "user": {"id": str(profile["id"]), "email": profile["email"]},
            "profile": row_to_dict(profile_payload),
        }
