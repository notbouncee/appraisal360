from datetime import datetime

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    utc_timestamp: datetime
