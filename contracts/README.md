# Contracts

Run `npm ci`, `npm run compile`, and `npm test`. For local deployment start `npm run node`, then run `npm run deploy` in a second shell.

AgentPay transfers approved ERC-20 funds using SafeERC20 and a reentrancy guard. PaymentManager records spend only from its once-configured AgentPay contract. Owner-only policies enforce enabled status, recipient allowlisting, per-payment, daily and 30-day-period caps. The deployment module links the contracts. MockUSDC is a test token.

These contracts are not upgradeable. Changes require new deployments; do not reuse old addresses or reset a live deployment blindly. See [setup](../docs/setup.md) for backend configuration.
