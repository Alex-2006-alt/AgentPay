"""Live settlement only. Simulation belongs to the payment engine, never here."""
import json
from pathlib import Path
from web3 import Web3
from web3.logs import DISCARD
from eth_account import Account
from app.config import settings
from app.money import units


class BlockchainClient:
    def __init__(self):
        if not settings.AGENT_RELAYER_PRIVATE_KEY:
            raise ValueError("Live payments require an explicitly configured signing key")
        self.w3 = Web3(Web3.HTTPProvider(settings.EVM_RPC_URL, request_kwargs={"timeout": 10}))
        self.account = Account.from_key(settings.AGENT_RELAYER_PRIVATE_KEY)
        self.agent_pay_address = Web3.to_checksum_address(settings.AGENTPAY_CONTRACT_ADDRESS)
        self.mock_usdc_address = Web3.to_checksum_address(settings.MOCK_USDC_CONTRACT_ADDRESS)
        directory = Path(__file__).resolve().parents[3] / "contracts" / "artifacts" / "contracts"
        def contract(name, address):
            with open(directory / f"{name}.sol" / f"{name}.json", encoding="utf-8") as handle:
                return self.w3.eth.contract(address=Web3.to_checksum_address(address), abi=json.load(handle)["abi"])
        self.agent_pay_contract = contract("AgentPay", self.agent_pay_address)
        self.payment_manager_contract = contract("PaymentManager", settings.PAYMENT_MANAGER_CONTRACT_ADDRESS)
        self.token = contract("MockUSDC", self.mock_usdc_address)

    def check_network(self):
        if self.w3.eth.chain_id != settings.CHAIN_ID:
            raise ValueError("RPC chain does not match configured CHAIN_ID")
        for contract in (self.agent_pay_contract, self.payment_manager_contract, self.token):
            if not self.w3.eth.get_code(contract.address):
                raise ValueError("Configured contract has no code on this chain")
        if self.agent_pay_contract.functions.paymentManager().call().lower() != self.payment_manager_contract.address.lower():
            raise ValueError("Payment manager configuration mismatch")
        if self.agent_pay_contract.functions.usdcToken().call().lower() != self.token.address.lower():
            raise ValueError("Token configuration mismatch")
        if self.payment_manager_contract.functions.paymentContract().call().lower() != self.agent_pay_address.lower():
            raise ValueError("Payment contract is not authorized to record spending")
        if self.token.functions.decimals().call() != 6:
            raise ValueError("Only six-decimal USDC is supported")

    def prepare_payment(self, agent_address, service_address, amount_units, policy):
        """Build a signed transaction without broadcasting it. Persist its hash first."""
        self.check_network()
        agent = Web3.to_checksum_address(agent_address)
        service = Web3.to_checksum_address(service_address)
        if agent != self.account.address:
            raise ValueError("Agent wallet does not match the configured live signer")
        manager = self.payment_manager_contract.functions
        if (manager.maxTxLimits(agent).call() != units(policy.max_transaction)
                or manager.dailyLimits(agent).call() != units(policy.daily_limit)
                or manager.monthlyLimits(agent).call() != units(policy.monthly_limit)
                or manager.paymentsEnabled(agent).call() != policy.auto_payment
                or not manager.approvedServices(agent, service).call()):
            raise ValueError("On-chain policy differs from the requested policy; synchronize it first")
        call = self.agent_pay_contract.functions.makePayment(service, amount_units)
        gas = call.estimate_gas({"from": agent})
        transaction = call.build_transaction({
            "from": agent, "nonce": self.w3.eth.get_transaction_count(agent, "pending"),
            "chainId": settings.CHAIN_ID, "gas": gas + gas // 5,
            "gasPrice": self.w3.eth.gas_price,
        })
        signed = self.account.sign_transaction(transaction)
        return Web3.to_hex(signed.hash), signed.raw_transaction

    def broadcast(self, raw_transaction):
        return self.w3.eth.send_raw_transaction(raw_transaction)

    def verify(self, tx_hash, payer, recipient, amount_units):
        """Verify chain, contract, successful receipt and the exact payment event."""
        self.check_network()
        receipt = self.w3.eth.get_transaction_receipt(tx_hash)
        if receipt["to"].lower() != self.agent_pay_address.lower() or receipt["from"].lower() != payer.lower():
            raise ValueError("Payment receipt sender or contract mismatch")
        if receipt["status"] == 0:
            return "failed", receipt["blockNumber"]
        events = self.agent_pay_contract.events.PaymentCompleted().process_receipt(receipt, errors=DISCARD)
        matches = [event for event in events if event["address"].lower() == self.agent_pay_address.lower()
                   and event["args"]["agent"].lower() == payer.lower()
                   and event["args"]["service"].lower() == recipient.lower()
                   and event["args"]["amount"] == amount_units]
        if len(matches) != 1:
            raise ValueError("Receipt does not prove the expected payment")
        return "completed", receipt["blockNumber"]

    def sync_policy(self, agent_address, policy, approvals):
        self.check_network()
        if Web3.to_checksum_address(agent_address) != self.account.address:
            raise ValueError("Agent wallet does not match configured live signer")
        manager = self.payment_manager_contract.functions
        calls = [manager.setPolicy(Web3.to_checksum_address(agent_address), units(policy.daily_limit),
                                  units(policy.monthly_limit), units(policy.max_transaction), policy.auto_payment)]
        calls.extend(manager.setServiceApproval(Web3.to_checksum_address(agent_address),
                     Web3.to_checksum_address(address), approved) for address, approved in approvals.items())
        for call in calls:
            tx = call.build_transaction({"from": self.account.address, "chainId": settings.CHAIN_ID,
                 "nonce": self.w3.eth.get_transaction_count(self.account.address, "pending")})
            signed = self.account.sign_transaction(tx)
            tx_hash = self.broadcast(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)
            if receipt.status != 1:
                raise ValueError("On-chain policy update reverted")
