import json
import requests
from .notifier import Notifier
from typing import Dict, Any

class SlackNotifier(Notifier):
    def __init__(self, webhook_url: str):
        super().__init__()
        self.webhook_url = webhook_url
        
    def send(self, message: str, context: Dict[str, Any]) -> bool:
        if not self.webhook_url:
            self.logger.warning("Slack webhook URL not configured")
            return False
            
        payload = {
            "text": f"🚨 *Shadow API Alert*\n{message}",
            "attachments": [
                {
                    "color": "#danger" if context.get("severity") == "critical" else "#warning",
                    "fields": [
                        {"title": "Endpoint", "value": context.get("endpoint", "N/A"), "short": True},
                        {"title": "Risk Score", "value": str(context.get("risk_score", "N/A")), "short": True},
                        {"title": "Request ID", "value": context.get("request_id", "N/A"), "short": False}
                    ]
                }
            ]
        }
        
        try:
            response = requests.post(self.webhook_url, json=payload, timeout=5)
            response.raise_for_status()
            return True
        except Exception as e:
            self.logger.error(f"Failed to send Slack alert: {e}")
            return False
