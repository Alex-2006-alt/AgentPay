# Demo providers

Demo providers are hosted inside the backend at `/api/demo/{provider}`. They return explicitly synthetic data and make no external AI, weather, search or image calls.

Every invocation requires a bearer credential and `X-Payment-Id` belonging to that user and endpoint. Exact retries return cached output; reusing a payment with different input is rejected. Provider aliases from the seeded registry are supported. See [API](../docs/api.md).
