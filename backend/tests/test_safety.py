import asyncio
import uuid
from datetime import datetime, timedelta
from types import SimpleNamespace
import pytest
from sqlalchemy import select
from app.config import settings
from app.database.database import AsyncSessionLocal
from app.database.models import Agent, Wallet, Policy, PaymentOperation, Payment, Service, Transaction, LedgerAccount
from app.blockchain.client import BlockchainClient

PAYLOAD = {"agent_id": "agent_primary", "service_id": "srv_translate_01", "amount": 0.005}


async def request(client, key=None, **values):
    return await client.post("/payments/request", json=PAYLOAD | values,
                             headers={"Idempotency-Key": key or str(uuid.uuid4())})


async def configure(**values):
    async with AsyncSessionLocal() as db:
        policy = (await db.execute(select(Policy))).scalar_one()
        for name, value in values.items():
            setattr(policy, name, value)
        await db.commit()


@pytest.mark.parametrize("field,value", [
    ("auto_payment", False), ("approved_services", ""), ("approved_services", "srv_weather_01"),
    ("max_transaction", 0.001), ("daily_limit", 0.001), ("monthly_limit", 0.001),
])
async def test_all_policies_block_direct_and_task(client, field, value):
    await configure(**{field: value})
    direct = (await request(client)).json()
    assert not direct["approved"]
    task = (await client.post("/agent/task", json={"task": "Translate into Hindi"})).json()
    # The task can select a cheaper approved provider, so use a limit below all prices.
    assert task["status"] == "blocked_by_policy", task
    assert (await client.get("/agents/agent_primary/wallet")).json()["balance"] == 10


async def test_missing_auth_and_other_owner(client):
    assert (await client.get("/agents", headers={"Authorization": ""})).status_code == 401
    for path in ("/agents/agent_primary/wallet", "/agents/agent_primary/policies"):
        assert (await client.get(path, headers={"Authorization": "Bearer other-key"})).status_code == 404
    assert (await client.post("/payments/request", json=PAYLOAD,
                             headers={"Authorization": "Bearer other-key"})).status_code == 404
    assert (await client.get("/transactions", headers={"Authorization": "Bearer other-key"})).json() == []
    assert (await client.get("/transactions/analytics", headers={"Authorization": "Bearer other-key"})).json()["wallet_balance"] == 0


async def test_missing_agent_does_not_fall_back(client):
    response = await client.post("/agent/task", json={"agent_id": "missing", "task": "Translate"})
    assert response.status_code == 404


@pytest.mark.parametrize("amount", [-1, 0, 0.0000001, 1e30])
async def test_invalid_amount(client, amount):
    assert (await request(client, amount=amount)).status_code == 422


async def test_price_currency_status_and_balance(client):
    assert not (await request(client, amount=0.001)).json()["approved"]
    assert not (await request(client, currency="ETH")).json()["approved"]
    async with AsyncSessionLocal() as db:
        agent = await db.get(Agent, "agent_primary")
        agent.status = "paused"
        await db.commit()
    assert not (await request(client)).json()["approved"]


async def test_insufficient_balance(client):
    async with AsyncSessionLocal() as db:
        wallet = (await db.execute(select(Wallet))).scalar_one()
        wallet.balance = 0
        await db.commit()
    assert not (await request(client)).json()["approved"]


async def test_replay_is_idempotent_and_conflict_is_rejected(client):
    first = (await request(client, "same")).json()
    second = (await request(client, "same")).json()
    assert first["payment"]["payment_id"] == second["payment"]["payment_id"]
    assert (await client.get("/agents/agent_primary/wallet")).json()["balance"] == 9.995
    assert (await request(client, "same", amount=0.01)).status_code == 409


async def test_concurrent_requests_cannot_overrun_budget(client):
    await configure(daily_limit=0.005)
    results = await asyncio.gather(request(client), request(client))
    assert sum(r.json()["approved"] for r in results) == 1
    assert (await client.get("/agents/agent_primary/wallet")).json()["balance"] == 9.995


