# AgentPay remediation plan

Implementation completed in this working tree. See `setup.md`, `security.md`,
and `api.md` for the supported configuration and operational limits. Validation
includes backend policy/concurrency/replay tests, contract tests, frontend build,
and an opt-in real Web3 round trip against an isolated local Hardhat node.

1. Centralize payment policy evaluation: active agent, required policy/wallet,
   service whitelist, exact price/currency, per-payment, rolling daily/monthly
   limits, auto-payment permission and balance.
2. Reserve integer USDC units transactionally, persist idempotency keys, and
   distinguish simulated, pending, confirmed and failed settlement. Never
   turn a blockchain error into a successful simulation.
3. Authenticate private APIs with operator-provisioned bearer tokens and scope
   reads and mutations to their configured user. Restrict service registration
   to configured administrators.
4. Restrict contract spending writes, enforce monthly and enabled policies,
   validate chain/signer/policy identity, verify payment events, and retain
   pending reservations until a receipt resolves them.
5. Execute registered services, bind proofs to service and owner, prevent proof
   reuse, and expose demo responses as demo data. Keep the planner explicitly
   deterministic; unsupported intents must not buy unrelated services.
6. Update frontend authentication, status/error handling, container setup and
   operational docs. Test policy parity, concurrency, replay, authorization,
   blockchain failure handling and contract access control.

Live mode supports one externally funded configured signer, whose wallet must
match the agent wallet. It does not provision private keys, mint production
funds, or automatically approve token spending. Existing databases retain their
legacy display columns; a new integer ledger is authoritative for new payments.
Historical payment evidence must not be upgraded to verified automatically.

## Validation results

- Backend: 36 tests passed, including a real Web3 payment on an isolated local
  Hardhat node, authorization, policy parity, concurrent spending, idempotency,
  proof replay protection, failed receipts, and exact-byte rebroadcast.
- Contracts: 7 tests passed, including unauthorized spending writes, disabled
  payments, monthly limits and rollback when token transfer fails.
- Frontend: TypeScript/Vite production build and Oxlint both passed.
- Compose YAML parsed successfully. Docker is unavailable on the validation
  host, so the complete container stack was not launched.
- Existing user databases and `.env` secrets were not modified. Old contracts
  were not redeployed. Configure credentials before using the updated API; see
  setup instructions before enabling live mode.
