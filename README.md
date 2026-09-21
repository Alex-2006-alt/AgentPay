# AgentPay

Policy-controlled payments for agent-selected services, with a React dashboard,
FastAPI backend, and Solidity payment contracts.

## Current behavior

- **Simulation is the default.** Payments use demo balances, are labeled
  `simulated`, and have no blockchain hash. Demo providers return synthetic data.
- **Live settlement is explicit.** A configured, externally funded signer pays
  through deployed contracts. Chain failures never fall back to simulation.
- Both direct payments and agent tasks use the same policy engine: active agent,
  service allowlist, exact service price, USDC currency, per-payment limit,
  rolling 24-hour/30-day budgets, auto-payment permission, and available balance.
- An integer USDC ledger reserves funds under a database lock. Idempotency keys
  prevent duplicate charges; uncertain settlement stays pending until verified.
- Private APIs require bearer credentials and enforce agent ownership. Service
  registration additionally requires an administrator credential.
- The planner is a deterministic keyword classifier, not an LLM. It calls
  registered providers over HTTP and displays their actual responses. Local demo
  providers enforce payment-bound, replay-safe access.

## Layout

| Directory | Purpose |
| --- | --- |
| `frontend/` | React/TypeScript/Vite dashboard and credential entry |
| `backend/` | API, policy/payment engine, integer ledger, task execution, tests |
| `contracts/` | ERC-20 settlement, policy contracts, Hardhat tests/deployment |
| `docs/` | Setup, API, architecture, security model and implementation plan |
| `demo-services/` | Notes on the demo endpoints hosted by the backend |

Start with [setup](docs/setup.md). See [API behavior](docs/api.md),
[security and limitations](docs/security.md), and [the remediation plan](docs/REMEDIATION_PLAN.md).
The older blueprint and `EXPLANATION.md` describe design aspirations, not a
production-readiness guarantee.

## Verification

```sh
cd backend
python -m pytest -q
cd ../contracts
npm ci
npm test
cd ../frontend
npm ci
npm run build
```

Backend tests use a separate temporary database. The optional live integration
test uses only a local Hardhat node at port 18545; see setup instructions.

## Scope

This is a development implementation, not an audited payment product. Live mode
supports one configured signing wallet, and service execution follows payment
without automatic refunds. There is no production LLM integration, wallet key
provisioning, finality/reorg worker, or background settlement reconciler.
