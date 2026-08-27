# 📖 AgentPay API Specification

All endpoints are served under the FastAPI backend server (default: `http://localhost:8000`).
Interactive OpenAPI docs are available at `/docs` (Swagger) and `/redoc`.

## Key Endpoints

### System & Health
- `GET /health`: Returns service health, database status, and version.

### Services & Marketplace
- `GET /services`: List all registered services in marketplace.
- `GET /services/{id}`: Retrieve service details, pricing, provider info.
- `POST /services`: Register a new micro-service API.

### Agents & Wallets
- `GET /agents`: List registered agents.
- `POST /agents`: Register or configure an AI agent.
- `GET /agents/{id}/wallet`: Retrieve agent wallet balance, address, network status.

### Policies & Limits
- `GET /agents/{id}/policies`: Fetch agent spending limits and whitelist rules.
- `PUT /agents/{id}/policies`: Update agent spending policies and toggles.

### Payments & Settlements
- `POST /payments/request`: Create a structured payment request.
- `GET /payments/{id}`: Inspect payment details and status.
- `POST /payments/{id}/verify`: Verify blockchain payment receipt / tx hash.

### Transactions
- `GET /transactions`: Retrieve transaction history and audit trail.
- `GET /transactions/{id}`: Inspect specific transaction details.

### Agent Task Execution
- `POST /agent/task`: Dispatch high-level user prompt to the AI agent execution engine.
