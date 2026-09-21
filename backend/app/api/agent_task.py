import uuid
from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth import current_user
from app.database.database import get_db
from app.schemas.agent_task import AgentTaskRequest, AgentTaskResponse
from app.agent.executor import AgentExecutor

router = APIRouter(prefix="/agent", tags=["Agent Engine"])


@router.post("/task", response_model=AgentTaskResponse)
async def execute_agent_task(payload: AgentTaskRequest, db: AsyncSession = Depends(get_db),
                             user_id: str = Depends(current_user), authorization: str = Header(...),
                             idempotency_key: str = Header(..., min_length=1, max_length=128)):
    return await AgentExecutor(db).execute(str(uuid.uuid4()), payload.task, payload.agent_id or "agent_primary",
        user_id, idempotency_key, authorization, payload.document_content)
