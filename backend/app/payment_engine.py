import asyncio
import hashlib
import json
import logging
from datetime import datetime, timedelta
from fastapi import HTTPException
from sqlalchemy import select, or_, func
from app.auth import owned_agent
from app.blockchain.client import BlockchainClient
from app.config import settings
from app.database.locking import agent_transaction
from app.database.models import Agent, LedgerAccount, PaymentOperation, Payment, Policy, Service, Transaction, Wallet
from app.money import units, dollars
from app.schemas.payments import PaymentResponse, PolicyDecisionResponse

logger = logging.getLogger(__name__)
SPENDING = ("pending", "completed", "simulated")


async def spend(db, agent_id, days):
    cutoff = datetime.utcnow() - timedelta(days=days)
    operations = (await db.execute(select(PaymentOperation).where(
        PaymentOperation.agent_id == agent_id, PaymentOperation.status.in_(SPENDING),
        or_(PaymentOperation.created_at >= cutoff, PaymentOperation.status == "pending")))).scalars().all()
    # Preserve historical spend without treating legacy mock hashes as proof.
    historical = (await db.execute(select(Transaction.amount).where(
        Transaction.agent_id == agent_id, Transaction.status.in_(["approved", "completed"]),
        Transaction.created_at >= cutoff,
        ~Transaction.id.in_(select(PaymentOperation.transaction_id))))).scalars().all()
    return sum(op.amount_units for op in operations) + sum(units(round(amount, 6)) for amount in historical)


async def response_for(db, op, policy):
    tx = await db.get(Transaction, op.transaction_id)
    payment = (await db.execute(select(Payment).where(Payment.transaction_id == tx.id))).scalar_one()
    return PolicyDecisionResponse(
        approved=op.status in SPENDING,
        reason=tx.rejection_reason or ("Simulation only; no blockchain payment" if op.mode == "simulation" else op.status),
        max_transaction=policy.max_transaction,
        current_daily_spend=dollars(await spend(db, op.agent_id, 1)), daily_limit=policy.daily_limit,
        payment=PaymentResponse(payment_id=payment.id, transaction_id=tx.id, agent_id=tx.agent_id,
            service_id=tx.service_id, amount=tx.amount, currency=tx.currency,
            status=op.status, tx_hash=tx.tx_hash, created_at=tx.created_at),
    )


