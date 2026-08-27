# 🚀 AgentPay — Autonomous Payment Infrastructure & Policy Guardrails for AI Agents

> **Programmable, secure machine-to-machine (M2M) micropayments for autonomous AI agents.**

---

## 🌟 Overview

As AI agents evolve from conversational assistants into autonomous actors that browse the web, consume paid APIs, purchase computational resources, and collaborate with other agents, they require a native financial rail.

However, **giving an LLM direct access to a crypto wallet or private key is a dangerous security liability** — prompt injections, hallucinated loops, and rogue API calls can drain wallets in seconds.

**AgentPay** solves this by establishing a **dual-layer policy & verification engine**:
1. **Off-Chain Policy Engine**: Instant enforcement of per-transaction caps, daily/monthly budgets, and service whitelists.
2. **On-Chain Settlement Layer**: Immutable spending rules, smart-contract fund custody, and cryptographic payment proofs.

---

## 🏗️ Architecture

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

---

## 📁 Repository Structure

```
AgentPay/
├── backend/            # FastAPI backend, Agent planner, Policy engine, Database models
├── frontend/           # React + Vite dashboard, Agent console, Marketplace UI
├── contracts/          # Solidity smart contracts (Hardhat/Foundry), tests, deployment scripts
├── demo-services/      # Mock paid micro-APIs (Weather, Translation, Summarization)
├── docs/               # Architecture specs and project blueprints
├── tests/              # End-to-end integration tests
└── README.md           # Project documentation
```

---

## 🚀 Key Features

- **🧠 Autonomous Agent Planner**: Breaks user instructions into service-dependent subtasks.
- **🛡️ Deterministic Policy Engine**: Hard financial limits unaffected by LLM hallucinations.
- **🏪 Service Marketplace**: Dynamic registry of discoverable paid APIs with pricing & reputation.
- **⛓️ Smart Contract Settlement**: Verifiable micropayments settled on EVM testnet with event emission.
- **📊 Real-Time Analytics**: Visual tracking of agent spend, API latency, and security blocks.
- **😈 Prompt Injection Defense**: Real-time rejection of rogue payment requests.

---

## 📜 Development Phasing

- [x] **Phase 0**: Repository Initialization & Blueprint Finalization
- [x] **Phase 1**: Workspace Foundation (FastAPI backend + React frontend)
- [x] **Phase 2**: Demo Micro-APIs (`/weather`, `/translate`, `/summarize`)
- [x] **Phase 3**: AI Agent Engine with Function Calling & Tool Execution
- [x] **Phase 4**: Policy Engine & Guardrails
- [x] **Phase 5**: Solidity Smart Contracts & EVM Testnet Integration
- [x] **Phase 6**: AI + Blockchain Integration (Web3 Settlement)
- [ ] **Phase 7**: Interactive Dashboard, Advanced Analytics & Security Visualizations

---

## 📄 License

MIT License.
