from typing import Any, List, Optional
from pydantic import BaseModel, Field


class AgentTaskRequest(BaseModel):
    agent_id: Optional[str] = Field("agent_primary", example="agent_primary")
    task: str = Field(..., min_length=1, max_length=10000, example="Translate this document into Hindi and summarize it.")
    document_content: Optional[str] = Field(None, example="AgentPay provides an autonomous settlement rails...")


class ExecutionStep(BaseModel):
    step_number: int
    title: str
    description: str
    status: str  # pending, in_progress, completed, failed
    service_id: Optional[str] = None
    cost: Optional[float] = None
    tx_hash: Optional[str] = None


class AgentTaskResponse(BaseModel):
    settlement_mode: str = "simulation"
    task_id: str
    task: str
    status: str  # completed, blocked_by_policy, error
    steps: List[ExecutionStep]
    final_output: Optional[str] = None
    total_cost: float = 0.0
    transactions: List[str] = []
    error: Optional[str] = None
