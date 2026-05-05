from src.client.db import get_connection


class FeedbackQuestionRepository:
    def list_all(self) -> list[dict]:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, label, description, is_required, sort_order, is_active, created_at, updated_at
                    FROM public.feedback_questions
                    ORDER BY sort_order ASC, created_at ASC
                    """
                )
                return cur.fetchall()

    def create(self, label: str, description: str, is_required: bool, sort_order: int, is_active: bool) -> dict:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO public.feedback_questions (label, description, is_required, sort_order, is_active)
                    VALUES (%(label)s, %(description)s, %(is_required)s, %(sort_order)s, %(is_active)s)
                    RETURNING id, label, description, is_required, sort_order, is_active, created_at, updated_at
                    """,
                    {
                        "label": label,
                        "description": description,
                        "is_required": is_required,
                        "sort_order": sort_order,
                        "is_active": is_active,
                    },
                )
                return cur.fetchone()

    def update(self, question_id: str, label: str, description: str, is_required: bool, sort_order: int, is_active: bool) -> dict | None:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE public.feedback_questions
                    SET label = %(label)s,
                        description = %(description)s,
                        is_required = %(is_required)s,
                        sort_order = %(sort_order)s,
                        is_active = %(is_active)s
                    WHERE id = %(id)s
                    RETURNING id, label, description, is_required, sort_order, is_active, created_at, updated_at
                    """,
                    {
                        "id": question_id,
                        "label": label,
                        "description": description,
                        "is_required": is_required,
                        "sort_order": sort_order,
                        "is_active": is_active,
                    },
                )
                return cur.fetchone()

    def delete(self, question_id: str) -> None:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM public.feedback_questions WHERE id = %(id)s", {"id": question_id})
