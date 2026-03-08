#!/usr/bin/env python3
"""
healthcheck.py — Check if all Shadow Deploy services are running and reachable.

Usage:
    python cli/healthcheck.py
    python cli/healthcheck.py --json
    python cli/healthcheck.py --wait  (waits up to 120s for all services)
"""

import argparse
import json
import sys
import time
import urllib.request
import urllib.error
import socket

SERVICES = [
    {"name": "NGINX Proxy", "url": "http://localhost:8080/health", "type": "http", "critical": True},
    {"name": "Ingestion Service", "url": "http://localhost:8081/actuator/health", "type": "http", "critical": True},
    {"name": "Comparison Engine", "url": "http://localhost:8082/actuator/health", "type": "http", "critical": True},
    {"name": "API Service", "url": "http://localhost:8083/actuator/health", "type": "http", "critical": True},
    {"name": "AI Service", "url": "http://localhost:8005/health", "type": "http", "critical": False},
    {"name": "Kafka", "host": "localhost", "port": 29092, "type": "tcp", "critical": True},
    {"name": "Redis", "host": "localhost", "port": 6379, "type": "tcp", "critical": True},
    {"name": "Grafana", "url": "http://localhost:3001", "type": "http", "critical": False},
    {"name": "Prometheus", "url": "http://localhost:9090/-/healthy", "type": "http", "critical": False},
]


def check_http(url, timeout=5):
    try:
        req = urllib.request.urlopen(url, timeout=timeout)
        return {"status": "healthy", "code": req.getcode()}
    except urllib.error.HTTPError as e:
        return {"status": "unhealthy", "code": e.code, "error": str(e)}
    except Exception as e:
        return {"status": "unreachable", "error": str(e)}


def check_tcp(host, port, timeout=3):
    try:
        sock = socket.create_connection((host, port), timeout=timeout)
        sock.close()
        return {"status": "healthy"}
    except Exception as e:
        return {"status": "unreachable", "error": str(e)}


def run_checks(wait=False, max_wait=120):
    """Run health checks on all services. If wait=True, retry until all critical services are up."""
    start = time.time()

    while True:
        results = []
        all_critical_up = True

        for svc in SERVICES:
            if svc["type"] == "http":
                result = check_http(svc["url"])
            else:
                result = check_tcp(svc["host"], svc["port"])

            result["name"] = svc["name"]
            result["critical"] = svc["critical"]
            results.append(result)

            if svc["critical"] and result["status"] != "healthy":
                all_critical_up = False

        if not wait or all_critical_up or (time.time() - start) > max_wait:
            return results

        elapsed = int(time.time() - start)
        print(f"  Waiting for services... ({elapsed}s / {max_wait}s)")
        time.sleep(5)


def print_results(results):
    print("\n  Shadow Deploy — Service Health Check")
    print("=" * 50)

    healthy = 0
    total = len(results)

    for r in results:
        if r["status"] == "healthy":
            icon = "[OK]"
            healthy += 1
        elif r["critical"]:
            icon = "[FAIL]"
        else:
            icon = "[WARN]"
        tag = " [CRITICAL]" if r["critical"] and r["status"] != "healthy" else ""
        print(f"  {icon} {r['name']:<25} {r['status']}{tag}")

    print("=" * 50)
    print(f"  {healthy}/{total} services healthy")

    critical_down = [r for r in results if r["critical"] and r["status"] != "healthy"]
    if critical_down:
        print(f"\n  {len(critical_down)} critical service(s) are DOWN!")
        return False

    print("\n  All critical services are operational!")
    return True


def main():
    parser = argparse.ArgumentParser(description="Shadow Deploy Health Check")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--wait", action="store_true", help="Wait for all critical services to be up (max 120s)")
    parser.add_argument("--timeout", type=int, default=120, help="Max wait time in seconds")
    args = parser.parse_args()

    results = run_checks(wait=args.wait, max_wait=args.timeout)

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        success = print_results(results)
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
