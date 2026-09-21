# Backend

FastAPI API, shared policy/payment engine, integer USDC ledger and deterministic task executor.

See [setup](../docs/setup.md), [API](../docs/api.md), and [security](../docs/security.md). Private routes require configured bearer credentials. The default payment mode is simulation.

Install `requirements.txt` in a virtual environment, then run `uvicorn app.main:app --host 127.0.0.1 --port 8000`. Run `python -m pytest -q` for the isolated backend tests.
