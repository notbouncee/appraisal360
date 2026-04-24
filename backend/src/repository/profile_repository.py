from src.client.db import get_connection


class ProfileRepository:
    def list_profiles(self, ids: list[str] | None = None) -> list[dict]:
        base_sql = "SELECT id, display_name, team, avatar_url, role FROM public.profiles"
        params: dict = {}
        if ids:
            base_sql += " WHERE id = ANY(%(ids)s::uuid[])"
            params["ids"] = ids
        base_sql += " ORDER BY display_name ASC"

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(base_sql, params)
                return cur.fetchall()

    def get_profile_by_user_id(self, user_id: str) -> dict | None:
        sql = "SELECT id, user_id, display_name, team, avatar_url, role FROM public.profiles WHERE user_id = %(user_id)s"
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, {"user_id": user_id})
                return cur.fetchone()
