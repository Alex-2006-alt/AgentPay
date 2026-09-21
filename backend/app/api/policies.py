from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.database.models import Policy
from app.schemas.policies import PolicyResponse, PolicyUpdate
from app.auth import current_user, owned_agent
from app.database.locking import agent_transaction
from app.database.models import Service, PaymentOperation
from app.config import settings
from app.blockchain.client import BlockchainClient
import asyncio

router = APIRouter(prefix="/agents", tags=["Policies"])


@router.get("/{agent_id}/policies", response_model=PolicyResponse)
async def get_agent_policy(agent_id: str, db: AsyncSession = Depends(get_db), user_id: str = Depends(current_user)):
    """Retrieve active spending limits and whitelist guardrails for an agent."""
    await owned_agent(db, agent_id, user_id)
    result = await db.execute(select(Policy).where(Policy.agent_id == agent_id))
    policy = result.scalars().first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy configuration for agent '{agent_id}' not found",
        )
    return policy


@router.put("/{agent_id}/policies", response_model=PolicyResponse)
async def update_agent_policy(
    agent_id: str, payload: PolicyUpdate, db: AsyncSession = Depends(get_db), user_id: str = Depends(current_user)
):
    """Update spending rules, limits, and whitelist controls for an agent."""
    async with agent_transaction(db, agent_id):
        agent = await owned_agent(db, agent_id, user_id)
        policy = (await db.execute(select(Policy).where(Policy.agent_id == agent_id))).scalar_one_or_none()
        if not policy:
            policy = Policy(agent_id=agent_id)
            db.add(policy)
        services = (await db.execute(select(Service))).scalars().all()
        allowed = {s.strip() for s in payload.approved_services.split(",") if s.strip()}
        if "*" not in allowed and not allowed.issubset({s.id for s in services}):
            raise HTTPException(422, "Whitelist contains unknown service IDs")
        if settings.PAYMENT_MODE == "live":
            pending = (await db.execute(select(PaymentOperation.id).where(
                PaymentOperation.agent_id == agent_id, PaymentOperation.status == "pending"))).first()
            if pending:
                raise HTTPException(409, "Resolve pending payments before changing the live policy")
            approvals = {}
            for service in services:
                if service.wallet_address:
                    address = service.wallet_address.lower()
                    approvals[address] = approvals.get(address, False) or "*" in allowed or service.id in allowed
            try:
                await asyncio.to_thread(BlockchainClient().sync_policy, agent.wallet_address, payload, approvals)
            except Exception as exc:
                raise HTTPException(503, "On-chain policy synchronization failed; payments fail closed until synchronized") from exc
        for key, value in payload.model_dump().items():
            setattr(policy, key, value)
        await db.flush()
        await db.refresh(policy)
    return policy
