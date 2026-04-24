from src.client.db import get_connection


class FeedbackRepository:
    def count_received(self, recipient_id: str) -> int:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) AS count FROM public.feedback WHERE recipient_id = %(recipient_id)s", {"recipient_id": recipient_id})
                row = cur.fetchone()
        return int(row["count"])

    def list_received(self, recipient_id: str, page: int | None = None, page_size: int | None = None) -> tuple[list[dict], int]:
        offset = (page or 0) * (page_size or 10)
        limit = page_size or 10

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) AS count FROM public.feedback WHERE recipient_id = %(recipient_id)s", {"recipient_id": recipient_id})
                total = int(cur.fetchone()["count"])
                cur.execute(
                    """
                    SELECT id, situation, behaviour, impact, optional, created_at, author_id, recipient_id, is_anonymous
                    FROM public.feedback
                    WHERE recipient_id = %(recipient_id)s
                    ORDER BY created_at DESC
                    LIMIT %(limit)s OFFSET %(offset)s
                    """,
                    {"recipient_id": recipient_id, "limit": limit, "offset": offset},
                )
                rows = cur.fetchall()
        return rows, total

    def insert_many(self, rows: list[dict]) -> None:
        sql = """
        INSERT INTO public.feedback (author_id, recipient_id, situation, behaviour, impact, optional, is_anonymous)
        VALUES (%(author_id)s, %(recipient_id)s, %(situation)s, %(behaviour)s, %(impact)s, %(optional)s, %(is_anonymous)s)
        """
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.executemany(sql, rows)
