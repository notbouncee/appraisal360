from src.client.db import get_connection


class ReactionRepository:
    def list_all(self) -> list[dict]:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, appreciation_id, user_id, emoji, created_at
                    FROM public.appreciation_reactions
                    ORDER BY created_at DESC
                    """
                )
                return cur.fetchall()

    def upsert(self, appreciation_id: str, user_id: str, emoji: str) -> dict:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO public.appreciation_reactions (appreciation_id, user_id, emoji)
                    VALUES (%(appreciation_id)s, %(user_id)s, %(emoji)s)
                    ON CONFLICT (appreciation_id, user_id)
                    DO UPDATE SET emoji = EXCLUDED.emoji
                    RETURNING id, appreciation_id, user_id, emoji, created_at
                    """,
                    {"appreciation_id": appreciation_id, "user_id": user_id, "emoji": emoji},
                )
                return cur.fetchone()

    def delete_for_user(self, appreciation_id: str, user_id: str) -> None:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM public.appreciation_reactions WHERE appreciation_id = %(appreciation_id)s AND user_id = %(user_id)s",
                    {"appreciation_id": appreciation_id, "user_id": user_id},
                )