async def test_concurrent_replay_charges_once(client):
    results = await asyncio.gather(request(client, "same"), request(client, "same"))
    assert len({r.json()["payment"]["payment_id"] for r in results}) == 1
    assert (await client.get("/agents/agent_primary/wallet")).json()["balance"] == 9.995


async def test_rolling_month_budget(client):
    await configure(monthly_limit=0.009)
    assert (await request(client)).json()["approved"]
    async with AsyncSessionLocal() as db:
        op = (await db.execute(select(PaymentOperation))).scalar_one()
        op.created_at = datetime.utcnow() - timedelta(days=2)
        await db.commit()
    assert "monthly" in (await request(client)).json()["reason"]


async def test_proof_bound_to_owner_service_and_input(client):
    payment = (await request(client)).json()["payment"]
    headers = {"X-Payment-Id": payment["payment_id"]}
    assert (await client.post("/api/demo/translate", json={"text": "Hello"})).status_code == 422
    assert (await client.post("/api/demo/weather", json={}, headers=headers)).status_code == 402
    response = await client.post("/api/demo/translate", json={"text": "Hello"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["demo"] and response.json()["source_text"] == "Hello"
    assert (await client.post("/api/demo/translate", json={"text": "Hello"}, headers=headers)).json() == response.json()
    assert (await client.post("/api/demo/translate", json={"text": "Different"}, headers=headers)).status_code == 409
    assert (await client.post("/api/demo/translate", json={}, headers=headers | {"Authorization": "Bearer other-key"})).status_code == 404
    assert (await client.post(f"/payments/{payment['payment_id']}/verify", json={"tx_hash": "0x" + "a"*64})).status_code == 409


async def test_task_input_and_replay(client):
    body = {"task": "Translate into Spanish and summarize", "document_content": "My actual document"}
    first = (await client.post("/agent/task", json=body)).json()
    assert first["status"] == "completed", first
    assert "My actual document" in first["final_output"]
    assert "spanish" in first["final_output"].lower()
    assert "demo" in first["final_output"]
    second = (await client.post("/agent/task", json=body)).json()
    assert first == second
    assert (await client.post("/agent/task", json={"task": "weather"})).status_code == 409


async def test_unknown_intent_does_not_purchase(client):
    result = (await client.post("/agent/task", json={"task": "hello there"})).json()
    assert result["status"] == "blocked_by_policy"
    assert (await client.get("/transactions")).json() == []


class FakeChain:
    outcome = "completed"
    unavailable = False
    def prepare_payment(self, *args):
        return "0x" + "a"*64, b"signed"
    def broadcast(self, raw):
        if self.unavailable:
            raise TimeoutError("transport unavailable")
    def verify(self, *args):
        if self.unavailable:
            raise TimeoutError("receipt not yet available")
        return self.outcome, 123


async def live_ledger():
    async with AsyncSessionLocal() as db:
        db.add(LedgerAccount(agent_id="agent_primary", balance_units=10_000_000, mode="live",
                            chain_id=settings.CHAIN_ID, token_address=settings.MOCK_USDC_CONTRACT_ADDRESS))
        await db.commit()


async def test_live_preparation_failure_never_simulates(client, monkeypatch):
    await live_ledger()
    monkeypatch.setattr(settings, "PAYMENT_MODE", "live")
    def fail(*args):
        raise ValueError("reverted")
    monkeypatch.setattr(FakeChain, "prepare_payment", fail)
    monkeypatch.setattr("app.payment_engine.BlockchainClient", FakeChain)
    result = (await request(client)).json()
    assert not result["approved"] and result["payment"]["status"] == "failed"
    assert result["payment"]["tx_hash"] is None
    assert (await client.get("/agents/agent_primary/wallet")).json()["balance"] == 10


@pytest.mark.parametrize("outcome,expected_balance", [("completed", 9.995), ("failed", 10)])
async def test_pending_receipt_reconciliation(client, monkeypatch, outcome, expected_balance):
    await live_ledger()
    monkeypatch.setattr(settings, "PAYMENT_MODE", "live")
    monkeypatch.setattr(FakeChain, "unavailable", True)
    monkeypatch.setattr("app.payment_engine.BlockchainClient", FakeChain)
    first = (await request(client, "pending")).json()
    assert first["payment"]["status"] == "pending"
    assert (await client.get("/agents/agent_primary/wallet")).json()["balance"] == 9.995
    assert not (await request(client)).json()["approved"]
    monkeypatch.setattr(FakeChain, "unavailable", False)
    monkeypatch.setattr(FakeChain, "outcome", outcome)
    payment = first["payment"]
    for _ in range(2):
        verified = await client.post(f"/payments/{payment['payment_id']}/verify", json={"tx_hash": payment["tx_hash"]})
        assert verified.json()["payment"]["status"] == outcome
        assert (await client.get("/agents/agent_primary/wallet")).json()["balance"] == expected_balance


def test_receipt_revert_is_failed_not_simulated(monkeypatch):
    chain = object.__new__(BlockchainClient)
    chain.agent_pay_address = "0xcontract"
    chain.w3 = SimpleNamespace(eth=SimpleNamespace(get_transaction_receipt=lambda _: {
        "to": "0xcontract", "from": "0xpayer", "status": 0, "blockNumber": 7}))
    monkeypatch.setattr(chain, "check_network", lambda: None)
    assert chain.verify("hash", "0xpayer", "0xrecipient", 1) == ("failed", 7)


async def test_mode_switch_and_unprovisioned_live_balance_are_rejected(client, monkeypatch):
    monkeypatch.setattr(settings, "PAYMENT_MODE", "live")
    assert (await request(client)).status_code == 409
    monkeypatch.setattr(settings, "PAYMENT_MODE", "simulation")
    assert (await request(client)).json()["approved"]
    monkeypatch.setattr(settings, "PAYMENT_MODE", "live")
    assert (await request(client)).status_code == 409


async def test_admin_registration_and_untrusted_endpoint(client, monkeypatch):
    service = {"name": "Test", "category": "Search", "provider_id": "provider_official",
               "endpoint": "http://169.254.169.254/metadata", "price": 0.001,
               "wallet_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"}
    assert (await client.post("/services", json=service)).status_code == 403
    monkeypatch.setattr(settings, "ADMIN_USER_IDS", ["user_default"])
    assert (await client.post("/services", json=service)).status_code == 409
    service["endpoint"] = "/api/demo/search"
    assert (await client.post("/services", json=service)).status_code == 201


async def test_service_failure_keeps_incurred_cost_and_retry_does_not_charge(client, monkeypatch):
    async def fail(*args):
        raise TimeoutError("provider unavailable")
    monkeypatch.setattr("app.agent.tools.AgentTools.invoke", fail)
    body = {"task": "Translate into Hindi"}
    first = (await client.post("/agent/task", json=body)).json()
    assert first["status"] == "error" and first["total_cost"] > 0
    balance = (await client.get("/agents/agent_primary/wallet")).json()["balance"]
    second = (await client.post("/agent/task", json=body)).json()
    assert second == first
    assert (await client.get("/agents/agent_primary/wallet")).json()["balance"] == balance


async def test_signed_retry_reuses_bytes(client, monkeypatch):
    await live_ledger()
    monkeypatch.setattr(settings, "PAYMENT_MODE", "live")
    monkeypatch.setattr(FakeChain, "unavailable", True)
    monkeypatch.setattr("app.payment_engine.BlockchainClient", FakeChain)
    payment = (await request(client)).json()["payment"]
    sent = []
    monkeypatch.setattr(FakeChain, "check_network", lambda self: None, raising=False)
    monkeypatch.setattr(FakeChain, "broadcast", lambda self, raw: sent.append(raw))
    monkeypatch.setattr(FakeChain, "unavailable", False)
    monkeypatch.setattr("app.api.payments.BlockchainClient", FakeChain)
    retried = await client.post(f"/payments/{payment['payment_id']}/retry")
    assert retried.json()["payment"]["status"] == "completed"
    assert sent == [b"signed"]
    assert (await client.get("/agents/agent_primary/wallet")).json()["balance"] == 9.995
