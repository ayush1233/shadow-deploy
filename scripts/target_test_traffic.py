import requests
import json
import uuid
import time

INGEST_URL = "http://localhost:8081/api/v1/ingest/event"
HEADERS = {
    "Content-Type": "application/json",
    "X-API-Key": "sk-shadow-demo-key-change-me"
}

def send_traffic():
    req_id = f"req-ai-test-{uuid.uuid4().hex[:6]}"
    
    prod_payload = {
        "request_id": req_id,
        "tenant_id": "demo",
        "traffic_type": "production",
        "method": "POST",
        "endpoint": "/api/v1/checkout",
        "response_status": 200,
        "response_body": json.dumps({
            "order_id": "ORD-9999",
            "status": "success",
            "payment_details": {
                "method": "credit_card",
                "last_4": "4242"
            }
        }),
        "response_time_ms": 150
    }

    shadow_payload = {
        "request_id": req_id,
        "tenant_id": "demo",
        "traffic_type": "shadow",
        "method": "POST",
        "endpoint": "/api/v1/checkout",
        "response_status": 200,
        "response_body": json.dumps({
            "order_id": "ORD-9999",
            "status": "success",
            "payment": {
                "type": "CARD",
                "masked_number": "****-****-****-4242",
                "provider": "stripe"
            },
            "new_feature_flag": True
        }),
        "response_time_ms": 165
    }

    print(f"Sending Production Event for {req_id}...")
    r1 = requests.post(INGEST_URL, json=prod_payload, headers=HEADERS)
    print(r1.status_code, r1.text)
    
    time.sleep(1)
    
    print(f"Sending Shadow Event for {req_id}...")
    r2 = requests.post(INGEST_URL, json=shadow_payload, headers=HEADERS)
    print(r2.status_code, r2.text)
    
    print(f"\nDone! Request ID to look for in dashboard: {req_id}")

if __name__ == "__main__":
    send_traffic()
