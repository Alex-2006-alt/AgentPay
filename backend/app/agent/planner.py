import re
from typing import List, Tuple

class TaskPlanner:
    def __init__(self):
        """
        Initializes the TaskPlanner.
        In a real production app, this would wrap an LLM (e.g. LangChain + OpenAI/Gemini).
        For this demo, we use deterministic intent mapping simulating an LLM's tool selection.
        """
        # Map of keywords to service categories
        self.intent_map = {
            r"translate|hindi|spanish|french": ["Language"],
            r"summariz|summary": ["Analysis"],
            r"weather": ["Information"],
            r"ocr|extract text|read image": ["Vision"],
            r"search|find out|look up": ["Search"],
            r"generate image|draw|picture of": ["Creative"],
        }
        
    def analyze_task(self, task: str) -> Tuple[List[str], bool, float]:
        """
        Analyzes the task and determines the required service categories.
        Returns:
            needed_categories (List[str]): The categories of services needed to complete the task.
            is_attack (bool): True if this task appears to be malicious or out-of-bounds.
            attack_amount (float): The amount requested in the malicious task.
        """
        task_lower = task.lower()
        
        # 1. Check for malicious attack simulation (e.g. "pay $5" or "gambling")
        is_attack = False
        attack_amount = 0.0
        
        if "pay $5" in task_lower or "5 dollar" in task_lower or "unknown service" in task_lower or "gambling" in task_lower:
            is_attack = True
            attack_amount = 5.00
            return [], is_attack, attack_amount
            
        # 2. Extract intents using regex patterns
        needed_categories = []
        for pattern, categories in self.intent_map.items():
            if re.search(pattern, task_lower):
                for cat in categories:
                    if cat not in needed_categories:
                        needed_categories.append(cat)
                        
        # 3. Default fallback if no clear intent is found (to ensure demo flows work)
        if not needed_categories:
            needed_categories = ["Language", "Analysis"]
            
        return needed_categories, is_attack, attack_amount
