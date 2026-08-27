from fastapi import APIRouter, Header, HTTPException, Query, status
from pydantic import BaseModel

router = APIRouter(prefix="/demo", tags=["Demo Microservices"])


class TranslateRequest(BaseModel):
    text: str
    target_language: str = "Hindi"


class SummarizeRequest(BaseModel):
    text: str
    max_length: int = 100


@router.get("/weather")
async def get_weather(
    city: str = Query("New York", description="City to get weather for"),
    x_payment_tx: str = Header(None, description="Blockchain payment proof hash"),
):
    """Paid Weather Matrix API ($0.001 / call)."""
    return {
        "service": "Weather Matrix API",
        "price_paid": 0.001,
        "currency": "USDC",
        "city": city,
        "temperature": "22°C",
        "condition": "Partly Cloudy",
        "humidity": "64%",
        "wind_speed": "12 km/h",
        "tx_proof": x_payment_tx,
    }


@router.post("/translate")
async def translate_text(
    payload: TranslateRequest,
    x_payment_tx: str = Header(None, description="Blockchain payment proof hash"),
):
    """Paid Neural Polyglot Translation API ($0.005 / call)."""
    translated_text = ""
    if payload.target_language.lower() in ["hindi", "hi"]:
        translated_text = "एजेंटपे (AgentPay) स्वायत्त एआई एजेंटों के लिए सुरक्षित माइक्रोपेमेंट और वित्तीय नियंत्रण अवसंरचना प्रदान करता है।"
    elif payload.target_language.lower() in ["spanish", "es"]:
        translated_text = "AgentPay proporciona infraestructura de micropagos seguros y control financiero para agentes de IA autónomos."
    elif payload.target_language.lower() in ["french", "fr"]:
        translated_text = "AgentPay fournit une infrastructure de micropaiement sécurisée et de contrôle financier pour les agents IA autonomes."
    else:
        translated_text = f"[{payload.target_language.upper()} TRANSLATION]: {payload.text}"

    return {
        "service": "Neural Polyglot Translation",
        "price_paid": 0.005,
        "currency": "USDC",
        "source_text": payload.text,
        "target_language": payload.target_language,
        "translated_text": translated_text,
        "tx_proof": x_payment_tx,
    }


@router.post("/summarize")
async def summarize_text(
    payload: SummarizeRequest,
    x_payment_tx: str = Header(None, description="Blockchain payment proof hash"),
):
    """Paid DeepSynth Summarization API ($0.010 / call)."""
    return {
        "service": "DeepSynth Summarization",
        "price_paid": 0.010,
        "currency": "USDC",
        "summary": "AgentPay is an autonomous payment framework that prevents LLM hallucinations from draining crypto wallets by enforcing hard policy limits and smart contract settlement.",
        "key_takeaways": [
            "Deterministic policy engine blocks unapproved or over-budget payments",
            "Settles micropayments reliably on EVM testnet",
            "Provides an auditable machine-to-machine commerce layer for AI agents",
        ],
        "tx_proof": x_payment_tx,
    }
