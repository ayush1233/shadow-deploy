#!/usr/bin/env python3
"""
mock-servers.py — Start two mock API servers with deliberate differences
to demonstrate Shadow Deploy's comparison capabilities.

V1 (Production) runs on port 5001
V2 (Shadow)     runs on port 5002

Differences:
  - /api/tickets/     → V2 adds 'priority_score' field, changes status values
  - /api/tickets/:id  → V2 returns different date format, adds 'assigned_to'
  - /api/tickets/stats → V2 has different counts and adds new category
  - /api/users/       → V2 adds 'role' field, removes 'phone'
  - /api/health       → V2 adds extra fields, different version

Usage:
    python cli/mock-servers.py
    Then update nginx upstream to point to host.docker.internal:5001 and :5002
"""

import json
import time
import random
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

# ──────────────────────────────────────────────
# V1 (Production) Data
# ──────────────────────────────────────────────
V1_TICKETS = [
    {"id": 1, "title": "Login page broken", "description": "SSO redirect fails with 500", "category": "technical", "priority": "critical", "status": "open", "created_at": "2026-03-01T10:30:00Z"},
    {"id": 2, "title": "Billing double charge", "description": "Customer charged twice for premium", "category": "billing", "priority": "high", "status": "in_progress", "created_at": "2026-03-02T14:20:00Z"},
    {"id": 3, "title": "Dashboard slow", "description": "Charts take 10s to render", "category": "performance", "priority": "medium", "status": "open", "created_at": "2026-03-03T09:15:00Z"},
    {"id": 4, "title": "Email notifications delayed", "description": "Alerts arriving 2 hours late", "category": "technical", "priority": "low", "status": "resolved", "created_at": "2026-03-04T16:45:00Z"},
    {"id": 5, "title": "API rate limit too low", "description": "Getting 429 errors at 50 req/s", "category": "technical", "priority": "medium", "status": "open", "created_at": "2026-03-05T11:00:00Z"},
]

V1_USERS = [
    {"id": 1, "name": "Alice Johnson", "email": "alice@example.com", "phone": "+1-555-0101", "plan": "premium"},
    {"id": 2, "name": "Bob Smith", "email": "bob@example.com", "phone": "+1-555-0102", "plan": "free"},
    {"id": 3, "name": "Carol Williams", "email": "carol@example.com", "phone": "+1-555-0103", "plan": "enterprise"},
]

V1_STATS = {
    "total_tickets": 127,
    "open": 45,
    "in_progress": 32,
    "resolved": 50,
    "categories": {"technical": 58, "billing": 34, "performance": 22, "general": 13},
    "avg_resolution_hours": 24.5,
}

# ──────────────────────────────────────────────
# V2 (Shadow) Data — with deliberate differences
# ──────────────────────────────────────────────
V2_TICKETS = [
    {"id": 1, "title": "Login page broken", "description": "SSO redirect fails with 500", "category": "technical", "priority": "critical", "priority_score": 9.5, "status": "OPEN", "created_at": "2026-03-01", "assigned_to": "team-auth"},
    {"id": 2, "title": "Billing double charge", "description": "Customer charged twice for premium", "category": "billing", "priority": "high", "priority_score": 8.0, "status": "IN_PROGRESS", "created_at": "2026-03-02", "assigned_to": "team-billing"},
    {"id": 3, "title": "Dashboard slow", "description": "Charts take 10s to render", "category": "performance", "priority": "medium", "priority_score": 5.5, "status": "OPEN", "created_at": "2026-03-03", "assigned_to": None},
    {"id": 4, "title": "Email notifications delayed", "description": "Alerts arriving 2 hours late", "category": "technical", "priority": "low", "priority_score": 2.0, "status": "RESOLVED", "created_at": "2026-03-04", "assigned_to": "team-notifications"},
    {"id": 5, "title": "API rate limit too low", "description": "Getting 429 errors at 50 req/s", "category": "infrastructure", "priority": "medium", "priority_score": 6.0, "status": "OPEN", "created_at": "2026-03-05", "assigned_to": "team-platform"},
    {"id": 6, "title": "New: Dark mode glitch", "description": "Toggle doesn't persist across sessions", "category": "ui", "priority": "low", "priority_score": 1.5, "status": "OPEN", "created_at": "2026-03-06", "assigned_to": None},
]

V2_USERS = [
    {"id": 1, "name": "Alice Johnson", "email": "alice@example.com", "role": "admin", "plan": "premium", "last_login": "2026-03-09T18:30:00Z"},
    {"id": 2, "name": "Bob Smith", "email": "bob@example.com", "role": "viewer", "plan": "free", "last_login": "2026-03-08T12:00:00Z"},
    {"id": 3, "name": "Carol Williams", "email": "carol@example.com", "role": "editor", "plan": "enterprise", "last_login": "2026-03-09T20:15:00Z"},
    {"id": 4, "name": "Dave Brown", "email": "dave@example.com", "role": "viewer", "plan": "premium", "last_login": "2026-03-07T09:00:00Z"},
]

V2_STATS = {
    "total_tickets": 134,
    "open": 48,
    "in_progress": 30,
    "resolved": 56,
    "categories": {"technical": 55, "billing": 34, "performance": 22, "infrastructure": 12, "ui": 8, "general": 3},
    "avg_resolution_hours": 18.2,
    "sla_compliance_percent": 94.5,
}


