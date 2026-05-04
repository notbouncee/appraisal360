from datetime import date, datetime
from uuid import UUID


def _serialize(value):
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


def row_to_dict(row: dict) -> dict:
    return {k: _serialize(v) for k, v in row.items()}


def rows_to_dicts(rows: list[dict]) -> list[dict]:
    return [row_to_dict(row) for row in rows]
