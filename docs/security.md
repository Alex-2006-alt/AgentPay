# Security model and operating limits

## Authorization

`API_KEYS` maps operator-provisioned bearer credentials to user IDs. Private
APIs require credentials. Agent, wallet, policy, payment, task and transaction
operations enforce ownership. Analytics are scoped to the authenticated user.
Only IDs in `ADMIN_USER_IDS` may register services. Credentials are server-side
configuration and must not be bundled into frontend assets. Browser credentials
are held in memory. Deploy behind TLS and protect the operator configuration.

## Policy and accounting

Every payment uses one shared engine. Empty whitelists deny all services. Missing
policies/wallets, inactive agents/services, disabled automatic payments, currency
or price mismatches, exceeded budgets, and insufficient balance fail closed.
The authoritative available balance and new payment amounts are integer USDC
micro-units. Existing Float columns remain compatibility/display projections.
Requests may not contain more than six decimal places or nonfinite amounts.

SQLite uses an immediate write transaction; PostgreSQL locks the agent row.
Reservations and idempotency keys commit together before broadcasting a signed
transaction. Pending payments consume both balance and budgets even when old.
The same idempotency key and payload returns the original payment; changed
payloads conflict. A reverted receipt refunds the reservation exactly once.

## Settlement

Simulation is explicit and never emits fake transaction hashes. Live failures
never fall back to simulation. A receipt must match the configured chain,
AgentPay contract, signer, recipient, amount and emitted payment event.
Changing a hash through the verification API is prohibited. Legacy and
simulated records cannot satisfy live verification.

The original signed bytes are persisted before broadcast. If a node response is
lost, `POST /payments/{id}/retry` rebroadcasts those exact bytes; it never signs
another transfer. `POST /payments/{id}/verify` reconciles the stored hash.
Neither timeout nor an absent receipt releases reserved funds. Verify receipts
before continuing, rather than submitting a fresh payment key.

Receipt inclusion is currently the confirmation boundary. There is no finality
delay, reorg monitor or background reconciler. A provider failure after payment
does not automatically refund the transfer. These require additional operational
design before production use.

## Contracts and synchronization

Only the configured AgentPay contract can record spending. Owner-only policy
updates control service addresses, enabled status, per-payment, daily and
30-day-period limits. Payment execution uses SafeERC20 and a reentrancy guard;
failed transfers revert spending updates. Backend rolling budgets and on-chain
fixed UTC-day/30-day buckets both apply and can differ around boundaries.

The live signer must equal the agent wallet and must be assigned to exactly one
agent. Database policies are checked against chain settings before signing.
Policy updates are not a cross-system atomic transaction: partial chain updates
require retrying synchronization. The stricter off-chain service-ID whitelist
still applies where multiple services share a recipient address.

## Providers and tasks

Demo endpoints require a payment belonging to the caller for that exact endpoint.
A proof is bound to its first request body; exact retries return cached output,
and changed input is rejected. Responses clearly identify synthetic data.
External providers receive the payment hash and an idempotency key, never the
operator's API credential. Those providers must implement receipt verification
and idempotent redemption themselves.

Task requests are idempotent and persist their selected provider plan. A pending
task can be retried with the same key after settlement resolves. A task that was
running when the process terminated remains marked `running` to prevent unsafe
concurrent replay. After stopping all old workers, an operator may inspect its
payment records and change that task's `task_runs.status` to `pending` to resume
the original key. Automatic crashed-task recovery is not implemented.

The planner is a keyword classifier. Its attack-pattern demo is not a security
boundary; deterministic payment authorization is. No production LLM integration
or claim of general prompt-injection detection is made.
