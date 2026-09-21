from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth import current_user, owned_agent
from app.database.database import get_db
from app.database.models import Payment, Transaction
from app.payment_engine import pay, reconcile
import asyncio
from sqlalchemy import select
from app.blockchain.client import BlockchainClient
from app.config import settings
from app.database.models import PaymentOperation
from app.schemas.payments import PaymentRequest, PaymentResponse, PaymentVerificationRequest, PolicyDecisionResponse

router = APIRouter(prefix="/payments", tags=["Payments & Settlements"])


@router.post("/request", response_model=PolicyDecisionResponse)
async def request_payment(payload: PaymentRequest, db: AsyncSession = Depends(get_db),
                          user_id: str = Depends(current_user),
                          idempotency_key: str = Header(..., min_length=1, max_length=128)):
    return await pay(db, payload, user_id, idempotency_key)


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment_details(payment_id: str, db: AsyncSession = Depends(get_db),
                              user_id: str = Depends(current_user)):
    payment = await db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(404, "Payment not found")
    tx = await db.get(Transaction, payment.transaction_id)
    await owned_agent(db, tx.agent_id, user_id)
    return PaymentResponse(payment_id=payment.id, transaction_id=tx.id, agent_id=tx.agent_id,
        service_id=tx.service_id, amount=payment.amount, currency=payment.currency,
        status=payment.status, tx_hash=payment.tx_hash, created_at=payment.created_at)


@router.post("/{payment_id}/verify", response_model=PolicyDecisionResponse)
async def verify_payment(payment_id: str, payload: PaymentVerificationRequest,
                         db: AsyncSession = Depends(get_db), user_id: str = Depends(current_user)):
    return await reconcile(db, payment_id, user_id, payload.tx_hash)


@router.post("/{payment_id}/retry", response_model=PolicyDecisionResponse)
async def retry_payment(payment_id: str, db: AsyncSession = Depends(get_db), user_id: str = Depends(current_user)):
    """Rebroadcast only the original signed bytes, never sign a second transfer."""
    payment = await db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(404, "Payment not found")
    tx = await db.get(Transaction, payment.transaction_id)
    await owned_agent(db, tx.agent_id, user_id)
    op = (await db.execute(select(PaymentOperation).where(PaymentOperation.transaction_id == tx.id))).scalar_one_or_none()
    if not op or op.mode != "live" or op.chain_id != settings.CHAIN_ID or op.contract_address.lower() != settings.AGENTPAY_CONTRACT_ADDRESS.lower():
        raise HTTPException(409, "Retry requires the original live chain and contract configuration")
    if op.status == "pending" and op.signed_transaction:
        try:
            chain = BlockchainClient()
            await asyncio.to_thread(chain.check_network)
            await asyncio.to_thread(chain.broadcast, bytes.fromhex(op.signed_transaction))
        except Exception:
            # Already broadcast and transient failures both require receipt verification.
            pass
    return await reconcile(db, payment_id, user_id, payment.tx_hash)
