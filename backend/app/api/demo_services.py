"""Deterministic demo providers, with payment-bound, replay-safe invocation."""
import hashlib
import json
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth import current_user, owned_agent
from app.config import settings
from app.database.database import get_db
from app.database.locking import agent_transaction
from app.database.models import Payment, PaymentOperation, PaymentRedemption, Service, ServiceCall, Transaction

router = APIRouter(prefix="/demo", tags=["Demo Microservices"])
DEMO_ENDPOINTS = {
    "weather", "weather_basic", "translate", "translate_basic", "translate_advanced",
    "summarize", "summarize_ext", "ocr", "search", "generate_image",
}


def demo_result(endpoint, payload):
    result = {"demo": True, "notice": "Synthetic demo data; no external AI or live data provider was used."}
    text = str(payload.get("text", ""))
    if endpoint.startswith("weather"):
        result.update(city=payload.get("city", "unspecified"), temperature_c=22, condition="Partly cloudy (demo)")
    elif endpoint.startswith("translate"):
        result.update(source_text=text, target_language=payload.get("target_language", "Hindi"),
                      translation=f"[Demo translation placeholder] {text}")
    elif endpoint.startswith("summarize"):
        result.update(summary=" ".join(text.split()[:100]), method="First 100 words, deterministic extract")
    elif endpoint == "search":
        result.update(query=payload.get("query", ""), results=[], notice="Demo search; no web search performed.")
    elif endpoint == "ocr":
        result.update(image_url=payload.get("image_url"), extracted_text=None, notice="Demo OCR; no image was processed.")
    else:
        result.update(prompt=payload.get("prompt", ""), image_url=None, notice="Demo image provider; no image was generated.")
    return result


@router.api_route("/{endpoint}", methods=["GET", "POST"])
async def invoke_demo(endpoint: str, request: Request, x_payment_id: str = Header(...),
                      user_id: str = Depends(current_user), db: AsyncSession = Depends(get_db)):
    if endpoint not in DEMO_ENDPOINTS:
        raise HTTPException(404, "Unknown demo provider")
    payload = dict(request.query_params) if request.method == "GET" else await request.json()
    if not isinstance(payload, dict):
        raise HTTPException(422, "Provider input must be an object")
    encoded = json.dumps(payload, sort_keys=True)
    if len(encoded) > 100_000:
        raise HTTPException(413, "Provider input is too large")
    digest = hashlib.sha256((endpoint + encoded).encode()).hexdigest()
    payment = await db.get(Payment, x_payment_id)
    if not payment:
        raise HTTPException(402, "Payment required")
    tx = await db.get(Transaction, payment.transaction_id)
    await owned_agent(db, tx.agent_id, user_id)
    agent_id = tx.agent_id
    async with agent_transaction(db, agent_id):
        payment = await db.get(Payment, x_payment_id)
        tx = await db.get(Transaction, payment.transaction_id)
        service = await db.get(Service, tx.service_id)
        op = (await db.execute(select(PaymentOperation).where(PaymentOperation.transaction_id == tx.id))).scalar_one_or_none()
        valid = op and (op.status == "completed" or (
            op.status == "simulated" and op.mode == "simulation" and settings.PAYMENT_MODE == "simulation"))
        if not valid or not service or service.endpoint != f"/api/demo/{endpoint}":
            raise HTTPException(402, "Payment does not authorize this service")
        previous = await db.get(PaymentRedemption, payment.id)
        if previous:
            if previous.request_digest != digest:
                raise HTTPException(409, "Payment already redeemed for a different request")
            return json.loads(previous.response)
        result = demo_result(endpoint, payload)
        result.update(payment_id=payment.id, payment_status=op.status)
        response = json.dumps(result)
        db.add(PaymentRedemption(payment_id=payment.id, request_digest=digest, response=response))
        db.add(ServiceCall(transaction_id=tx.id, service_id=service.id, request_payload=encoded,
                           response_payload=response, status="success"))
    return result
