from src.client.db import get_connection


class UserRepository:
    def create_user(self, email: str, password_hash: str, display_name: str) -> dict:
        sql = """
        WITH new_profile AS (
          INSERT INTO public.profiles (id, user_id, email, password_hash, display_name)
          VALUES (gen_random_uuid(), gen_random_uuid(), %(email)s, %(password_hash)s, %(display_name)s)
          RETURNING id, user_id, email, password_hash, display_name, team, avatar_url, role, must_change_password, password_changed_at, created_at, updated_at
        )
        SELECT id, user_id, email, password_hash, display_name, team, avatar_url, role, must_change_password, password_changed_at, created_at, updated_at
        FROM new_profile;
        """
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, {"email": email.lower(), "password_hash": password_hash, "display_name": display_name})
                return cur.fetchone()

    def get_user_by_email(self, email: str) -> dict | None:
        sql = """
        SELECT id, user_id, email, password_hash, display_name, team, avatar_url, role, must_change_password, password_changed_at, created_at, updated_at
        FROM public.profiles
        WHERE email = %(email)s;
        """
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, {"email": email.lower()})
                row = cur.fetchone()
        return row

    def get_user_by_id(self, user_id: str) -> dict | None:
        sql = """
        SELECT id, user_id, email, password_hash, display_name, team, avatar_url, role, must_change_password, password_changed_at, created_at, updated_at
        FROM public.profiles
        WHERE id = %(user_id)s OR user_id = %(user_id)s;
        """
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, {"user_id": user_id})
                row = cur.fetchone()
        return row

    def get_profile_id_for_user(self, user_id: str) -> str | None:
        sql = "SELECT id FROM public.profiles WHERE id = %(user_id)s OR user_id = %(user_id)s"
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, {"user_id": user_id})
                row = cur.fetchone()
        return str(row["id"]) if row else None
