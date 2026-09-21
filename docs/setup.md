# Setup

## Local simulation

1. Install Python 3.12+ and Node.js 22.12+.
2. In `backend`, create a virtual environment and install `requirements.txt`.
3. Copy `backend/.env.example` to `backend/.env` only if you do not already have
   a configuration. Preserve existing secrets and database settings.
4. Generate a credential using `python -c "import secrets; print(secrets.token_urlsafe(32))"`.
   Set `API_KEYS={"YOUR_GENERATED_TOKEN":"user_default"}` in the backend `.env`.
   Keep `PAYMENT_MODE=simulation`. Optionally set `ADMIN_USER_IDS=["user_default"]`
   if this credential should register services.
5. Run `uvicorn app.main:app --host 127.0.0.1 --port 8000` from `backend`.
6. In `frontend`, run `npm ci` and `npm run dev`. Open the displayed address and
   enter your generated API credential. It stays in browser memory, not storage.

An empty API key map intentionally denies private API access. The development
seed creates `agent_primary` for `user_default` and synthetic provider records.
New integer-ledger tables are added automatically; old transaction records are
preserved. Legacy hashes cannot be upgraded to verified payments.

## Docker development stack

Set `AGENTPAY_API_KEY` to a generated URL-safe credential, then run
`docker compose up --build` from the repository root. The stack uses PostgreSQL,
the backend, and the Vite development server. Ports bind to localhost. Enter the
same credential in the frontend. This stack deliberately uses simulation and is
not a production deployment configuration.

## Live settlement

Use a separate database/configuration from simulation. Back up existing data
before upgrading. Do not reuse a simulated ledger as real funding.

1. Compile and deploy the updated contracts (`npm run compile`, then the
   appropriate Hardhat Ignition deployment). `Deploy.ts` authorizes AgentPay as
   the sole spending recorder. The contracts are not upgradeable: existing
   deployments require new deployments and new configured addresses.
2. Configure `PAYMENT_MODE=live`, RPC, `CHAIN_ID`, all three contract addresses,
   an explicit signing key, and credentials. No default signing key, minting,
   or automatic token allowance is used. The supplied MockUSDC contract is for
   local/test networks only; a real token must expose compatible ERC-20 methods
   and six decimals.
3. Externally fund the signing wallet with gas and tokens and approve AgentPay
   to spend the intended token allowance. The signer must also own the deployed
   PaymentManager for policy synchronization in this implementation.
4. Run `python provision_live.py --user-id YOUR_USER_ID --agent-id agent_live`.
   This reads the actual token balance and creates a separate integer ledger.
   It refuses to overwrite an existing agent or signing wallet.
5. Register providers using an administrator credential. Use
   `provider_operator` as the provider ID. External service URLs must be HTTPS
   and have their origin explicitly configured in `SERVICE_ORIGINS`, for example
   `["https://your-provider.example"]`. Only trust origins whose DNS/network
   access the operator controls. Redirects and environment proxy settings are
   not followed. External providers use the POST JSON protocol documented in
   `api.md` and must verify payment proofs themselves.
6. PUT the agent policy with its exact budgets, service IDs and `auto_payment`.
   Live updates synchronize the contract before saving the database policy.
   Failed synchronization blocks payments until the policy is synchronized.

The backend supports one signing wallet, one agent for that wallet, and at most
one unresolved live payment at a time. Do not use that signer concurrently from
another process or wallet application. Deposits after provisioning are not
automatically credited to the internal ledger. Use PostgreSQL for concurrent
server deployments; SQLite serializes all writers.

## Tests

Run `python -m pytest -q` from `backend`; `npm test` from `contracts`; and
`npm run build` and `npm run lint` from `frontend`.

For a real Web3 integration round trip, start an isolated test node:

```sh
cd contracts
npx hardhat node --hostname 127.0.0.1 --port 18545
```

In a separate shell, set `AGENTPAY_TEST_RPC=http://127.0.0.1:18545` and run
`python -m pytest tests/test_live_integration.py -q` from `backend`. Compile
contracts first. The test deploys fresh contracts, mints test tokens, sends a
signed payment, verifies events and checks service redemption. It never uses
your application's configured chain or signing key. Stop the test node afterward.

If Hardhat's per-user config directory is unavailable on Windows, point process
`APPDATA` and `LOCALAPPDATA` at a writable project `.runtime` directory for that
test command. This directory is ignored by Git.
