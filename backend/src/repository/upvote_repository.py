from src.client.db import get_connection


class UpvoteRepository:
    def count_received(self, upvoted_id: str) -> int:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) AS count FROM public.upvotes WHERE upvoted_id = %(upvoted_id)s", {"upvoted_id": upvoted_id})
                row = cur.fetchone()
        return int(row["count"])

    def list_received(self, upvoted_id: str, page: int | None = None, page_size: int | None = None) -> tuple[list[dict], int]:
        offset = (page or 0) * (page_size or 10)
        limit = page_size or 10

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) AS count FROM public.upvotes WHERE upvoted_id = %(upvoted_id)s", {"upvoted_id": upvoted_id})
                total = int(cur.fetchone()["count"])
                cur.execute(
                    """
                    SELECT id, voter_id, upvoted_id, message, created_at
                    FROM public.upvotes
                    WHERE upvoted_id = %(upvoted_id)s
                    ORDER BY created_at DESC
                    LIMIT %(limit)s OFFSET %(offset)s
                    """,
                    {"upvoted_id": upvoted_id, "limit": limit, "offset": offset},
                )
                rows = cur.fetchall()
        return rows, total

    def list_all(self) -> list[dict]:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, voter_id, upvoted_id, message, created_at
                    FROM public.upvotes
                    ORDER BY created_at DESC
                    """
                )
                return cur.fetchall()

    def insert(self, voter_id: str, upvoted_id: str, message: str) -> dict:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO public.upvotes (voter_id, upvoted_id, message)
                    VALUES (%(voter_id)s, %(upvoted_id)s, %(message)s)
                    RETURNING id, voter_id, upvoted_id, message, created_at
                    """,
                    {"voter_id": voter_id, "upvoted_id": upvoted_id, "message": message},
                )
                return cur.fetchone()
