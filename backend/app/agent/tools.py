import secrets
from typing import List, Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import Agent, Payment, Policy, Service, Transaction, Wallet
from app.schemas.agent_task import ExecutionStep


class AgentTools:
    """
    Encapsulates the tools available to the Agent.
    """
    
    @staticmethod
    async def get_agent_context(db: AsyncSession, agent_id: str) -> Tuple[Agent, Policy, Wallet]:
        agent = await db.get(Agent, agent_id)
        if not agent:
            # Fallback to first agent
            res_agent = await db.execute(select(Agent).limit(1))
            agent = res_agent.scalars().first()
            agent_id = agent.id if agent else "agent_primary"

        res_policy = await db.execute(select(Policy).where(Policy.agent_id == agent_id))
        policy = res_policy.scalars().first()

        res_wallet = await db.execute(select(Wallet).where(Wallet.agent_id == agent_id))
        wallet = res_wallet.scalars().first()
        
        return agent, policy, wallet

    @staticmethod
    async def discover_services(db: AsyncSession, service_ids: List[str]) -> List[Service]:
        """Looks up the provided service IDs in the marketplace."""
        if not service_ids:
            return []
        res_services = await db.execute(select(Service).where(Service.id.in_(service_ids)))
        return res_services.scalars().all()

    @staticmethod
    async def record_transaction(
        db: AsyncSession, 
        agent_id: str, 
        service_id: str, 
        amount: float, 
        status: str, 
        rejection_reason: Optional[str] = None,
        tx_hash: Optional[str] = None
    ) -> Transaction:
        """Records a transaction in the database."""
        tx = Transaction(
            agent_id=agent_id,
            service_id=service_id,
            amount=amount,
            currency="USDC",
            status=status,
            rejection_reason=rejection_reason,
            tx_hash=tx_hash,
            block_number=18492042 if tx_hash else None,
        )
        db.add(tx)
        await db.flush()
        return tx

    @staticmethod
    async def process_payment(
        db: AsyncSession, 
        tx: Transaction, 
        wallet: Wallet, 
        agent: Agent, 
        amount: float
    ) -> Payment:
        """Processes the payment and updates wallet balance."""
        mock_tx_hash = tx.tx_hash or f"0x{secrets.token_hex(32)}"
        payment = Payment(
            transaction_id=tx.id,
            payer_address=wallet.address if wallet else agent.wallet_address,
            recipient_address="0x1234567890123456789012345678901234567890",
            amount=amount,
            currency="USDC",
            tx_hash=mock_tx_hash,
            nonce=secrets.token_hex(8),
            status="verified",
        )
        db.add(payment)
        
        if wallet:
            wallet.balance = max(0.0, wallet.balance - amount)
            
        await db.flush()
        return payment

