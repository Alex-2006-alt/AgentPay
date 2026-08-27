import pytest


@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "version" in data


@pytest.mark.asyncio
async def test_list_services(client):
    response = await client.get("/services")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3


@pytest.mark.asyncio
async def test_payment_request_and_policy_approval(client):
    # Test valid micropayment
    payload = {
        "agent_id": "agent_primary",
        "service_id": "srv_translate_01",
        "amount": 0.005,
        "currency": "USDC",
        "reason": "Translate text",
    }
    response = await client.post("/payments/request", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["approved"] is True
    assert data["payment"] is not None
    assert data["payment"]["status"] == "completed"


@pytest.mark.asyncio
async def test_policy_rejection_on_excess_amount(client):
    # Test policy rejection when amount > max transaction ($0.10)
    payload = {
        "agent_id": "agent_primary",
        "service_id": "srv_translate_01",
        "amount": 5.00,  # exceeds $0.10 limit
        "currency": "USDC",
        "reason": "Attempt over-budget payment",
    }
    response = await client.post("/payments/request", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["approved"] is False
    assert "exceeds max per-tx limit" in data["reason"]


@pytest.mark.asyncio
async def test_analytics_endpoint(client):
    response = await client.get("/transactions/analytics")
    assert response.status_code == 200
    data = response.json()
    assert "total_spend" in data
    assert "total_transactions" in data
    assert "wallet_balance" in data


@pytest.mark.asyncio
async def test_agent_task_execution(client):
    payload = {
        "agent_id": "agent_primary",
        "task": "Translate this document into Hindi and summarize it.",
    }
    response = await client.post("/agent/task", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert len(data["steps"]) >= 4
    assert data["total_cost"] > 0
    assert "Translation" in data["final_output"]