async def pay(db, payload, user_id, request_key):
    """Reserve funds once, persist a signed hash, then broadcast outside the DB transaction."""
    raw = None
    chain = None
    fingerprint = hashlib.sha256(json.dumps({"agent": payload.agent_id, "service": payload.service_id,
        "amount": units(payload.amount), "currency": payload.currency}, sort_keys=True).encode()).hexdigest()
    async with agent_transaction(db, payload.agent_id):
        agent = await owned_agent(db, payload.agent_id, user_id)
        policy = (await db.execute(select(Policy).where(Policy.agent_id == agent.id))).scalar_one_or_none()
        wallet = (await db.execute(select(Wallet).where(Wallet.agent_id == agent.id))).scalar_one_or_none()
        if not policy or not wallet:
            raise HTTPException(409, "Agent requires a wallet and policy")
        key = f"{agent.id}:{request_key}"
        existing = (await db.execute(select(PaymentOperation).where(PaymentOperation.request_key == key))).scalar_one_or_none()
        if existing:
            if existing.fingerprint != fingerprint:
                raise HTTPException(409, "Idempotency key was already used for a different payment")
            return await response_for(db, existing, policy)
        service = await db.get(Service, payload.service_id)
        if not service:
            raise HTTPException(404, "Service not found")
        amount = units(payload.amount)
        account = await db.get(LedgerAccount, agent.id)
        if not account:
            if settings.PAYMENT_MODE == "live":
                raise HTTPException(409, "Provision a live ledger from the funded signing wallet first")
            account = LedgerAccount(agent_id=agent.id, balance_units=units(round(wallet.balance, 6)), mode=settings.PAYMENT_MODE)
            db.add(account)
        if account.mode != settings.PAYMENT_MODE:
            raise HTTPException(409, "Use a separately provisioned agent and ledger for this payment mode")
        if settings.PAYMENT_MODE == "live":
            if account.chain_id != settings.CHAIN_ID or account.token_address.lower() != settings.MOCK_USDC_CONTRACT_ADDRESS.lower():
                raise HTTPException(409, "Live ledger belongs to a different chain or token")
            duplicates = (await db.execute(select(func.count(Agent.id)).where(
                func.lower(Agent.wallet_address) == agent.wallet_address.lower()))).scalar_one()
            if duplicates != 1:
                raise HTTPException(409, "Live signer wallet must belong to exactly one agent")
        daily = await spend(db, agent.id, 1)
        monthly = await spend(db, agent.id, 30)
        allowed = {value.strip() for value in policy.approved_services.split(",") if value.strip()}
        reason = None
        if agent.status != "active": reason = "Agent is not active"
        elif not policy.auto_payment: reason = "Automatic payments are disabled"
        elif service.status != "active": reason = "Service is not active"
        elif "*" not in allowed and service.id not in allowed: reason = "Service is not in approved whitelist"
        elif payload.currency != "USDC" or service.currency != "USDC": reason = "Only USDC payments are supported"
        elif amount != units(service.price): reason = "Payment amount must match the registered service price"
        elif amount > units(policy.max_transaction): reason = "Amount exceeds max per-tx limit"
        elif daily + amount > units(policy.daily_limit): reason = "Payment would exceed daily limit"
        elif monthly + amount > units(policy.monthly_limit): reason = "Payment would exceed monthly limit"
        elif amount > account.balance_units: reason = "Insufficient wallet balance"
        elif not service.wallet_address: reason = "Service has no recipient wallet"
        if not reason and settings.PAYMENT_MODE == "live":
            # A single signer cannot have concurrent unresolved nonces. Pending
            # operations reserve budget until verified, including across restarts.
            pending = (await db.execute(select(PaymentOperation.id).where(
                PaymentOperation.agent_id == agent.id, PaymentOperation.status == "pending"))).first()
            if pending:
                reason = "Resolve the pending payment before creating another live payment"
        tx = Transaction(agent_id=agent.id, service_id=service.id, amount=dollars(amount), currency="USDC",
                         status="rejected" if reason else "pending", rejection_reason=reason)
        db.add(tx)
        await db.flush()
        payment = Payment(transaction_id=tx.id, payer_address=agent.wallet_address,
                          recipient_address=service.wallet_address or "", amount=dollars(amount),
                          currency="USDC", status=tx.status)
        db.add(payment)
        op = PaymentOperation(request_key=key, fingerprint=fingerprint, transaction_id=tx.id,
            agent_id=agent.id, amount_units=amount, mode=settings.PAYMENT_MODE, status=tx.status,
            chain_id=settings.CHAIN_ID if settings.PAYMENT_MODE == "live" else None,
            contract_address=settings.AGENTPAY_CONTRACT_ADDRESS if settings.PAYMENT_MODE == "live" else None)
        db.add(op)
        if not reason:
            if settings.PAYMENT_MODE == "simulation":
                op.status = tx.status = payment.status = "simulated"
            else:
                try:
                    chain = BlockchainClient()
                    tx.tx_hash, raw = await asyncio.to_thread(chain.prepare_payment, agent.wallet_address,
                                                            service.wallet_address, amount, policy)
                    payment.tx_hash = tx.tx_hash
                    op.signed_transaction = bytes(raw).hex()
                except Exception:
                    logger.exception("Live payment preparation failed before broadcast")
                    op.status = tx.status = payment.status = "failed"
                    tx.rejection_reason = "Live payment preparation failed; check chain, signer, allowance and policy"
            if op.status in SPENDING:
                account.balance_units -= amount
                wallet.balance = dollars(account.balance_units)
        await db.flush()
        operation_id = op.id
        result = await response_for(db, op, policy)
    if raw is not None:
        try:
            await asyncio.to_thread(chain.broadcast, raw)
        except Exception:
            # The node may have accepted a transaction despite a transport error.
            logger.exception("Broadcast uncertain; retaining pending payment %s", operation_id)
        try:
            return await reconcile(db, result.payment.payment_id, user_id, result.payment.tx_hash)
        except HTTPException as exc:
            if exc.status_code not in (409, 503):
                raise
    return result


async def reconcile(db, payment_id, user_id, tx_hash):
    payment = await db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(404, "Payment not found")
    tx = await db.get(Transaction, payment.transaction_id)
    await owned_agent(db, tx.agent_id, user_id)
    agent_id = tx.agent_id
    async with agent_transaction(db, agent_id):
        payment = await db.get(Payment, payment_id)
        op = (await db.execute(select(PaymentOperation).where(
            PaymentOperation.transaction_id == payment.transaction_id))).scalar_one_or_none()
        if not op or op.mode != "live":
            raise HTTPException(409, "Simulation and legacy records cannot be verified on chain")
        if not payment.tx_hash or payment.tx_hash.lower() != tx_hash.lower():
            raise HTTPException(409, "Hash must match the original signed payment")
        if op.chain_id != settings.CHAIN_ID or op.contract_address.lower() != settings.AGENTPAY_CONTRACT_ADDRESS.lower():
            raise HTTPException(409, "Restore this payment's original chain and contract configuration")
        policy = (await db.execute(select(Policy).where(Policy.agent_id == agent_id))).scalar_one()
        tx = await db.get(Transaction, op.transaction_id)
        if op.status == "pending":
            try:
                chain = BlockchainClient()
                outcome, block = await asyncio.to_thread(chain.verify, payment.tx_hash,
                    payment.payer_address, payment.recipient_address, op.amount_units)
            except Exception as exc:
                logger.warning("Payment %s is not yet verified: %s", payment_id, type(exc).__name__)
                raise HTTPException(503, "Payment remains pending; receipt could not be verified") from exc
            op.status = tx.status = payment.status = outcome
            tx.block_number = block
            if outcome == "failed":
                account = await db.get(LedgerAccount, agent_id)
                wallet = (await db.execute(select(Wallet).where(Wallet.agent_id == agent_id))).scalar_one()
                account.balance_units += op.amount_units
                wallet.balance = dollars(account.balance_units)
                tx.rejection_reason = "Transaction reverted on chain"
        await db.flush()
        return await response_for(db, op, policy)
