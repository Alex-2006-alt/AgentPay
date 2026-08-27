# 🔐 AgentPay Security Architecture

## Threat Model & Defenses

| Threat | Impact | AgentPay Defense Mechanism |
|---|---|---|
| **Prompt Injection / Rogue Tool Calls** | LLM persuaded to pay external address or exceed budget | **Deterministic Policy Engine**: LLM never has wallet access; all payment requests are intercepted and validated against strict hard thresholds. |
| **Budget Drain / Infinite Loops** | Runaway agent calls expensive APIs in a loop | **Per-Transaction & Daily Spending Caps**: Rolling 24-hour window hard budget stops unauthorized repeated spending. |
| **Malicious API / Unverified Endpoints** | Agent calls phishing API | **Service Whitelist**: Only verified marketplace providers are authorized to receive payments. |
| **Replay & Double Spending** | Intercepted payment payload re-broadcast | **Cryptographic Nonces & Payment IDs**: Every payment request is unique and state-tracked. |
| **Private Key Exposure** | Leak of relayer or agent keys | **Server-side HSM / Secret Manager**: Keys stored in protected environment variables, never sent to frontend or exposed to LLM context. |
