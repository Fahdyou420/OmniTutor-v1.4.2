import os
import time
import json
import requests
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Configuration
MT5_COMMON_DIR = r"C:\Users\user\AppData\Roaming\MetaQuotes\Terminal\Common\Files"
JOURNAL_FILE = "OmniTutor_Journal.jsonl"
EXPLANATION_FILE = "OmniTutor_Explanations.txt"

# OpenRouter Configuration
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "YOUR_API_KEY_HERE")
OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free"

class TradeJournalHandler(FileSystemEventHandler):
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
                self.generate_explanation(last_trade)
        except Exception as e:
            print(f"Error processing file: {e}")

    def generate_explanation(self, trade_data):
        print(f"Generating explanation for trade: {trade_data['TicketID']}")
        
        prompt = f"""
        You are an expert trading tutor. Explain this trade setup to a beginner in exactly 2 sentences.
        Trade Data:
        - Setup: {trade_data.get('SetupName')}
        - Entry Price: {trade_data.get('EntryPrice')}
        - Stop Loss: {trade_data.get('SL')}
        - Take Profit: {trade_data.get('TP')}
        - Daily Open Rule Passed: {trade_data.get('DailyOpenRulePassed')}
        
        Keep it simple, encouraging, and educational.
        """

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": OPENROUTER_MODEL,
            "messages": [{"role": "user", "content": prompt}]
        }

        try:
            response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
            response.raise_for_status()
            explanation = response.json()['choices'][0]['message']['content'].strip()
            
            # Save explanation for MT5 HUD
            out_path = os.path.join(MT5_COMMON_DIR, EXPLANATION_FILE)
            with open(out_path, 'w') as f:
                f.write(explanation)
                
            print(f"Explanation saved: {explanation}")
            
        except Exception as e:
            print(f"LLM Error: {e}")

if __name__ == "__main__":
    print(f"OmniTutor Python Brain started. Monitoring: {MT5_COMMON_DIR}")
    
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