class V1Handler(BaseHTTPRequestHandler):
    """Production API — stable, established schema."""

    def do_GET(self):
        path = self.path.rstrip("/")

        if path == "/api/tickets" or path == "/api/tickets/":
            self.send_json({"count": len(V1_TICKETS), "results": V1_TICKETS})
        elif path.startswith("/api/tickets/") and path.replace("/api/tickets/", "").isdigit():
            tid = int(path.replace("/api/tickets/", ""))
            ticket = next((t for t in V1_TICKETS if t["id"] == tid), None)
            if ticket:
                self.send_json(ticket)
            else:
                self.send_json({"error": "Not found"}, 404)
        elif path == "/api/tickets/stats":
            self.send_json(V1_STATS)
        elif path == "/api/users" or path == "/api/users/":
            self.send_json({"count": len(V1_USERS), "results": V1_USERS})
        elif path == "/api/health" or path == "/health":
            self.send_json({"status": "healthy", "version": "1.0.0"})
        else:
            self.send_json({"error": "Not found", "path": self.path}, 404)

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length > 0 else b"{}"
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            data = {}

        path = self.path.rstrip("/")
        if path == "/api/tickets" or path == "/api/tickets/":
            new_ticket = {
                "id": random.randint(100, 999),
                "title": data.get("title", "Untitled"),
                "description": data.get("description", ""),
                "category": data.get("category", "general"),
                "priority": data.get("priority", "medium"),
                "status": "open",
                "created_at": "2026-03-09T20:00:00Z",
            }
            self.send_json(new_ticket, 201)
        else:
            self.send_json({"error": "Not found"}, 404)

    def send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass  # Suppress default logging


class V2Handler(BaseHTTPRequestHandler):
    """Shadow API — new schema with breaking changes and additions."""

    def do_GET(self):
        # Simulate slightly slower responses (new features add overhead)
        time.sleep(random.uniform(0.05, 0.2))

        path = self.path.rstrip("/")

        if path == "/api/tickets" or path == "/api/tickets/":
            self.send_json({"count": len(V2_TICKETS), "results": V2_TICKETS, "page": 1, "total_pages": 1})
        elif path.startswith("/api/tickets/") and path.replace("/api/tickets/", "").isdigit():
            tid = int(path.replace("/api/tickets/", ""))
            ticket = next((t for t in V2_TICKETS if t["id"] == tid), None)
            if ticket:
                self.send_json(ticket)
            else:
                self.send_json({"error": "Ticket not found", "code": "TICKET_NOT_FOUND"}, 404)
        elif path == "/api/tickets/stats":
            self.send_json(V2_STATS)
        elif path == "/api/users" or path == "/api/users/":
            self.send_json({"count": len(V2_USERS), "results": V2_USERS, "page": 1, "total_pages": 1})
        elif path == "/api/health" or path == "/health":
            self.send_json({"status": "healthy", "version": "2.0.0-beta", "features": ["ai-classify", "priority-score", "sla-tracking"]})
        else:
            self.send_json({"error": "Endpoint not found", "code": "NOT_FOUND", "path": self.path}, 404)

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length > 0 else b"{}"
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            data = {}

        time.sleep(random.uniform(0.05, 0.15))

        path = self.path.rstrip("/")
        if path == "/api/tickets" or path == "/api/tickets/":
            # V2 auto-classifies and adds priority_score
            new_ticket = {
                "id": random.randint(100, 999),
                "title": data.get("title", "Untitled"),
                "description": data.get("description", ""),
                "category": data.get("category", "general"),
                "priority": data.get("priority", "medium"),
                "priority_score": round(random.uniform(1.0, 10.0), 1),
                "status": "OPEN",
                "created_at": "2026-03-09",
                "assigned_to": None,
                "auto_classified": True,
            }
            self.send_json(new_ticket, 201)
        else:
            self.send_json({"error": "Endpoint not found", "code": "NOT_FOUND"}, 404)

    def send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass  # Suppress default logging


def run_server(handler, port, name):
    server = HTTPServer(("0.0.0.0", port), handler)
    print(f"  {name} listening on port {port}")
    server.serve_forever()


def main():
    print("\n  Shadow Deploy — Mock API Servers")
    print("=" * 50)
    print("  These servers have DELIBERATE differences:")
    print("  - V2 adds new fields (priority_score, assigned_to, role)")
    print("  - V2 removes fields (phone from users)")
    print("  - V2 changes date format (ISO datetime -> date only)")
    print("  - V2 changes status casing (open -> OPEN)")
    print("  - V2 changes counts (127 -> 134 tickets)")
    print("  - V2 adds new categories (infrastructure, ui)")
    print("  - V2 has extra latency (50-200ms)")
    print("  - V2 has extra items (6 tickets vs 5, 4 users vs 3)")
    print("=" * 50)

    t1 = threading.Thread(target=run_server, args=(V1Handler, 5001, "V1 (Production)"), daemon=True)
    t2 = threading.Thread(target=run_server, args=(V2Handler, 5002, "V2 (Shadow)"), daemon=True)
    t1.start()
    t2.start()

    print("\n  Now update NGINX config and restart:")
    print("    production-backend -> host.docker.internal:5001")
    print("    shadow-backend     -> host.docker.internal:5002")
    print("\n  Press Ctrl+C to stop\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n  Servers stopped.")


if __name__ == "__main__":
    main()
