import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from .notifier import Notifier
from typing import Dict, Any

class EmailNotifier(Notifier):
    def __init__(self):
        super().__init__()
        self.smtp_host = os.getenv("ALERT_EMAIL_SMTP_HOST")
        self.smtp_port = int(os.getenv("ALERT_EMAIL_SMTP_PORT", "587"))
        self.email_from = os.getenv("ALERT_EMAIL_FROM")
        self.email_to = os.getenv("ALERT_EMAIL_TO")
        
    def send(self, message: str, context: Dict[str, Any]) -> bool:
        if not all([self.smtp_host, self.email_from, self.email_to]):
            self.logger.warning("Email configuration incomplete")
            return False
            
        try:
            msg = MIMEMultipart()
            msg["From"] = self.email_from
            msg["To"] = self.email_to
            msg["Subject"] = f"[Shadow Deploy Alert] High Risk Detetcted on {context.get('endpoint', 'Unknown')}"
            
            body = f"{message}\n\nContext:\nRisk Score: {context.get('risk_score')}\nRequest ID: {context.get('request_id')}"
            msg.attach(MIMEText(body, "plain"))
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.send_message(msg)
            return True
        except Exception as e:
            self.logger.error(f"Failed to send email alert: {e}")
            return False
