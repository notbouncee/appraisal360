from fastapi import HTTPException, status

from src.repository.user_repository import UserRepository


class AdminService:
    def __init__(self) -> None:
        self.user_repo = UserRepository()

    def _validate_password(self, password: str) -> None:
        if len(password) < 8:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters")
        if not any(char.isdigit() for char in password):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must include at least one number")

    def create_user(self, payload: dict) -> dict:
        existing = self.user_repo.get_user_by_email(payload["email"])
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

        self._validate_password(payload["raw_password"])

        role = (payload["role"] or "member").lower()
        if role not in {"admin", "member", "manager"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")

        return self.user_repo.create_user_admin(
            email=payload["email"],
            password_hash=payload["password_hash"],
            display_name=payload["display_name"],
            team=payload["team"],
            role=role,
        )

    def force_password_change(self, email: str) -> dict:
        updated = self.user_repo.force_password_change(email=email)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return updated

