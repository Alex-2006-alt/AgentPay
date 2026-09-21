# API

`GET /health` and `GET /` are public. All other routes require
`Authorization: Bearer <operator-provisioned token>`. Swagger UI is at `/docs`.
Ownership failures return 404 without exposing another user's records.

| Route | Behavior |
| --- | --- |
| `GET /agents` | Agents belonging to the credential's user |
| `POST /agents` | Create an owned simulation agent; live provisioning uses the CLI |
| `GET /agents/{id}/wallet` | Available ledger balance and wallet configuration |
| `GET/PUT /agents/{id}/policies` | Read/replace policy; live PUT synchronizes contracts |
| `GET /services` | Registry discovery |
| `POST /services` | Administrator-only registration; recipient wallet required |
| `GET /transactions` | Owned transaction history; optional agent/status filters |
| `GET /transactions/analytics` | Owned aggregate analytics, including explicitly simulated spend |
| `POST /payments/request` | Policy evaluation, reservation and settlement |
| `GET /payments/{id}` | Stored payment status |
| `POST /payments/{id}/verify` | Verify the original stored transaction hash |
| `POST /payments/{id}/retry` | Rebroadcast original signed bytes and verify |
| `POST /agent/task` | Plan, pay, invoke providers, return actual responses |
| `GET/POST /api/demo/{provider}` | Demo response with authenticated payment redemption |

`POST /payments/request` and `/agent/task` require an `Idempotency-Key` header
(1–128 characters). Reuse it for retries; use a new key only for a new operation.
Reusing a key with changed input returns 409. Payment keys are scoped to an agent.

Payment request:

```json
{"agent_id":"agent_primary","service_id":"srv_translate_01","amount":0.005,"currency":"USDC"}
```

The amount must equal the registered service price. `approved` means the policy
authorized/reserved the operation; it is not proof of settlement. Inspect
`payment.status`: `simulated`, `pending`, `completed`, `rejected`, or `failed`.
Only `completed` carries verified live settlement. Simulation has no hash.
Uncertain confirmation returns a pending payment; verification may return 503
while preserving its reservation. A failed receipt is a terminal failed payment.

Task request:

```json
{"agent_id":"agent_primary","task":"Translate into Spanish and summarize","document_content":"The actual input document."}
```

Task responses include `settlement_mode`, execution steps, transaction IDs,
actual provider output, incurred cost and status. Partial failures retain the
cost of preceding successful payments. Exact completed-task retries return the
saved response. Pending-task retries resume the saved provider plan.

Demo invocation requires `X-Payment-Id: <payment_id>`. The proof must match that
endpoint and authenticated owner. Exact input retries return the cached result;
different input with an already redeemed proof returns 409.

External providers use POST JSON containing `text`, `query`, `prompt`, `city`
and `target_language`, with `X-Payment-Id`, `X-Payment-Tx`, and `Idempotency-Key`
headers. They must return JSON and independently verify/redeem proof. They are
only invoked after confirmed live settlement. Origins require explicit operator
allowlisting. No bearer credential is forwarded externally.
