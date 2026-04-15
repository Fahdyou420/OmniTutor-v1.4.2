import os
import time
import json
import requests
import uuid
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Configuration
MT5_COMMON_DIR = r"C:\Users\user\AppData\Roaming\MetaQuotes\Terminal\Common\Files"
JOURNAL_FILE = "OmniTutor_Journal.jsonl"
EXPLANATION_FILE = "OmniTutor_Explanations.txt"
MEMORY_FILE = "OmniTutor_MemoryNodes.json"

# OpenRouter Configuration - Using strictly FREE models
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "YOUR_API_KEY_HERE")
FREE_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-2-9b-it:free",
    "mistralai/mistral-7b-instruct:free",
    "qwen/qwen-2-7b-instruct:free"
]

class SelfLearningMemory:
    def __init__(self, filepath):
        self.filepath = os.path.join(MT5_COMMON_DIR, filepath)
        self.nodes = self.load_memory()

    def load_memory(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, 'r') as f:
                    return json.load(f)
            except:
                return []
        return []

    def add_node(self, trade_data, explanation, reflection):
        node = {
            "node_id": str(uuid.uuid4())[:8],
            "timestamp": time.time(),
            "trade_data": trade_data,
            "explanation": explanation,
            "self_learning_reflection": reflection
        }
        self.nodes.append(node)
        self.save_memory()

    def save_memory(self):
        with open(self.filepath, 'w') as f:
            json.dump(self.nodes, f, indent=2)

    def get_context(self, setup_name, limit=3):
        relevant = [n for n in self.nodes if n['trade_data'].get('SetupName') == setup_name]
        return relevant[-limit:]

class TradeJournalHandler(FileSystemEventHandler):
    def __init__(self):
        self.memory = SelfLearningMemory(MEMORY_FILE)

    def on_modified(self, event):
        if not event.is_directory and event.src_path.endswith(JOURNAL_FILE):
            self.process_new_trades(event.src_path)

    def process_new_trades(self, filepath):
        try:
            with open(filepath, 'r') as f:
                lines = f.readlines()
                if not lines: return
                
                # Process the last trade
                last_trade = json.loads(lines[-1].strip())
                self.generate_explanation_and_learn(last_trade)
        except Exception as e:
            print(f"Error processing file: {e}")

    def generate_explanation_and_learn(self, trade_data):
        print(f"Processing trade: {trade_data.get('TicketID')} with Self-Learning...")
        
        setup_name = trade_data.get('SetupName')
        past_context = self.memory.get_context(setup_name)
        
        context_str = "No past memory for this setup."
        if past_context:
            context_str = "\n".join([f"- Node {n['node_id']}: {n['self_learning_reflection']}" for n in past_context])

        prompt = f"""
        You are OmniTutor, an expert trading AI with self-learning memory nodes.
        
        CURRENT TRADE DATA:
        - Setup: {setup_name}
        - Entry Price: {trade_data.get('EntryPrice')}
        - Stop Loss: {trade_data.get('SL')}
        - Take Profit: {trade_data.get('TP')}
        - Daily Open Rule Passed: {trade_data.get('DailyOpenRulePassed')}
        
        PAST MEMORY NODES (Self-Learning Context):
        {context_str}
        
        TASK:
        Respond in EXACTLY this JSON format:
        {{
            "explanation": "2 sentences explaining this setup to a beginner.",
            "reflection": "1 sentence internal reflection on how this trade compares to past memory nodes to improve future accuracy."
        }}
        """

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # Try free models with fallback
        for model in FREE_MODELS:
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "response_format": {"type": "json_object"}
            }

            try:
                print(f"Attempting inference with FREE model: {model}")
                response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
                response.raise_for_status()
                
                result_text = response.json()['choices'][0]['message']['content'].strip()
                
                # Basic JSON extraction in case the model wraps it in markdown
                if "```json" in result_text:
                    result_text = result_text.split("```json")[1].split("```")[0].strip()
                elif "```" in result_text:
                    result_text = result_text.split("```")[1].strip()
                    
                result_json = json.loads(result_text)
                
                explanation = result_json.get("explanation", "Trade executed based on technical confluence.")
                reflection = result_json.get("reflection", "Stored in memory for future pattern recognition.")
                
                # Save to Memory Nodes
                self.memory.add_node(trade_data, explanation, reflection)
                
                # Save explanation for MT5 HUD
                out_path = os.path.join(MT5_COMMON_DIR, EXPLANATION_FILE)
                with open(out_path, 'w') as f:
                    f.write(f"TUTOR: {explanation}\nMEMORY: {reflection}")
                    
                print(f"Success! Memory Node created.")
                break # Exit fallback loop on success
                
            except Exception as e:
                print(f"Model {model} failed: {e}. Trying next free model...")

if __name__ == "__main__":
    print(f"OmniTutor Self-Learning Brain started. Monitoring: {MT5_COMMON_DIR}")
    
    if not os.path.exists(MT5_COMMON_DIR):
        os.makedirs(MT5_COMMON_DIR, exist_ok=True)
        
    event_handler = TradeJournalHandler()
    observer = Observer()
    observer.schedule(event_handler, path=MT5_COMMON_DIR, recursive=False)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
