import requests
from .notifier import Notifier
from typing import Dict, Any

class WebhookNotifier(Notifier):
    def __init__(self, webhook_url: str):
        super().__init__()
        self.webhook_url = webhook_url
        
    def send(self, message: str, context: Dict[str, Any]) -> bool:
        if not self.webhook_url:
            self.logger.warning("Generic webhook URL not configured")
            return False
            
        payload = {
            "event": "shadow_deploy_alert",
            "message": message,
            "context": context
        }
        
        try:
            response = requests.post(self.webhook_url, json=payload, timeout=5)
            response.raise_for_status()
            return True
        except Exception as e:
            self.logger.error(f"Failed to send webhook alert: {e}")
            return False
