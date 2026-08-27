# 🚀 AgentPay Backend

FastAPI asynchronous backend powering the AgentPay Agent Planning, Policy Guardrails, Microservice Marketplace, and Settlement verification.

## Structure
- `app/api/`: REST endpoint routes.
- `app/agent/`: AI agent planner, tool registry, and execution loop.
- `app/policy/`: Deterministic guardrails engine (spending caps, whitelists).
- `app/blockchain/`: Web3 wallet management and contract verification.
- `app/database/`: SQLAlchemy async engine and relational models.
- `app/services/`: Demo microservice endpoints (`/weather`, `/translate`, `/summarize`).

## Quickstart
```bash
python -m venv .venv
# Activate virtual environment
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
