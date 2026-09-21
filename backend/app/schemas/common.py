from typing import Any, Optional
from pydantic import BaseModel


class HealthResponse(BaseModel):
    payment_mode: str
    chain_id: int
    status: str
    version: str
    environment: str
    database: str
    timestamp: str


class StandardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
