from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.database.models import Policy
from app.schemas.policies import PolicyResponse, PolicyUpdate

router = APIRouter(prefix="/agents", tags=["Policies"])


@router.get("/{agent_id}/policies", response_model=PolicyResponse)
async def get_agent_policy(agent_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve active spending limits and whitelist guardrails for an agent."""
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
    agent_id: str, payload: PolicyUpdate, db: AsyncSession = Depends(get_db)
):
    """Update spending rules, limits, and whitelist controls for an agent."""
    result = await db.execute(select(Policy).where(Policy.agent_id == agent_id))
    policy = result.scalars().first()
    if not policy:
        # Create policy if missing
        policy = Policy(agent_id=agent_id, **payload.model_dump())
        db.add(policy)
    else:
        for key, value in payload.model_dump().items():
            setattr(policy, key, value)

    await db.commit()
    await db.refresh(policy)
    return policy
