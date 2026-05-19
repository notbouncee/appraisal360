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

    def create(self, payload: dict) -> dict:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO public.review_cycles (year, quarter, title, description, start_date, end_date)
                    VALUES (%(year)s, %(quarter)s, %(title)s, %(description)s, %(start_date)s, %(end_date)s)
                    RETURNING id, year, quarter, title, description, start_date, end_date, created_at, updated_at
                    """,
                    payload,
                )
                return cur.fetchone()

    def update(self, cycle_id: str, payload: dict) -> dict | None:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE public.review_cycles
                    SET title = %(title)s,
                        description = %(description)s,
                        start_date = %(start_date)s,
                        end_date = %(end_date)s
                    WHERE id = %(id)s
                    RETURNING id, year, quarter, title, description, start_date, end_date, created_at, updated_at
                    """,
                    {"id": cycle_id, **payload},
                )
                return cur.fetchone()

    def delete(self, cycle_id: str) -> None:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM public.review_cycles WHERE id = %(id)s", {"id": cycle_id})
