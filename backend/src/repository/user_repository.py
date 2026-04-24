from src.client.db import get_connection


class UserRepository:
    def create_user(self, email: str, password_hash: str, display_name: str) -> dict:
        sql = """
        WITH new_profile AS (
          INSERT INTO public.profiles (user_id, display_name)
          VALUES (gen_random_uuid(), %(display_name)s)
          RETURNING id, user_id, display_name, team, avatar_url, role, must_change_password, password_changed_at, created_at, updated_at
        )
        INSERT INTO public.app_users (email, password_hash, profile_id)
        VALUES (%(email)s, %(password_hash)s, (SELECT id FROM new_profile))
        RETURNING id, email, profile_id;
        """
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, {"email": email.lower(), "password_hash": password_hash, "display_name": display_name})
                user = cur.fetchone()
                cur.execute(
                    "SELECT id, user_id, display_name, team, avatar_url, role FROM public.profiles WHERE id = %(id)s",
                    {"id": user["profile_id"]},
                )
                profile = cur.fetchone()
                return {"id": str(user["id"]), "email": user["email"], "profile": profile}

    def get_user_by_email(self, email: str) -> dict | None:
        sql = """
        SELECT u.id, u.email, u.password_hash, u.profile_id,
               p.id AS profile_id_actual, p.user_id, p.display_name, p.team, p.avatar_url, p.role
        FROM public.app_users u
        JOIN public.profiles p ON p.id = u.profile_id
        WHERE u.email = %(email)s;
        """
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, {"email": email.lower()})
                row = cur.fetchone()
        return row

    def get_user_by_id(self, user_id: str) -> dict | None:
        sql = """
        SELECT u.id, u.email, u.profile_id,
               p.user_id, p.display_name, p.team, p.avatar_url, p.role
        FROM public.app_users u
        JOIN public.profiles p ON p.id = u.profile_id
        WHERE u.id = %(user_id)s;
        """
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, {"user_id": user_id})
                row = cur.fetchone()
        return row

    def get_profile_id_for_user(self, user_id: str) -> str | None:
        sql = "SELECT profile_id FROM public.app_users WHERE id = %(user_id)s"
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, {"user_id": user_id})
                row = cur.fetchone()
        return str(row["profile_id"]) if row else None
