from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.database.models import Agent, Policy, User, Wallet
from app.schemas.agents import AgentCreate, AgentResponse, WalletResponse

router = APIRouter(prefix="/agents", tags=["Agents"])


@router.get("", response_model=List[AgentResponse])
async def list_agents(db: AsyncSession = Depends(get_db)):
    """List all registered autonomous agents."""
    result = await db.execute(select(Agent))
    return result.scalars().all()


@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(payload: AgentCreate, db: AsyncSession = Depends(get_db)):
    """Create and provision a new autonomous AI agent with wallet and policy."""
    user = await db.get(User, payload.user_id)
    if not user:
        # Auto-create demo user if not found
        user = User(id=payload.user_id, wallet_address=payload.wallet_address)
        db.add(user)
        await db.flush()

    new_agent = Agent(**payload.model_dump())
    db.add(new_agent)
    await db.flush()

    # Automatically provision agent wallet
    agent_wallet = Wallet(
        agent_id=new_agent.id,
        address=new_agent.wallet_address,
        balance=10.00,
        currency="USDC",
    )
    db.add(agent_wallet)

    # Automatically provision default security policy
    agent_policy = Policy(
        agent_id=new_agent.id,
        max_transaction=0.10,
        daily_limit=2.00,
        monthly_limit=20.00,
        auto_payment=True,
        approved_services="*",
    )
    db.add(agent_policy)

    await db.commit()
    await db.refresh(new_agent)
    return new_agent


@router.get("/{agent_id}/wallet", response_model=WalletResponse)
async def get_agent_wallet(agent_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve the financial wallet state and balance of an agent."""
    result = await db.execute(select(Wallet).where(Wallet.agent_id == agent_id))
    wallet = result.scalars().first()
    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Wallet for agent '{agent_id}' not found",
        )
    return wallet
