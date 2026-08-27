from datetime import datetime, timedelta
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.database.models import Agent, Payment, Policy, Service, Transaction, Wallet
from app.schemas.payments import (
    PaymentRequest,
    PaymentResponse,
    PaymentVerificationRequest,
    PolicyDecisionResponse,
)

router = APIRouter(prefix="/payments", tags=["Payments & Settlements"])


@router.post("/request", response_model=PolicyDecisionResponse)
async def request_payment(payload: PaymentRequest, db: AsyncSession = Depends(get_db)):
    """Evaluate payment request through deterministic policy engine and process transaction if approved."""
    # 1. Fetch Agent, Wallet, and Policy
    agent = await db.get(Agent, payload.agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent '{payload.agent_id}' not found",
        )

    res_wallet = await db.execute(select(Wallet).where(Wallet.agent_id == payload.agent_id))
    wallet = res_wallet.scalars().first()

    res_policy = await db.execute(select(Policy).where(Policy.agent_id == payload.agent_id))
    policy = res_policy.scalars().first()

    res_service = await db.get(Service, payload.service_id)

    max_tx = policy.max_transaction if policy else 0.10
    daily_limit = policy.daily_limit if policy else 2.00
    approved_services_str = policy.approved_services if policy else "*"

    # 2. Calculate rolling 24-hour spend
    yesterday = datetime.utcnow() - timedelta(days=1)
    res_spend = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0.0)).where(
            Transaction.agent_id == payload.agent_id,
            Transaction.status.in_(["approved", "completed"]),
            Transaction.created_at >= yesterday,
        )
    )
    current_daily_spend = float(res_spend.scalar() or 0.0)

    # 3. Policy Rule Checks
    rejection_reason = None

    # Check: Service exists & status active
    if not res_service:
        rejection_reason = f"Service '{payload.service_id}' does not exist"
    elif res_service.status != "active":
        rejection_reason = f"Service '{res_service.name}' is currently offline/inactive"

    # Check: Service Whitelist
    elif (
        approved_services_str != "*"
        and approved_services_str.strip() != ""
        and payload.service_id not in [s.strip() for s in approved_services_str.split(",") if s.strip()]
    ):
        rejection_reason = f"Service '{payload.service_id}' is not in approved whitelist"

    # Check: Max Transaction Limit
    elif payload.amount > max_tx:
        rejection_reason = (
            f"Transaction amount ${payload.amount:.4f} exceeds max per-tx limit of ${max_tx:.2f}"
        )

    # Check: Daily Limit
    elif (current_daily_spend + payload.amount) > daily_limit:
        rejection_reason = (
            f"Transaction would exceed daily limit of ${daily_limit:.2f} (Current 24h spend: ${current_daily_spend:.4f})"
        )

    # Check: Wallet Balance
    elif wallet and wallet.balance < payload.amount:
        rejection_reason = (
            f"Insufficient wallet balance (${wallet.balance:.4f} < ${payload.amount:.4f})"
        )

    # 4. Handle Rejection
    if rejection_reason:
        tx = Transaction(
            agent_id=payload.agent_id,
            service_id=payload.service_id,
            amount=payload.amount,
            currency=payload.currency,
            status="rejected",
            rejection_reason=rejection_reason,
        )
        db.add(tx)
        await db.commit()

        return PolicyDecisionResponse(
            approved=False,
            reason=rejection_reason,
            max_transaction=max_tx,
            current_daily_spend=current_daily_spend,
            daily_limit=daily_limit,
            payment=None,
        )

    # 5. Handle Approval: Deduct wallet balance & generate mock blockchain tx_hash
    mock_tx_hash = f"0x{secrets.token_hex(32)}"
    tx = Transaction(
        agent_id=payload.agent_id,
        service_id=payload.service_id,
        amount=payload.amount,
        currency=payload.currency,
        status="completed",
        tx_hash=mock_tx_hash,
        block_number=18492040,
    )
    db.add(tx)
    await db.flush()

    # Deduct from wallet balance
    if wallet:
        wallet.balance = max(0.0, wallet.balance - payload.amount)

    payment = Payment(
        transaction_id=tx.id,
        payer_address=wallet.address if wallet else agent.wallet_address,
        recipient_address="0x1234567890123456789012345678901234567890",
        amount=payload.amount,
        currency=payload.currency,
        tx_hash=mock_tx_hash,
        nonce=secrets.token_hex(8),
        status="verified",
    )
    db.add(payment)
    await db.commit()
    await db.refresh(tx)

    payment_resp = PaymentResponse(
        payment_id=payment.id,
        transaction_id=tx.id,
        agent_id=tx.agent_id,
        service_id=tx.service_id,
        amount=tx.amount,
        currency=tx.currency,
        status=tx.status,
        tx_hash=tx.tx_hash,
        created_at=tx.created_at,
    )

    return PolicyDecisionResponse(
        approved=True,
        reason="Passed all policy guardrail checks",
        max_transaction=max_tx,
        current_daily_spend=current_daily_spend + payload.amount,
        daily_limit=daily_limit,
        payment=payment_resp,
    )


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment_details(payment_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve detailed payment settlement status."""
    payment = await db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment record '{payment_id}' not found",
        )
    tx = await db.get(Transaction, payment.transaction_id)
    return PaymentResponse(
        payment_id=payment.id,
        transaction_id=payment.transaction_id,
        agent_id=tx.agent_id if tx else "",
        service_id=tx.service_id if tx else "",
        amount=payment.amount,
        currency=payment.currency,
        status=payment.status,
        tx_hash=payment.tx_hash,
        created_at=payment.created_at,
    )


@router.post("/{payment_id}/verify")
async def verify_payment(
    payment_id: str,
    payload: PaymentVerificationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Verify blockchain transaction hash for settlement confirmation."""
    payment = await db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment record '{payment_id}' not found",
        )

    # In production, web3.py verifies receipt on Arbitrum/Base Sepolia
    payment.status = "verified"
    payment.tx_hash = payload.tx_hash
    await db.commit()

    return {
        "payment_id": payment_id,
        "verified": True,
        "tx_hash": payload.tx_hash,
        "status": "confirmed_on_chain",
    }
