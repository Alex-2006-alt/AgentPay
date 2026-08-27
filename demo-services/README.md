# 🔌 AgentPay Demo Paid Micro-Services

This directory holds standalone mock and reference micro-services demonstrating the **x402 / HTTP 402 Payment Required** pattern.

## Demo Services
1. **Weather API (`/api/weather`)**: $0.001 per call.
2. **Translation API (`/api/translate`)**: $0.005 per call.
3. **Summarization API (`/api/summarize`)**: $0.010 per call.

Payment proofs are verified before serving service results.
