from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TransactionResponse(BaseModel):
    id: str
    agent_id: str
    service_id: str
    service_name: Optional[str] = None
    amount: float
    currency: str
    status: str
    rejection_reason: Optional[str] = None
    tx_hash: Optional[str] = None
    block_number: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AnalyticsSummary(BaseModel):
    total_spend: float
    daily_spend: float
    monthly_spend: float
    total_transactions: int
    successful_transactions: int
    failed_transactions: int
    active_services_count: int
    wallet_balance: float
