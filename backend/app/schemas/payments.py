from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from app.money import units


class PaymentRequest(BaseModel):
    agent_id: str = Field(..., example="agent_primary")
    service_id: str = Field(..., example="srv_translate_01")
    amount: float = Field(..., gt=0, example=0.005)
    currency: str = Field("USDC", example="USDC")
    reason: Optional[str] = Field("Service Execution", example="Translate document")

    @field_validator("amount")
    @classmethod
    def valid_amount(cls, value):
        units(value)
        return value


class PaymentVerificationRequest(BaseModel):
    tx_hash: str = Field(..., pattern=r"^0x[0-9a-fA-F]{64}$")
    payer_address: Optional[str] = None


class PaymentResponse(BaseModel):
    payment_id: str
    transaction_id: str
    agent_id: str
    service_id: str
    amount: float
    currency: str
    status: str
    tx_hash: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PolicyDecisionResponse(BaseModel):
    approved: bool
    reason: Optional[str] = None
    max_transaction: float
    current_daily_spend: float
    daily_limit: float
    payment: Optional[PaymentResponse] = None
