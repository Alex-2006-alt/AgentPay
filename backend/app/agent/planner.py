import re
from typing import List, Tuple

class TaskPlanner:
    def __init__(self):
        """
        Initializes the TaskPlanner.
        In a real production app, this would wrap an LLM (e.g. LangChain + OpenAI/Gemini).
        For this demo, we use deterministic intent mapping simulating an LLM's tool selection.
        """
        # Map of keywords to service categories or specific service IDs
        self.intent_map = {
            r"translate|hindi|spanish|french": ["srv_translate_01"],
            r"summariz|summary": ["srv_summarize_01"],
            r"weather": ["srv_weather_01"],
            r"ocr|extract text|read image": ["srv_ocr_01"],
            r"search|find out|look up": ["srv_search_01"],
            r"generate image|draw|picture of": ["srv_image_01"],
        }
        
    def analyze_task(self, task: str) -> Tuple[List[str], bool, float]:
        """
        Analyzes the task and determines the required services and if it's a simulated attack.
        Returns:
            needed_service_ids (List[str]): The IDs of services needed to complete the task.
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
        needed_service_ids = []
        for pattern, service_ids in self.intent_map.items():
            if re.search(pattern, task_lower):
                for srv_id in service_ids:
                    if srv_id not in needed_service_ids:
                        needed_service_ids.append(srv_id)
                        
        # 3. Default fallback if no clear intent is found (to ensure demo flows work)
        if not needed_service_ids:
            needed_service_ids = ["srv_translate_01", "srv_summarize_01"]
            
        return needed_service_ids, is_attack, attack_amount
