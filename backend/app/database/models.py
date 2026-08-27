from datetime import datetime
import uuid
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    wallet_address = Column(String(64), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    agents = relationship("Agent", back_populates="user", cascade="all, delete-orphan")


class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    name = Column(String(128), nullable=False)
    status = Column(String(32), default="active")  # active, paused, disabled
    wallet_address = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="agents")
    wallet = relationship("Wallet", back_populates="agent", uselist=False, cascade="all, delete-orphan")
    policy = relationship("Policy", back_populates="agent", uselist=False, cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="agent", cascade="all, delete-orphan")


class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    agent_id = Column(String(64), ForeignKey("agents.id"), unique=True, nullable=False)
    address = Column(String(64), nullable=False)
    network = Column(String(64), default="Arbitrum Sepolia")
    chain_id = Column(Integer, default=421614)
    balance = Column(Float, default=10.00)
    currency = Column(String(16), default="USDC")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    agent = relationship("Agent", back_populates="wallet")


class Policy(Base):
    __tablename__ = "policies"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    agent_id = Column(String(64), ForeignKey("agents.id"), unique=True, nullable=False)
    max_transaction = Column(Float, default=0.10)
    daily_limit = Column(Float, default=2.00)
    monthly_limit = Column(Float, default=20.00)
    auto_payment = Column(Boolean, default=True)
    approved_services = Column(Text, default="")  # comma-separated service IDs or '*'
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    agent = relationship("Agent", back_populates="policy")


class Provider(Base):
    __tablename__ = "providers"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(128), nullable=False)
    website = Column(String(256), nullable=True)
    is_verified = Column(Boolean, default=True)
    reputation = Column(Float, default=5.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    services = relationship("Service", back_populates="provider", cascade="all, delete-orphan")


class Service(Base):
    __tablename__ = "services"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    provider_id = Column(String(64), ForeignKey("providers.id"), nullable=False)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(64), default="General")
    endpoint = Column(String(256), nullable=False)
    price = Column(Float, nullable=False)
    currency = Column(String(16), default="USDC")
    rating = Column(Float, default=4.8)
    success_rate = Column(Float, default=99.0)
    average_response_time = Column(Float, default=100.0)  # ms
    status = Column(String(32), default="active")  # active, degraded, maintenance
    created_at = Column(DateTime, default=datetime.utcnow)

    provider = relationship("Provider", back_populates="services")
    transactions = relationship("Transaction", back_populates="service")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    agent_id = Column(String(64), ForeignKey("agents.id"), nullable=False)
    service_id = Column(String(64), ForeignKey("services.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(16), default="USDC")
    status = Column(String(32), default="pending")  # approved, rejected, pending, completed, failed
    rejection_reason = Column(String(256), nullable=True)
    tx_hash = Column(String(128), nullable=True)
    block_number = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    agent = relationship("Agent", back_populates="transactions")
    service = relationship("Service", back_populates="transactions")
    payment = relationship("Payment", back_populates="transaction", uselist=False, cascade="all, delete-orphan")
    service_calls = relationship("ServiceCall", back_populates="transaction", cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    transaction_id = Column(String(64), ForeignKey("transactions.id"), unique=True, nullable=False)
    payer_address = Column(String(64), nullable=False)
    recipient_address = Column(String(64), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(16), default="USDC")
    tx_hash = Column(String(128), nullable=True)
    nonce = Column(String(64), nullable=True)
    status = Column(String(32), default="initiated")  # initiated, verified, failed
    created_at = Column(DateTime, default=datetime.utcnow)

    transaction = relationship("Transaction", back_populates="payment")


class ServiceCall(Base):
    __tablename__ = "service_calls"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    transaction_id = Column(String(64), ForeignKey("transactions.id"), nullable=False)
    service_id = Column(String(64), ForeignKey("services.id"), nullable=False)
    request_payload = Column(Text, nullable=True)
    response_payload = Column(Text, nullable=True)
    latency_ms = Column(Float, default=0.0)
    status = Column(String(32), default="success")  # success, error, timeout
    created_at = Column(DateTime, default=datetime.utcnow)

    transaction = relationship("Transaction", back_populates="service_calls")
