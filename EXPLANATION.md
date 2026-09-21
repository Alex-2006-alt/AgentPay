> Historical design document. For current supported behavior and limitations, see README.md and docs/security.md.

# AgentPay: The Autonomous Payment Infrastructure for AI Agents

Welcome to **AgentPay**! This document explains the entire project from top to bottom—why it exists, how it works, and the technical magic happening under the hood.

---

## 1. The Problem

We are entering an era of autonomous AI agents—AI that can plan, reason, and act on our behalf. However, these agents face a massive bottleneck: **they cannot transact.** 

If an AI agent needs to use a premium API (like an expensive high-accuracy translation service, an advanced OCR tool, or a proprietary weather forecasting model) to complete your task, it gets stuck. AI agents don't have bank accounts, they don't have credit cards, and they can't sign up for API keys on the fly. They operate in a financial vacuum.

## 2. The Idea & Solution

**AgentPay solves this by giving AI agents their own wallets.** 

Instead of relying on traditional banking, AgentPay uses blockchain technology and smart contracts (specifically EVM-compatible chains using stablecoins like USDC) to allow AI agents to make instant, programmable micropayments to third-party services.

With AgentPay, an AI agent can:
1. Receive a complex task from you.
2. Realize it needs external data/services to solve it.
3. Search a marketplace for the best and cheapest API provider.
4. **Autonomously pay that provider fractions of a cent using crypto.**
5. Fetch the data and give you the final result.

All of this happens within deterministic **Policy Guardrails** (hardcoded limits on how much the agent can spend per day or per transaction) to ensure the AI doesn't drain your wallet.

---

## 3. The Whole Architecture

AgentPay is a full-stack Web3 application broken into three main components:

### A. Smart Contracts (The Trust & Settlement Layer)
Written in Solidity and deployed using Hardhat.
- **`MockUSDC.sol`**: An ERC-20 token contract that simulates real USDC. This is the currency the agents use.
- **`PaymentManager.sol`**: The on-chain policy engine. It stores rules like "Agent A can only spend $2.00 a day" and "Agent A can only interact with Whitelisted APIs".
- **`AgentPay.sol`**: The actual settlement contract. It handles taking funds from the agent's wallet and sending them to the service provider's wallet securely.

### B. Backend (The Brain & Orchestration Layer)
A high-performance Python FastAPI server. This is where the AI agent "lives".
- **Database**: SQLite (using SQLAlchemy). It stores data about registered agents, their policy limits, the service marketplace (available APIs), and a history of all transactions.
- **Agent Executor**: An orchestration engine powered by an LLM (Gemini 2.0 Flash) that breaks down user tasks, selects services, and executes payments.
- **Blockchain Client**: A Web3.py integration that talks directly to the local Hardhat blockchain to submit payment transactions.

### C. Frontend (The User Interface)
A sleek React web application (built with Vite, Tailwind CSS, and TanStack Query).
- **Agent Console**: An interactive terminal where you give tasks to the agent and watch its execution step-by-step.
- **Dashboard**: Real-time analytics showing how much money the agent has spent, successful vs. failed transactions, and active services.

---

## 4. Deep Dive: How the Backend Works

The backend is the most complex part of the system. Let's trace exactly what happens when you type a prompt like: *"Translate the AgentPay description to Hindi and summarize it."*

### The 6-Step Execution Pipeline (`app/agent/executor.py`)

1. **Task Decomposition & Intent Analysis**: 
   The backend takes your prompt and feeds it to the LLM (Gemini). The LLM breaks the prompt down into required capabilities (e.g., "I need a Language Translation tool" and "I need a Summarization tool").
   
2. **Service Discovery & Dynamic Provider Selection**: 
   The backend searches its local SQLite database (the Marketplace) for services that match these needs. It finds multiple translation providers and compares their prices and ratings. It dynamically selects the optimal (often the cheapest but highly rated) services for the job.

3. **Deterministic Policy Engine Check**: 
   Before spending any money, the backend checks the database limits (e.g., max $0.10 per transaction). If the estimated cost of the selected services exceeds the limit, the backend **rejects** the task and stops immediately. (This protects you from prompt-injection attacks trying to drain your wallet).

4. **Blockchain Micropayment Settlement (`app/blockchain/client.py`)**: 
   The backend uses the `Web3.py` library and the agent's private key to sign a transaction. It calls the `AgentPay.sol` smart contract on the local Hardhat node, transferring the exact cost (e.g., $0.008 USDC) to the service provider. It waits for the transaction hash as proof of payment.

5. **Service API Invocation**: 
   With the cryptographic proof of payment secured, the backend makes standard HTTP requests to the actual third-party APIs (in our demo, these are mocked internal endpoints) to get the translation and the summary.

6. **Final Result Synthesis**: 
   The backend takes the raw outputs from the APIs, feeds them back into the LLM to format them nicely, and sends the final answer back to the React frontend for you to read.

### Backend Tech Stack Details
- **Framework**: FastAPI (Python) - chosen for its immense speed and native async support.
- **Database**: SQLite (via `aiosqlite`) - used for simple local testing without needing Docker.
- **ORM**: SQLAlchemy - maps Python classes (`app/database/models.py`) to SQL tables.
- **Blockchain Interface**: `web3.py` - allows Python to talk to the EVM blockchain.
- **AI Integration**: `google-generativeai` - connects to Google's Gemini models for reasoning.
- **Configuration**: `pydantic-settings` - manages the `.env` variables cleanly.

---

## Summary for Your Friend

In one sentence: **AgentPay is a platform that gives AI agents a crypto wallet and a rulebook, allowing them to autonomously hire and pay for other digital services to complete complex tasks for you, without ever risking draining your bank account.**
