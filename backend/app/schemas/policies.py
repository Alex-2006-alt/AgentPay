from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PolicyBase(BaseModel):
    max_transaction: float = Field(..., gt=0, example=0.10)
    daily_limit: float = Field(..., gt=0, example=2.00)
    monthly_limit: float = Field(..., gt=0, example=20.00)
    auto_payment: bool = Field(True, example=True)
    approved_services: str = Field("", example="srv_weather_01,srv_translate_01,srv_summarize_01")


class PolicyUpdate(PolicyBase):
    pass


class PolicyResponse(PolicyBase):
    id: str
    agent_id: str
    updated_at: datetime

    class Config:
        from_attributes = True
