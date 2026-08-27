from typing import Any, Optional
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    database: str
    timestamp: str


class StandardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
