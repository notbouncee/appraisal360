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

        user = self.user_repo.create_user(email=email, password_hash=hash_password(password), display_name=display_name)
        token = create_access_token(user_id=user["id"])

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {"id": user["id"], "email": user["email"]},
            "profile": row_to_dict(user["profile"]),
        }

    def signin(self, email: str, password: str) -> dict:
        user = self.user_repo.get_user_by_email(email)
        if not user or not verify_password(password, user["password_hash"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        token = create_access_token(user_id=str(user["id"]))
        profile = {
            "id": user["profile_id_actual"],
            "user_id": user["user_id"],
            "display_name": user["display_name"],
            "team": user["team"],
            "avatar_url": user["avatar_url"],
            "role": user["role"],
        }

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {"id": str(user["id"]), "email": user["email"]},
            "profile": row_to_dict(profile),
        }

    def me(self, user_id: str) -> dict:
        user = self.user_repo.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        profile = {
            "id": user["profile_id"],
            "user_id": user["user_id"],
            "display_name": user["display_name"],
            "team": user["team"],
            "avatar_url": user["avatar_url"],
            "role": user["role"],
        }

        return {
            "user": {"id": str(user["id"]), "email": user["email"]},
            "profile": row_to_dict(profile),
        }
