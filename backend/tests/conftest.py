import os
import sys
import tempfile
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Override database URL for tests to an in-memory sqlite database
test_directory = tempfile.TemporaryDirectory(prefix="agentpay-tests-")
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///" + (Path(test_directory.name) / "test.db").as_posix()
os.environ["PAYMENT_MODE"] = "simulation"
os.environ["API_KEYS"] = '{"test-key":"user_default","other-key":"other-user"}'
os.environ["SEED_DEMO_DATA"] = "true"

import asyncio
import pytest
from httpx import ASGITransport, AsyncClient

from app.database.database import Base, engine, init_db
from app.main import app


@pytest.fixture(autouse=True)
async def setup_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    await init_db()
    yield
    await engine.dispose()


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", headers={
        "Authorization": "Bearer test-key", "Idempotency-Key": "test-request"}) as ac:
        yield ac

