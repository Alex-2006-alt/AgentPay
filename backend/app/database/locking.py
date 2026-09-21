from contextlib import asynccontextmanager
from sqlalchemy import select, text
from app.database.models import Agent


@asynccontextmanager
async def agent_transaction(db, agent_id: str):
    # Drop any read-only transaction before acquiring a write lock. Callers must
    # not have staged changes. SQLite serializes writers; Postgres locks the agent.
    await db.rollback()
    try:
        if db.bind.dialect.name == "sqlite":
            await db.execute(text("BEGIN IMMEDIATE"))
        else:
            await db.execute(select(Agent).where(Agent.id == agent_id).with_for_update())
        yield
        await db.commit()
    except BaseException:
        await db.rollback()
        raise
