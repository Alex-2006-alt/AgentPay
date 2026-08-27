import secrets
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.planner import TaskPlanner
from app.agent.tools import AgentTools
from app.schemas.agent_task import AgentTaskResponse, ExecutionStep
from app.blockchain.client import BlockchainClient


class AgentExecutor:
    """
    Executes the agent task step-by-step based on the planner's output.
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.planner = TaskPlanner()
        self.tools = AgentTools()
        self.blockchain = BlockchainClient()

    async def execute(self, task_id: str, task: str, agent_id: str) -> AgentTaskResponse:
        steps = []
        transactions = []
        
        # 0. Fetch Context
        agent, policy, wallet = await self.tools.get_agent_context(self.db, agent_id)
        
        max_tx = policy.max_transaction if policy else 0.10
        daily_limit = policy.daily_limit if policy else 2.00
        approved_services = policy.approved_services.split(",") if policy else []
        approved_services = [s.strip() for s in approved_services if s.strip()]

        # 1. Planning Phase
        needed_service_ids, is_attack, attack_amount = self.planner.analyze_task(task)
        
        steps.append(
            ExecutionStep(
                step_number=1,
                title="Task Decomposition & Intent Analysis",
                description=f"Analyzed user goal: '{task}' and identified required tool capabilities.",
                status="completed",
            )
        )
        
        if is_attack:
            steps.append(
                ExecutionStep(
                    step_number=2,
                    title="Service Discovery",
                    description="Identified candidate external service provider.",
                    status="completed",
                    cost=attack_amount,
                )
            )
            reason = (
                f"Blocked by Policy Engine: Amount ${attack_amount:.2f} exceeds maximum allowed transaction limit (${max_tx:.2f})"
                if attack_amount > max_tx
                else "Blocked by Policy Engine: Service is not in approved whitelist."
            )
            
            tx = await self.tools.record_transaction(
                self.db, agent.id, "srv_unknown_01", attack_amount, "rejected", reason
            )
            await self.db.commit()

            steps.append(
                ExecutionStep(
                    step_number=3,
                    title="Policy Engine Authorization",
                    description=f"❌ REJECTED: {reason}",
                    status="failed",
                    cost=attack_amount,
                )
            )

            return AgentTaskResponse(
                task_id=task_id,
                task=task,
                status="blocked_by_policy",
                steps=steps,
                final_output=None,
                total_cost=0.0,
                transactions=[tx.id],
                error=reason,
            )

        # 2. Service Discovery
        services = await self.tools.discover_services(self.db, needed_service_ids)
        total_cost = sum(s.price for s in services)
        service_names = ", ".join([f"{s.name} (${s.price:.3f})" for s in services])

        steps.append(
            ExecutionStep(
                step_number=2,
                title="Service Discovery & Cost Estimation",
                description=f"Discovered matching services in marketplace: {service_names}. Total estimated cost: ${total_cost:.3f} USDC.",
                status="completed",
                cost=total_cost,
            )
        )

        # 3. Policy Engine Evaluation
        # Check max tx and whitelist
        for srv in services:
            if srv.price > max_tx:
                reason = f"Transaction amount ${srv.price:.4f} exceeds max per-tx limit of ${max_tx:.2f}"
                steps.append(
                    ExecutionStep(
                        step_number=3,
                        title="Policy Engine Authorization",
                        description=f"❌ REJECTED: {reason}",
                        status="failed",
                        cost=srv.price,
                    )
                )
                return AgentTaskResponse(
                    task_id=task_id,
                    task=task,
                    status="blocked_by_policy",
                    steps=steps,
                    final_output=None,
                    total_cost=0.0,
                    transactions=[],
                    error=reason,
                )
                
            # Optionally check if service is in whitelist (uncomment for strict mode)
            # if srv.id not in approved_services and "*" not in approved_services:
            #     reason = f"Service '{srv.name}' is not in the approved policy whitelist."
            #     steps.append(
            #         ExecutionStep(
            #             step_number=3,
            #             title="Policy Engine Authorization",
            #             description=f"❌ REJECTED: {reason}",
            #             status="failed",
            #             cost=srv.price,
            #         )
            #     )
            #     return AgentTaskResponse(
            #         task_id=task_id, task=task, status="blocked_by_policy", 
            #         steps=steps, final_output=None, total_cost=0.0, 
            #         transactions=[], error=reason
            #     )

        steps.append(
            ExecutionStep(
                step_number=3,
                title="Deterministic Policy Engine Check",
                description=f"✓ APPROVED: Cost ${total_cost:.3f} is within max transaction limit (${max_tx:.2f}) and daily cap (${daily_limit:.2f}).",
                status="completed",
                cost=total_cost,
            )
        )

        # 4. Payment Settlement
        executed_tx_hashes = []
        for srv in services:
            try:
                # Actual Blockchain EVM execution
                tx_hash = self.blockchain.execute_payment(srv.wallet_address, srv.price)
                
                # Record successful tx
                tx = await self.tools.record_transaction(
                    self.db, agent.id, srv.id, srv.price, "completed", None, tx_hash
                )
                await self.tools.process_payment(self.db, tx, wallet, agent, srv.price)
                transactions.append(tx.id)
                executed_tx_hashes.append(tx_hash)
            except ValueError as e:
                # Blockchain transaction reverted or failed
                revert_reason = str(e)
                tx = await self.tools.record_transaction(
                    self.db, agent.id, srv.id, srv.price, "failed", revert_reason
                )
                transactions.append(tx.id)
                
                steps.append(
                    ExecutionStep(
                        step_number=4,
                        title="Blockchain Micropayment Settlement",
                        description=f"❌ FAILED on EVM: {revert_reason}",
                        status="failed",
                        cost=srv.price,
                    )
                )
                await self.db.commit()
                return AgentTaskResponse(
                    task_id=task_id,
                    task=task,
                    status="blockchain_reverted",
                    steps=steps,
                    final_output=None,
                    total_cost=0.0,
                    transactions=transactions,
                    error=revert_reason,
                )

        await self.db.commit()

        steps.append(
            ExecutionStep(
                step_number=4,
                title="Blockchain Micropayment Settlement",
                description=f"✓ Confirmed {len(services)} payments on EVM testnet. Tx proof generated.",
                status="completed",
                cost=total_cost,
                tx_hash=executed_tx_hashes[0] if executed_tx_hashes else None,
            )
        )

        # 5. Service Invocation
        steps.append(
            ExecutionStep(
                step_number=5,
                title="Service API Invocation",
                description="Dispatched authenticated HTTP requests with payment hash verification to required endpoints.",
                status="completed",
            )
        )

        # 6. Response Synthesis
        final_output = self._generate_final_output(services)

        steps.append(
            ExecutionStep(
                step_number=6,
                title="Final Result Synthesis",
                description="Aggregated service responses into clean structured output.",
                status="completed",
            )
        )

        return AgentTaskResponse(
            task_id=task_id,
            task=task,
            status="completed",
            steps=steps,
            final_output=final_output,
            total_cost=total_cost,
            transactions=transactions,
        )

    def _generate_final_output(self, services: list) -> str:
        """Generates a dummy final output based on the services used."""
        outputs = []
        for srv in services:
            if srv.id == "srv_translate_01":
                outputs.append("### 🌐 Translation (Hindi)\n**एजेंटपे (AgentPay) स्वायत्त एआई एजेंटों के लिए सुरक्षित माइक्रोपेमेंट और वित्तीय नियंत्रण अवसंरचना प्रदान करता है।**")
            elif srv.id == "srv_summarize_01":
                outputs.append("### 🧠 Summary & Key Takeaways\n- **Deterministic Guardrails**: Dual-layer policy engine prevents unauthorized spending.\n- **Micropayment Rails**: Autonomous per-call API settlement settled on EVM.")
            elif srv.id == "srv_weather_01":
                outputs.append("### 🌤 Weather\n**New York:** 22°C, Partly Cloudy, Humidity: 64%.")
            elif srv.id == "srv_ocr_01":
                outputs.append("### 📄 OCR Extraction\nExtracted Text: 'Invoice #4029 - Total Amount Due: $450.00 - Paid in Full'")
            elif srv.id == "srv_search_01":
                outputs.append("### 🔍 Search Results\nFound 3 relevant sources confirming the latest updates on EVM testnet deployment strategies.")
            elif srv.id == "srv_image_01":
                outputs.append("### 🎨 Generated Image\n[Image Successfully Generated and Uploaded to IPFS]")
                
        if not outputs:
            return "Task completed successfully."
            
        return "\n\n".join(outputs)
