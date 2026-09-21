from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.database.models import Service, Transaction, Wallet, Agent
from app.auth import current_user, owned_agent
from app.schemas.transactions import AnalyticsSummary, TransactionResponse

router = APIRouter(prefix="/transactions", tags=["Transactions & Analytics"])


@router.get("/analytics", response_model=AnalyticsSummary)
async def get_analytics_summary(db: AsyncSession = Depends(get_db), user_id: str = Depends(current_user)):
    """Retrieve comprehensive spending and transaction metrics for the dashboard."""
    owned_ids = select(Agent.id).where(Agent.user_id == user_id)
    now = datetime.utcnow()
    one_day_ago = now - timedelta(days=1)
    one_month_ago = now - timedelta(days=30)

    # Total spend
    res_total = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0.0)).where(
            Transaction.status.in_(["completed", "simulated"]), Transaction.agent_id.in_(owned_ids)
        )
    )
    total_spend = float(res_total.scalar() or 0.0)

    # Daily spend
    res_daily = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0.0)).where(
            Transaction.status.in_(["completed", "simulated"]), Transaction.agent_id.in_(owned_ids),
            Transaction.created_at >= one_day_ago,
        )
    )
    daily_spend = float(res_daily.scalar() or 0.0)

    # Monthly spend
    res_monthly = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0.0)).where(
            Transaction.status.in_(["completed", "simulated"]), Transaction.agent_id.in_(owned_ids),
            Transaction.created_at >= one_month_ago,
        )
    )
    monthly_spend = float(res_monthly.scalar() or 0.0)

    # Counts
    res_all_tx = await db.execute(select(func.count(Transaction.id)).where(Transaction.agent_id.in_(owned_ids)))
    total_tx = int(res_all_tx.scalar() or 0)

    res_succ_tx = await db.execute(
        select(func.count(Transaction.id)).where(Transaction.status.in_(["completed", "simulated"]), Transaction.agent_id.in_(owned_ids))
    )
    succ_tx = int(res_succ_tx.scalar() or 0)

    res_fail_tx = await db.execute(
        select(func.count(Transaction.id)).where(Transaction.status.in_(["rejected", "failed"]), Transaction.agent_id.in_(owned_ids))
    )
    fail_tx = int(res_fail_tx.scalar() or 0)

    # Active services
    res_services = await db.execute(
        select(func.count(Service.id)).where(Service.status == "active")
    )
    active_services_count = int(res_services.scalar() or 0)

    # Wallet balance
    res_wallet = await db.execute(select(func.coalesce(func.sum(Wallet.balance), 0)).where(Wallet.agent_id.in_(owned_ids)))
    wallet_balance = float(res_wallet.scalar())

    return AnalyticsSummary(
        total_spend=round(total_spend, 4),
        daily_spend=round(daily_spend, 4),
        monthly_spend=round(monthly_spend, 4),
        total_transactions=total_tx,
        successful_transactions=succ_tx,
        failed_transactions=fail_tx,
        active_services_count=active_services_count,
        wallet_balance=round(wallet_balance, 4),
    )


@router.get("", response_model=List[TransactionResponse])
async def list_transactions(
    status: Optional[str] = Query(None, description="Filter by status"),
    agent_id: Optional[str] = Query(None, description="Filter by agent"),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(current_user),
):
    """Retrieve transaction history with associated service metadata."""
    query = select(Transaction, Service.name.label("service_name")).outerjoin(
        Service, Transaction.service_id == Service.id
    )

    query = query.where(Transaction.agent_id.in_(select(Agent.id).where(Agent.user_id == user_id)))
    if status:
        query = query.where(Transaction.status == status)
    if agent_id:
        query = query.where(Transaction.agent_id == agent_id)

    query = query.order_by(Transaction.created_at.desc()).limit(limit)
    result = await db.execute(query)

    transactions = []
    for row in result.all():
        tx = row[0]
        service_name = row[1] or tx.service_id
        transactions.append(
            TransactionResponse(
                id=tx.id,
                agent_id=tx.agent_id,
                service_id=tx.service_id,
                service_name=service_name,
                amount=tx.amount,
                currency=tx.currency,
                status=tx.status,
                rejection_reason=tx.rejection_reason,
                tx_hash=tx.tx_hash,
                block_number=tx.block_number,
                created_at=tx.created_at,
            )
        )
    return transactions


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(transaction_id: str, db: AsyncSession = Depends(get_db), user_id: str = Depends(current_user)):
    """Retrieve detailed transaction audit records."""
    tx = await db.get(Transaction, transaction_id)
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction '{transaction_id}' not found",
        )
    await owned_agent(db, tx.agent_id, user_id)
    service = await db.get(Service, tx.service_id)
    return TransactionResponse(
        id=tx.id,
        agent_id=tx.agent_id,
        service_id=tx.service_id,
        service_name=service.name if service else tx.service_id,
        amount=tx.amount,
        currency=tx.currency,
        status=tx.status,
        rejection_reason=tx.rejection_reason,
        tx_hash=tx.tx_hash,
        block_number=tx.block_number,
        created_at=tx.created_at,
    )
