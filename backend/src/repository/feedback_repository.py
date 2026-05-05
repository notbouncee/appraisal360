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

    def list_for_export(
        self,
        start_date: str | None = None,
        end_date: str | None = None,
        recipient_id: str | None = None,
        author_id: str | None = None,
        is_anonymous: bool | None = None,
    ) -> list[dict]:
        conditions: list[str] = []
        params: dict = {}

        if start_date:
            conditions.append("created_at >= %(start_date)s")
            params["start_date"] = start_date
        if end_date:
            conditions.append("created_at <= %(end_date)s")
            params["end_date"] = end_date
        if recipient_id:
            conditions.append("recipient_id = %(recipient_id)s")
            params["recipient_id"] = recipient_id
        if author_id:
            conditions.append("author_id = %(author_id)s")
            params["author_id"] = author_id
        if is_anonymous is not None:
            conditions.append("is_anonymous = %(is_anonymous)s")
            params["is_anonymous"] = is_anonymous

        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)

        sql = f"""
        SELECT id, author_id, recipient_id, situation, behaviour, impact, optional, is_anonymous, created_at
        FROM public.feedback
        {where_clause}
        ORDER BY created_at DESC
        """

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                return cur.fetchall()
