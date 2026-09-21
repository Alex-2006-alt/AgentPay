# Architecture

React/React Query -> authenticated FastAPI routes -> shared payment engine ->
integer ledger and explicit simulation/live settlement -> provider HTTP call.

`app/auth.py` resolves the configured bearer identity and enforces agent
ownership. `app/payment_engine.py` owns policy validation, budget reservations,
idempotency, receipt reconciliation and one-time reservation refunds. The API
and task executor both use this engine.

`app/database/locking.py` serializes writes by agent on PostgreSQL and serializes
all writers on SQLite. Existing schema columns are retained for compatibility.
`ledger_accounts`, `payment_operations`, `payment_redemptions`, and `task_runs`
add authoritative integer balances, payment identity, replay protection and task
results. Startup creates these additive tables without rewriting historical data.

`app/blockchain/client.py` only performs live operations. It validates chain,
contract linkage, signer and policy, prepares signed bytes, broadcasts them, and
verifies exact receipt events. Simulation exists only in the payment engine and
cannot be entered because an RPC call failed.

`app/agent/planner.py` classifies supported intents deterministically.
`app/agent/tools.py` chooses approved active providers and invokes known demo
endpoints through HTTP/ASGI or operator-trusted HTTPS providers. Demo redemption
is transactional and returns cached output for the same payment and input.

`AgentPay.sol` transfers ERC-20 tokens from the signing wallet to the provider.
`PaymentManager.sol` enforces enabled status, spending limits and address
allowlisting, with spending updates restricted to AgentPay. Funds remain in the
signer's ERC-20 wallet until transfer; this is not an escrow/custody contract.

The frontend polls API state and presents simulation explicitly. It does not
embed API credentials or assume a particular public block explorer. See
`security.md` for operational boundaries and recovery behavior.
