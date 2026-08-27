from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AgentBase(BaseModel):
    name: str = Field(..., example="Primary Autonome")
    status: str = Field("active", example="active")
    wallet_address: str = Field(..., example="0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7")


class AgentCreate(AgentBase):
    user_id: str = Field(..., example="user_default")


class AgentResponse(AgentBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class WalletResponse(BaseModel):
    id: str
    agent_id: str
    address: str
    network: str
    chain_id: int
    balance: float
    currency: str
    updated_at: datetime

    class Config:
        from_attributes = True
