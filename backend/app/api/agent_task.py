import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.schemas.agent_task import AgentTaskRequest, AgentTaskResponse
from app.agent.executor import AgentExecutor

router = APIRouter(prefix="/agent", tags=["AI Agent Engine"])


@router.post("/task", response_model=AgentTaskResponse)
async def execute_agent_task(payload: AgentTaskRequest, db: AsyncSession = Depends(get_db)):
    """Orchestrate end-to-end autonomous agent task execution with policy and payment verification."""
    task_id = str(uuid.uuid4())
    
    agent_id = payload.agent_id or "agent_primary"
    
    executor = AgentExecutor(db)
    
    response = await executor.execute(
        task_id=task_id,
        task=payload.task,
        agent_id=agent_id
    )
    
    return response
