import hashlib
import json
import re
from types import SimpleNamespace
from fastapi import HTTPException
from sqlalchemy import select
from app.auth import owned_agent
from app.agent.planner import TaskPlanner
from app.agent.tools import AgentTools, validate_endpoint
from app.config import settings
from app.database.locking import agent_transaction
from app.database.models import TaskRun
from app.payment_engine import pay, reconcile
from app.schemas.payments import PaymentRequest
from app.schemas.agent_task import AgentTaskResponse, ExecutionStep


class AgentExecutor:
    def __init__(self, db):
        self.db = db

    async def execute(self, task_id, task, agent_id, user_id, request_key, authorization, document_content=None):
        fingerprint = hashlib.sha256(json.dumps([task, document_content]).encode()).hexdigest()
        saved_plan = None
        async with agent_transaction(self.db, agent_id):
            await owned_agent(self.db, agent_id, user_id)
            run = (await self.db.execute(select(TaskRun).where(TaskRun.request_key == f"{agent_id}:{request_key}"))).scalar_one_or_none()
            if run:
                if run.fingerprint != fingerprint:
                    raise HTTPException(409, "Task idempotency key already used for different input")
                if run.status == "running":
                    raise HTTPException(409, "Task is already running; inspect its payments before retrying")
                if run.response and run.status != "pending":
                    return AgentTaskResponse.model_validate_json(run.response)
                task_id = run.id
                saved_plan = run.plan
                run.status = "running"
            else:
                self.db.add(TaskRun(id=task_id, request_key=f"{agent_id}:{request_key}", fingerprint=fingerprint,
                                    agent_id=agent_id, status="running"))
        response = AgentTaskResponse(task_id=task_id, task=task, status="completed", steps=[],
                                    settlement_mode=settings.PAYMENT_MODE)
        outputs = []
        def step(title, description, status="completed", **extra):
            response.steps.append(ExecutionStep(step_number=len(response.steps)+1, title=title,
                                                description=description, status=status, **extra))
        try:
            categories, blocked, _ = TaskPlanner().analyze_task(task)
            if blocked or not categories:
                raise HTTPException(409, "Unsupported task; no services were purchased")
            step("Deterministic task planning", "Matched service categories: " + ", ".join(categories))
            services = [SimpleNamespace(**s) for s in json.loads(saved_plan)] if saved_plan else await AgentTools.discover(self.db, agent_id, categories)
            if settings.PAYMENT_MODE == "simulation" and any(validate_endpoint(s.endpoint) != "demo" for s in services):
                raise HTTPException(409, "External providers require live settlement")
            if not saved_plan:
                async with agent_transaction(self.db, agent_id):
                    run = await self.db.get(TaskRun, task_id)
                    run.plan = json.dumps([vars(service) for service in services])
            step("Approved provider discovery", ", ".join(s.name for s in services))
            for service in services:
                decision = await pay(self.db, PaymentRequest(agent_id=agent_id, service_id=service.id,
                                     amount=service.price, currency=service.currency), user_id,
                                     f"task:{task_id}:{service.id}")
                payment = decision.payment
                if payment:
                    response.transactions.append(payment.transaction_id)
                if not decision.approved:
                    response.status = "blocked_by_policy" if payment and payment.status == "rejected" else "error"
                    response.error = decision.reason
                    step("Payment rejected", decision.reason or "Payment failed", "failed")
                    break
                if payment.status == "pending":
                    try:
                        decision = await reconcile(self.db, payment.payment_id, user_id, payment.tx_hash)
                        payment = decision.payment
                    except HTTPException:
                        pass
                if payment.status == "pending":
                    response.status = "pending"
                    response.error = "Payment is pending. Retry the same task key after confirming its receipt."
                    step("Payment pending", response.error, "pending", tx_hash=payment.tx_hash)
                    break
                if payment.status not in ("completed", "simulated"):
                    response.status = "error"
                    response.error = decision.reason or "Settlement failed"
                    step("Payment failed", response.error, "failed")
                    break
                response.total_cost = round(response.total_cost + payment.amount, 6)
                step("Payment " + payment.status, decision.reason or payment.status,
                     cost=payment.amount, tx_hash=payment.tx_hash)
                payload = {"text": document_content or task, "query": task, "prompt": task}
                city = re.search(r"(?:for|in)\s+([\w ,'-]+)", task, re.IGNORECASE)
                payload["city"] = city.group(1).strip(" .") if city else "unspecified"
                languages = re.search(r"\b(hindi|spanish|french|german|japanese)\b", task, re.IGNORECASE)
                payload["target_language"] = languages.group(1) if languages else "Hindi"
                result = await AgentTools.invoke(service, payment, payload, authorization)
                outputs.append(f"{service.name}\n{json.dumps(result, ensure_ascii=False, indent=2)}")
                step("Service response received", service.name)
        except HTTPException as exc:
            response.status = "blocked_by_policy" if exc.status_code == 409 else "error"
            response.error = str(exc.detail)
            step("Execution stopped", response.error, "failed")
        except Exception:
            import logging
            logging.getLogger(__name__).exception("Task %s failed", task_id)
            response.status = "error"
            response.error = "Service execution failed. Recorded payments remain available; no automatic refund was issued."
            step("Execution failed", response.error, "failed")
        response.final_output = "\n\n".join(outputs) or None
        async with agent_transaction(self.db, agent_id):
            run = await self.db.get(TaskRun, task_id)
            run.status = response.status
            run.response = response.model_dump_json()
        return response
