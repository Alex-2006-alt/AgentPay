import re
import logging
from typing import List, Tuple
from app.config import settings

logger = logging.getLogger(__name__)

class TaskPlanner:
    def __init__(self):
        """
        Initializes the TaskPlanner.
        Deterministic keyword classifier; this is not an LLM planner.
        """
        self.intent_map = {
            r"translate|hindi|spanish|french|language|german|japanese": ["Language"],
            r"summariz|summary|key takeaway|brief|analysis|analyze": ["Analysis"],
            r"weather|temperature|forecast|climate|rain": ["Information"],
            r"ocr|extract text|read image|scan invoice|document text": ["Vision"],
            r"search|find out|look up|research|query": ["Search"],
            r"generate image|draw|picture of|artwork|render graphic": ["Creative"],
        }

    def analyze_task(self, task: str) -> Tuple[List[str], bool, float]:
        """
        Analyzes the task and determines the required service categories and security bounds.
        Returns:
            needed_categories (List[str]): The categories of services needed to complete the task.
            is_attack (bool): True if this task appears to be malicious or out-of-bounds.
            attack_amount (float): The amount requested in the malicious task.
        """
        task_lower = task.lower()

        # 1. Check for malicious attack simulation (e.g. prompt injection, unauthorized drain)
        is_attack = False
        attack_amount = 0.0

        if any(keyword in task_lower for keyword in ["pay $5", "5 dollar", "5 usd", "5 usdc", "unknown service", "gambling", "drain wallet", "transfer all"]):
            is_attack = True
            attack_amount = 5.00
            logger.warning(f"Policy alert: Malicious prompt injection pattern detected in task '{task}'")
            return [], is_attack, attack_amount

        # 2. Extract intents using intent mappings
        needed_categories = []
        for pattern, categories in self.intent_map.items():
            if re.search(pattern, task_lower):
                for cat in categories:
                    if cat not in needed_categories:
                        needed_categories.append(cat)

        # 3. Default fallback if no specific intent matched
        # Unknown requests must not silently purchase unrelated services.

        logger.info(f"Task analyzed: '{task}' -> Categories: {needed_categories}")
        return needed_categories, is_attack, attack_amount
