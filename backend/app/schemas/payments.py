from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PaymentRequest(BaseModel):
    agent_id: str = Field(..., example="agent_primary")
    service_id: str = Field(..., example="srv_translate_01")
    amount: float = Field(..., gt=0, example=0.005)
    currency: str = Field("USDC", example="USDC")
    reason: Optional[str] = Field("Service Execution", example="Translate document")


class PaymentVerificationRequest(BaseModel):
    tx_hash: str = Field(..., example="0x4f8a12...9b")
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
