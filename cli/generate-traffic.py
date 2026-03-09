#!/usr/bin/env python3
"""
generate-traffic.py — Send traffic through BOTH v1 and v2 APIs,
capture full responses, and submit them to the ingestion service
for comparison. This bypasses the NGINX response-body limitation.

Usage:
    python cli/generate-traffic.py
    python cli/generate-traffic.py --count 30
    python cli/generate-traffic.py --v1 http://localhost:5001 --v2 http://localhost:5002
"""

import argparse
import json
import time
import urllib.request
import urllib.error
import random
import sys
import uuid

V1_URL = "http://localhost:5001"
V2_URL = "http://localhost:5002"
INGESTION_URL = "http://localhost:8081/api/v1/ingest/event"

API_PATHS = [
    {"path": "/api/tickets/", "method": "GET"},
    {"path": "/api/tickets/1/", "method": "GET"},
    {"path": "/api/tickets/2/", "method": "GET"},
    {"path": "/api/tickets/3/", "method": "GET"},
    {"path": "/api/tickets/stats/", "method": "GET"},
    {"path": "/api/users/", "method": "GET"},
    {"path": "/api/health", "method": "GET"},
]

POST_REQUESTS = [
    {
        "path": "/api/tickets/",
        "method": "POST",
        "body": {"title": "Billing issue", "description": "Double charged for premium plan", "category": "billing", "priority": "high"},
    },
    {
        "path": "/api/tickets/",
        "method": "POST",
        "body": {"title": "Login broken", "description": "SSO redirect returns 500", "category": "technical", "priority": "critical"},
    },
    {
        "path": "/api/tickets/",
        "method": "POST",
        "body": {"title": "Slow dashboard", "description": "Charts take 10s to load", "category": "performance", "priority": "medium"},
    },
]


def fetch(base_url, path, method="GET", body=None):
    """Fetch from an API and return status, body, and timing."""
    url = base_url.rstrip("/") + path
    headers = {"Content-Type": "application/json"}
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    start = time.time()
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        elapsed_ms = int((time.time() - start) * 1000)
        resp_body = resp.read().decode("utf-8")
        return resp.getcode(), resp_body, elapsed_ms
    except urllib.error.HTTPError as e:
        elapsed_ms = int((time.time() - start) * 1000)
        resp_body = e.read().decode("utf-8") if e.fp else "{}"
        return e.code, resp_body, elapsed_ms
    except Exception as e:
        elapsed_ms = int((time.time() - start) * 1000)
        return 0, json.dumps({"error": str(e)}), elapsed_ms


def send_to_ingestion(request_id, tenant_id, traffic_type, endpoint, method,
                      status_code, response_time_ms, response_body):
    """Send a traffic event to the ingestion service."""
    event = {
        "request_id": request_id,
        "tenant_id": tenant_id,
        "traffic_type": traffic_type,
        "endpoint": endpoint,
        "method": method,
        "response_status": status_code,
        "response_time_ms": response_time_ms,
        "response_body": response_body,
        "ingestion_mode": "sdk",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
    }

    data = json.dumps(event).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "X-Tenant-ID": tenant_id,
        "X-API-Key": "sk-shadow-default-key-change-me",
    }
    req = urllib.request.Request(INGESTION_URL, data=data, headers=headers, method="POST")

    try:
        resp = urllib.request.urlopen(req, timeout=5)
        return True
    except Exception as e:
        return False


def run_traffic(v1_url, v2_url, count=30, interval=0.5):
    print(f"\n  Shadow Deploy — Traffic Generator (Direct Mode)")
    print(f"  V1 (Production): {v1_url}")
    print(f"  V2 (Shadow):     {v2_url}")
    print(f"  Ingestion:       {INGESTION_URL}")
    print(f"  Requests: {count} | Interval: {interval}s")
    print("=" * 70)

    stats = {"total": 0, "matched": 0, "mismatched": 0, "errors": 0}

    for i in range(count):
        # Pick a random request
        if random.random() < 0.7:
            req = random.choice(API_PATHS)
            body = None
        else:
            req = random.choice(POST_REQUESTS)
            body = req.get("body")

        path = req["path"]
        method = req["method"]
        tenant = random.choice(["tenant-alpha", "tenant-beta", "demo-tenant"])
        request_id = uuid.uuid4().hex

        # Call V1 (production)
        v1_status, v1_body, v1_time = fetch(v1_url, path, method, body)
        # Call V2 (shadow)
        v2_status, v2_body, v2_time = fetch(v2_url, path, method, body)

        # Determine if there's a difference
        bodies_match = v1_body.strip() == v2_body.strip()
        status_match = v1_status == v2_status
        latency_diff = v2_time - v1_time

        stats["total"] += 1
        if bodies_match and status_match:
            stats["matched"] += 1
            icon = "[SAME]"
        else:
            stats["mismatched"] += 1
            icon = "[DIFF]"

        # Send both events to ingestion
        ok1 = send_to_ingestion(request_id, tenant, "production", path, method,
                                v1_status, v1_time, v1_body)
        ok2 = send_to_ingestion(request_id, tenant, "shadow", path, method,
                                v2_status, v2_time, v2_body)

        if not ok1 or not ok2:
            stats["errors"] += 1

        print(
            f"  {icon} {i+1:3d}/{count}  {method:4s} {path:<25s}  "
            f"v1={v1_status}/{v1_time}ms  v2={v2_status}/{v2_time}ms  "
            f"delta={latency_diff:+d}ms  body={'match' if bodies_match else 'DIFF'}  "
            f"ingested={'OK' if ok1 and ok2 else 'FAIL'}"
        )

        if interval > 0:
            time.sleep(interval)

    print("=" * 70)
    print(f"\n  Results:")
    print(f"    Total:      {stats['total']}")
    print(f"    Matched:    {stats['matched']}  (v1 == v2)")
    print(f"    Mismatched: {stats['mismatched']}  (v1 != v2)")
    print(f"    Errors:     {stats['errors']}")
    print(f"\n  Check your dashboard: http://localhost:3004")
    print(f"  The comparison engine will process these and show")
    print(f"  real differences in severity, risk scores, and AI analysis.\n")


def main():
    parser = argparse.ArgumentParser(description="Shadow Deploy Traffic Generator")
    parser.add_argument("--v1", default=V1_URL, help=f"V1 (production) URL (default: {V1_URL})")
    parser.add_argument("--v2", default=V2_URL, help=f"V2 (shadow) URL (default: {V2_URL})")
    parser.add_argument("--count", type=int, default=30, help="Number of requests (default: 30)")
    parser.add_argument("--interval", type=float, default=0.5, help="Seconds between requests (default: 0.5)")
    args = parser.parse_args()

    # Connectivity check
    print("\n  Checking connectivity...")
    try:
        urllib.request.urlopen(f"{args.v1}/api/health", timeout=5)
        print(f"  V1 ({args.v1}) OK")
    except Exception:
        print(f"  ERROR: Cannot reach V1 at {args.v1}")
        sys.exit(1)

    try:
        urllib.request.urlopen(f"{args.v2}/api/health", timeout=5)
        print(f"  V2 ({args.v2}) OK")
    except Exception:
        print(f"  ERROR: Cannot reach V2 at {args.v2}")
        sys.exit(1)

    try:
        urllib.request.urlopen("http://localhost:8081/api/v1/ingest/health", timeout=5)
        print(f"  Ingestion service OK")
    except Exception:
        print(f"  WARNING: Ingestion service may not be reachable")

    run_traffic(args.v1, args.v2, args.count, args.interval)


if __name__ == "__main__":
    main()
