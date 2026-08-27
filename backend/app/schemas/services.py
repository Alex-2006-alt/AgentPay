from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ServiceBase(BaseModel):
    name: str = Field(..., example="Neural Polyglot Translation")
    description: Optional[str] = Field(None, example="Fast translation API")
    category: str = Field("General", example="Language")
    endpoint: str = Field(..., example="/api/demo/translate")
    price: float = Field(..., gt=0, example=0.005)
    currency: str = Field("USDC", example="USDC")
    provider_id: str = Field(..., example="provider_official")


class ServiceCreate(ServiceBase):
    pass


class ServiceResponse(ServiceBase):
    id: str
    rating: float
    success_rate: float
    average_response_time: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
