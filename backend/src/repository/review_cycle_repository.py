from src.client.db import get_connection


class ReviewCycleRepository:
    def list_by_year(self, year: int) -> list[dict]:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, year, quarter, title, description, start_date, end_date, created_at, updated_at
                    FROM public.review_cycles
                    WHERE year = %(year)s
                    ORDER BY quarter ASC
                    """,
                    {"year": year},
                )
                return cur.fetchall()
