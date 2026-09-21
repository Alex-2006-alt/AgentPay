"""Provision a ledger for an existing funded signer; never create keys or send funds."""
import argparse
import asyncio
from sqlalchemy import select, func
from app.config import settings
from app.blockchain.client import BlockchainClient
from app.database.database import init_db, AsyncSessionLocal
from app.database.models import Agent, User, Wallet, Policy, LedgerAccount, Provider
from app.money import dollars


async def provision(user_id, agent_id):
    if settings.PAYMENT_MODE != "live":
        raise ValueError("Set PAYMENT_MODE=live before provisioning")
    if user_id not in settings.API_KEYS.values():
        raise ValueError("Provision an API credential for this user first")
    chain = BlockchainClient()
    await asyncio.to_thread(chain.check_network)
    address = chain.account.address
    balance = await asyncio.to_thread(chain.token.functions.balanceOf(address).call)
    await init_db()
    async with AsyncSessionLocal() as db:
        if await db.get(Agent, agent_id) or (await db.execute(select(Agent).where(func.lower(Agent.wallet_address) == address.lower()))).first():
            raise ValueError("Agent ID or signing wallet already exists; refusing to reset a ledger")
        if not await db.get(User, user_id):
            db.add(User(id=user_id, wallet_address=address))
            await db.flush()
        db.add(Agent(id=agent_id, user_id=user_id, wallet_address=address, name="Live signer", status="active"))
        await db.flush()
        db.add(Wallet(agent_id=agent_id, address=address, chain_id=settings.CHAIN_ID,
                      network=f"EVM {settings.CHAIN_ID}", balance=dollars(balance), currency="USDC"))
        db.add(Policy(agent_id=agent_id, max_transaction=settings.DEFAULT_MAX_TRANSACTION,
                      daily_limit=settings.DEFAULT_DAILY_LIMIT, monthly_limit=settings.DEFAULT_MONTHLY_LIMIT,
                      auto_payment=False, approved_services=""))
        db.add(LedgerAccount(agent_id=agent_id, balance_units=balance, mode="live",
                            chain_id=settings.CHAIN_ID, token_address=settings.MOCK_USDC_CONTRACT_ADDRESS))
        if not await db.get(Provider, "provider_operator"):
            db.add(Provider(id="provider_operator", name="Operator-registered providers", is_verified=False))
        await db.commit()
    print(f"Provisioned {agent_id} for wallet {address}. Payments are disabled until its policy is configured.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--user-id", required=True)
    parser.add_argument("--agent-id", default="agent_live")
    args = parser.parse_args()
    asyncio.run(provision(args.user_id, args.agent_id))
