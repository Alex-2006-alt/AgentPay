from types import SimpleNamespace
from urllib.parse import urlsplit
import httpx
from fastapi import HTTPException
from sqlalchemy import select
from app.config import settings
from app.database.models import Policy, Service
from app.api.demo_services import DEMO_ENDPOINTS


def validate_endpoint(endpoint):
    if endpoint in {f"/api/demo/{name}" for name in DEMO_ENDPOINTS}:
        return "demo"
    parsed = urlsplit(endpoint)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    if parsed.scheme != "https" or parsed.username or parsed.password or origin not in settings.SERVICE_ORIGINS:
        raise HTTPException(409, "Provider must use a known demo endpoint or an explicitly trusted HTTPS origin")
    return "external"


class AgentTools:
    @staticmethod
    async def discover(db, agent_id, categories):
        policy = (await db.execute(select(Policy).where(Policy.agent_id == agent_id))).scalar_one_or_none()
        if not policy:
            raise HTTPException(409, "Agent requires a policy")
        allowed = {value.strip() for value in policy.approved_services.split(",") if value.strip()}
        selected = []
        for category in categories:
            candidates = (await db.execute(select(Service).where(Service.category == category,
                          Service.status == "active"))).scalars().all()
            candidates = [s for s in candidates if "*" in allowed or s.id in allowed]
            if not candidates:
                raise HTTPException(409, f"No approved active provider for {category}")
            service = max(candidates, key=lambda s: (s.rating / max(s.price, 0.000001), s.id))
            validate_endpoint(service.endpoint)
            # Snapshot values: payment transactions rollback earlier read sessions.
            selected.append(SimpleNamespace(id=service.id, price=service.price, currency=service.currency,
                name=service.name, category=service.category, endpoint=service.endpoint))
        return selected

    @staticmethod
    async def invoke(service, payment, payload, authorization):
        kind = validate_endpoint(service.endpoint)
        headers = {"X-Payment-Id": payment.payment_id, "Idempotency-Key": payment.payment_id}
        if kind == "demo":
            from app.main import app
            headers["Authorization"] = authorization
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://internal", timeout=15) as client:
                response = await client.post(service.endpoint, json=payload, headers=headers)
        else:
            if payment.status != "completed" or not payment.tx_hash:
                raise HTTPException(409, "External providers require confirmed live payments")
            headers["X-Payment-Tx"] = payment.tx_hash
            # Never forward this application's bearer credential to providers.
            async with httpx.AsyncClient(timeout=15, follow_redirects=False, trust_env=False) as client:
                response = await client.post(service.endpoint, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
