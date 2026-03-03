#!/usr/bin/env python3
"""
shadowctl — Shadow API Validation Platform CLI

Usage:
    shadowctl report --env=staging --last=1h
    shadowctl deployment-status --build=123
    shadowctl config --show
"""

import argparse
import json
import sys
import os
from datetime import datetime, timedelta

API_URL = os.getenv("SHADOW_API_URL", "http://localhost:8083/api/v1")
API_TOKEN = os.getenv("SHADOW_API_TOKEN", "")

# ── Colors ──
class Colors:
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    PURPLE = "\033[95m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"

def c(text, color):
    return f"{color}{text}{Colors.RESET}"

# ── Report Command ──
def cmd_report(args):
    print(c("\n╔══════════════════════════════════════════════╗", Colors.CYAN))
    print(c("║   Shadow API — Validation Report             ║", Colors.CYAN))
    print(c("╚══════════════════════════════════════════════╝\n", Colors.CYAN))

    print(f"  {c('Environment:', Colors.DIM)}  {c(args.env, Colors.BOLD)}")
    print(f"  {c('Time Range:', Colors.DIM)}   Last {c(args.last, Colors.BOLD)}")
    print(f"  {c('Generated:', Colors.DIM)}    {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Demo data
    risk_score = 3.2
    risk_color = Colors.GREEN if risk_score <= 3 else Colors.YELLOW if risk_score <= 6 else Colors.RED
    status = "SAFE" if risk_score <= 5 else "BLOCKED"
    status_color = Colors.GREEN if status == "SAFE" else Colors.RED

    print(f"  {c('━━━ Overview ━━━', Colors.PURPLE)}")
    print(f"  Deployment Risk Score:  {c(f'{risk_score:.1f}', risk_color)} / 10.0")
    print(f"  Status:                 {c(f'● {status}', status_color)}")
    print(f"  Total Requests:         {c('154,200', Colors.BLUE)}")
    print(f"  Comparisons:            {c('148,750', Colors.BLUE)}")
    print(f"  Mismatches:             {c('1,287', Colors.YELLOW)} ({c('0.87%', Colors.YELLOW)})")
    print()

    print(f"  {c('━━━ Severity Breakdown ━━━', Colors.PURPLE)}")
    print(f"  {c('●', Colors.RED)} Critical:  {c('12', Colors.RED)}")
    print(f"  {c('●', Colors.YELLOW)} High:      {c('89', Colors.YELLOW)}")
    print(f"  {c('●', Colors.BLUE)} Medium:    {c('456', Colors.BLUE)}")
    print(f"  {c('●', Colors.GREEN)} Low:       {c('730', Colors.GREEN)}")
    print()

    print(f"  {c('━━━ Top Mismatched Endpoints ━━━', Colors.PURPLE)}")
    endpoints = [
        ("/api/orders", 567, "high"),
        ("/api/users", 234, "medium"),
        ("/api/products", 123, "low"),
        ("/api/payments", 98, "low"),
    ]
    for ep, count, severity in endpoints:
        sev_color = Colors.RED if severity == "high" else Colors.YELLOW if severity == "medium" else Colors.GREEN
        bar = "█" * min(count // 20, 30)
        print(f"  {ep:<25} {c(str(count), sev_color):>6}  {c(bar, sev_color)}")

    print(f"\n  {c('━━━ Latency ━━━', Colors.PURPLE)}")
    print(f"  Production p95:  {c('78ms', Colors.GREEN)}")
    print(f"  Shadow p95:      {c('85ms', Colors.PURPLE)}")
    print(f"  Delta:           {c('+7ms', Colors.YELLOW)}")
    print()

    dashboard_url = os.getenv("SHADOW_DASHBOARD_URL", "http://localhost:3000")
    print(f"  {c('Dashboard:', Colors.DIM)} {c(dashboard_url, Colors.CYAN)}")
    print()


# ── Deployment Status Command ──
def cmd_deployment_status(args):
    print(c("\n╔══════════════════════════════════════════════╗", Colors.CYAN))
    print(c("║   Shadow API — Deployment Status             ║", Colors.CYAN))
    print(c("╚══════════════════════════════════════════════╝\n", Colors.CYAN))

    build_id = args.build
    risk_score = 3.2
    risk_color = Colors.GREEN if risk_score <= 3 else Colors.YELLOW if risk_score <= 6 else Colors.RED

    print(f"  Build ID:          {c(build_id, Colors.BOLD)}")
    print(f"  Status:            {c('● ANALYZING', Colors.YELLOW)}")
    print(f"  Risk Score:        {c(f'{risk_score:.1f}', risk_color)} / 10.0")
    print(f"  Approval:          {c('PENDING', Colors.YELLOW)}")
    print(f"  Traffic Mirrored:  {c('10%', Colors.BLUE)}")
    print(f"  Duration:          {c('45 minutes', Colors.DIM)}")
    print(f"  Mismatches:        {c('127', Colors.YELLOW)} / {c('15,420', Colors.BLUE)} requests")
    print()

    if risk_score <= 5:
        print(f"  {c('✅ Recommendation: Safe to promote', Colors.GREEN)}")
    else:
        print(f"  {c('❌ Recommendation: Manual review required', Colors.RED)}")
    print()


# ── Main ──
def main():
    parser = argparse.ArgumentParser(
        prog="shadowctl",
        description="Shadow API Validation Platform CLI"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # report
    report_parser = subparsers.add_parser("report", help="Generate validation report")
    report_parser.add_argument("--env", default="staging", help="Environment")
    report_parser.add_argument("--last", default="1h", help="Time range")

    # deployment-status
    deploy_parser = subparsers.add_parser("deployment-status", help="Check deployment status")
    deploy_parser.add_argument("--build", required=True, help="Build ID")

    args = parser.parse_args()

    if args.command == "report":
        cmd_report(args)
    elif args.command == "deployment-status":
        cmd_deployment_status(args)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
