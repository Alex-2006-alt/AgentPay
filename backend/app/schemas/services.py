from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from app.money import units
from web3 import Web3


class ServiceBase(BaseModel):
    name: str = Field(..., example="Neural Polyglot Translation")
    description: Optional[str] = Field(None, example="Fast translation API")
    category: str = Field("General", example="Language")
    endpoint: str = Field(..., example="/api/demo/translate")
    price: float = Field(..., gt=0, example=0.005)
    currency: str = Field("USDC", example="USDC")
    provider_id: str = Field(..., example="provider_official")


class ServiceCreate(ServiceBase):
    wallet_address: str

    @field_validator("price")
    @classmethod
    def valid_price(cls, value):
        units(value)
        return value

    @field_validator("wallet_address")
    @classmethod
    def valid_address(cls, value):
        if not Web3.is_address(value) or int(value, 16) == 0:
            raise ValueError("A valid recipient address is required")
        return Web3.to_checksum_address(value)


class ServiceResponse(ServiceBase):
    id: str
    rating: float
    success_rate: float
    average_response_time: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
