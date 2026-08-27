# 🏛️ AgentPay Architecture

## System Diagram
```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND                            │
│                  React + Vite + Tailwind                │
│                                                         │
│ Dashboard │ Agent Console │ Marketplace │ Wallet │ Tx   │
└───────────────────────┬─────────────────────────────────┘
                        │
                        │ REST / WebSocket
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    API BACKEND                           │
│                    FastAPI (Python)                     │
│                                                         │
│ Auth │ Agents │ Services │ Payments │ Transactions      │
└───────────────────────┬─────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ AI AGENT     │ │ POLICY       │ │ SERVICE      │
│ ENGINE       │ │ ENGINE       │ │ DISCOVERY    │
│              │ │              │ │              │
│ Planning     │ │ Budget       │ │ APIs         │
│ Reasoning    │ │ Limits       │ │ Pricing      │
│ Tool use     │ │ Permissions  │ │ Reputation   │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        ▼
              ┌──────────────────┐
              │ PAYMENT ENGINE   │
              │                  │
              │ Wallet / Signer  │
              │ Payment Request  │
              │ Verification     │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ SMART CONTRACT   │
              │                  │
              │ Spending limits  │
              │ Whitelist        │
              │ Payment events   │
              └────────┬─────────┘
                       │
                       ▼
                 EVM TESTNET
                       │
                       ▼
              SERVICE PROVIDERS
```

## Layers
1. **Presentation Layer**: React 18, Vite, TypeScript, Tailwind CSS, TanStack Query.
2. **Application & Agent Layer**: FastAPI, Python async engine, LangChain / LiteLLM / Gemini API.
3. **Guardrails & Policy Engine**: Deterministic rules engine (Max Tx, Daily Limit, Whitelist).
4. **Settlement & Blockchain Layer**: Solidity smart contracts, EVM testnet (Arbitrum/Base Sepolia), web3.py & viem.
5. **Persistence Layer**: PostgreSQL with SQLAlchemy 2.0 Async ORM and Alembic migrations.
