import asyncio
from app.database.database import init_db
from app.blockchain.client import BlockchainClient

async def test():
    await init_db()
    client = BlockchainClient()
    print("AgentPay Address:", client.agent_pay_address)
    print("MockUSDC Address:", client.mock_usdc_address)
    
    # Register the agent first
    print("Registering agent policy...")
    client.register_agent_policy(client.account.address, 0.10, ["0x70997970C51812dc3A010C7d01b50e0d17dc79C8"])
    
    # Try an execution
    print("Testing payment of 0.01 USDC to Service Wallet (0x70997970C51812dc3A010C7d01b50e0d17dc79C8)...")
    tx_hash = client.execute_payment("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 0.01)
    print("SUCCESS! Tx hash:", tx_hash)

if __name__ == "__main__":
    asyncio.run(test())
