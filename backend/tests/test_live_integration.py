"""Opt-in integration against an isolated local Hardhat node on port 18545."""
import json
import os
from pathlib import Path
import pytest
from sqlalchemy import select
from web3 import Web3
from app.config import settings
from app.database.database import AsyncSessionLocal
from app.database.models import Agent, Policy, Wallet, LedgerAccount
from app.blockchain.client import BlockchainClient

pytestmark = pytest.mark.skipif(os.getenv("AGENTPAY_TEST_RPC") != "http://127.0.0.1:18545", reason="isolated local chain not requested")


async def test_real_signed_settlement_and_policy_sync(client, monkeypatch):
    w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:18545"))
    assert w3.eth.chain_id == 1337
    owner, recipient = w3.eth.accounts[:2]
    directory = Path(__file__).resolve().parents[2] / "contracts" / "artifacts" / "contracts"
    def deploy(name, *args):
        artifact = json.loads((directory / f"{name}.sol" / f"{name}.json").read_text(encoding="utf-8"))
        factory = w3.eth.contract(abi=artifact["abi"], bytecode=artifact["bytecode"])
        receipt = w3.eth.wait_for_transaction_receipt(factory.constructor(*args).transact({"from": owner}))
        return w3.eth.contract(address=receipt.contractAddress, abi=artifact["abi"])
    token = deploy("MockUSDC", 6)
    manager = deploy("PaymentManager")
    pay_contract = deploy("AgentPay", token.address, manager.address)
    for call in [manager.functions.setPaymentContract(pay_contract.address),
                 token.functions.mint(owner, 10_000_000), token.functions.approve(pay_contract.address, 10_000_000)]:
        w3.eth.wait_for_transaction_receipt(call.transact({"from": owner}))
    monkeypatch.setattr(settings, "PAYMENT_MODE", "live")
    monkeypatch.setattr(settings, "EVM_RPC_URL", "http://127.0.0.1:18545")
    monkeypatch.setattr(settings, "CHAIN_ID", 1337)
    monkeypatch.setattr(settings, "AGENTPAY_CONTRACT_ADDRESS", pay_contract.address)
    monkeypatch.setattr(settings, "PAYMENT_MANAGER_CONTRACT_ADDRESS", manager.address)
    monkeypatch.setattr(settings, "MOCK_USDC_CONTRACT_ADDRESS", token.address)
    # Public Hardhat fixture key; never loaded from or used on another network.
    monkeypatch.setattr(settings, "AGENT_RELAYER_PRIVATE_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
    async with AsyncSessionLocal() as db:
        agent = await db.get(Agent, "agent_primary")
        wallet = (await db.execute(select(Wallet))).scalar_one()
        agent.wallet_address = wallet.address = owner
        db.add(LedgerAccount(agent_id=agent.id, balance_units=10_000_000, mode="live", chain_id=1337, token_address=token.address))
        await db.commit()
    policy = {"max_transaction": 0.1, "daily_limit": 2, "monthly_limit": 20,
              "auto_payment": True, "approved_services": "srv_translate_01"}
    update = await client.put("/agents/agent_primary/policies", json=policy)
    assert update.status_code == 200, update.text
    result = await client.post("/payments/request", json={"agent_id": "agent_primary",
                                "service_id": "srv_translate_01", "amount": 0.005})
    assert result.status_code == 200, result.text
    payment = result.json()["payment"]
    assert payment["status"] == "completed", result.text
    assert token.functions.balanceOf(recipient).call() == 5000
    assert token.functions.balanceOf(owner).call() == 9_995_000
    verify = await client.post(f"/payments/{payment['payment_id']}/verify", json={"tx_hash": payment["tx_hash"]})
    assert verify.json()["payment"]["status"] == "completed"
    proof = await client.post("/api/demo/translate", headers={"X-Payment-Id": payment["payment_id"]}, json={"text": "actual input"})
    assert proof.status_code == 200
    chain = BlockchainClient()
    with pytest.raises(ValueError, match="expected payment"):
        chain.verify(payment["tx_hash"], owner, recipient, 5001)
    monkeypatch.setattr(settings, "CHAIN_ID", 1)
    with pytest.raises(ValueError, match="CHAIN_ID"):
        chain.check_network()
