# 🔮 Shadow API Validation Platform

[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=github-actions)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk)](https://openjdk.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?logo=supabase)](https://supabase.com)

> **Ship API changes with confidence.** Mirror production traffic to your new API version, compare every response using AI, and get a deployment risk score — all without affecting a single real user.

---

## 📖 Table of Contents

- [The Problem](#-the-problem)
- [How Shadow Deployment Works](#-how-shadow-deployment-works)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Dashboard](#-dashboard)
- [Components Deep Dive](#-components-deep-dive)
- [Advanced Features](#-advanced-features)
  - [Traffic Percentage Control](#traffic-percentage-control)
  - [Noise Detection](#noise-detection)
- [AI Comparison Engine (Gemini)](#-ai-comparison-engine-gemini)
- [Traffic Ingestion Modes](#-traffic-ingestion-modes)
- [SDKs & Plugins](#-sdks--plugins)
- [CI/CD Integration](#-cicd-integration)
- [AI NGINX Configurator](#-ai-nginx-configurator)
- [CLI Tool](#-cli-tool)
- [Security](#-security)
- [How Large Companies Use Shadow Deployment](#-how-large-companies-use-shadow-deployment)
- [Project Structure](#-project-structure)

---

## 🔥 The Problem

Deploying API changes is risky. Even with unit tests, integration tests, and staging environments, **bugs slip through to production** because:

- **Staging never has real traffic patterns** — 1000 test users ≠ 1 million real users
- **Edge cases only appear at scale** — race conditions, null fields, timezone issues
- **Breaking changes are invisible** — a renamed JSON field can silently break mobile apps
- **Rollbacks happen too late** — by the time you notice, thousands of requests have failed

### The Solution: Shadow Deployment

Instead of hoping your tests catch everything, **mirror real production traffic** (all of it, or just a configurable percentage) to your new API version, compare every single response with AI, and get a deployment risk score before you ship.

**Zero user impact. Real traffic. Complete confidence.**

---

## 🌊 How Shadow Deployment Works

Shadow deployment is **not** about duplicating your entire website. It's about running your new API version **alongside** your existing one and comparing their outputs:

```
                    ┌──────────────────────────────────────┐
                    │          NGINX Reverse Proxy          │
  User Request ────▶│                                      │
                    │  1. Forward to Production API (v1)    │──── User gets this response ✓
                    │  2. MIRROR to Shadow API (v2)         │──── Response captured & compared
                    │                                      │     (user never sees this)
                    └──────────────────────────────────────┘
                                     │
                                     ▼
                         ┌─────────────────────┐
                         │  Comparison Engine   │
                         │  • Status codes      │
                         │  • Response bodies   │
                         │  • Latency deltas    │
                         │  • AI analysis       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  Risk Score: 2.1/10  │
                         │  ✅ Safe to deploy   │
                         └─────────────────────┘
```

### The Key Principles

| Principle | Explanation |
|-----------|-------------|
| **Users are never affected** | The shadow response is captured but never returned to the user |
| **Real traffic, real bugs** | You test with actual production requests, not synthetic data |
| **Only the API needs a shadow** | The frontend stays the same — you don't duplicate the whole app |
| **Containers make it easy** | Your v2 is just another Docker container or Kubernetes deployment |
| **AI understands context** | Gemini AI determines if a difference is a bug or an improvement |

---

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client     │────▶│   NGINX Proxy    │────▶│  Production API │
│   Traffic    │     │  (Mirror Layer)  │     │     (v1)        │
└─────────────┘     │                  │     └─────────────────┘
                    │  Mirror Traffic   │
                    │  ──────────────▶  │────▶┌─────────────────┐
                    └────────┬─────────┘     │   Shadow API    │
                             │               │     (v2)        │
                    ┌────────▼─────────┐     └─────────────────┘
                    │ Ingestion Service │
                    │  (Spring Boot)   │
                    └────────┬─────────┘
                             │ Kafka
                    ┌────────▼─────────┐
                    │   Apache Kafka    │
                    │  • prod-traffic   │
                    │  • shadow-traffic │
                    └────────┬─────────┘
                             │
                    ┌────────▼──────────┐     ┌─────────────────┐
                    │ Comparison Engine  │────▶│  AI Service     │
                    │  (Spring Boot)    │     │  (FastAPI +     │
                    │  + Redis Join     │     │   Gemini API)   │
                    └────────┬──────────┘     └─────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Supabase        │
                    │  (PostgreSQL)    │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ React Dashboard   │
                    │ (Supabase Auth)  │
                    └──────────────────┘
```

### Data Flow (Step by Step)

1. **User makes a request** → hits the NGINX reverse proxy
2. **NGINX forwards** the request to the production API (v1) and returns the response to the user
3. **NGINX mirrors** (copies) the same request to the shadow API (v2) — user is unaware
4. **Ingestion Service** captures both responses and publishes them to separate Kafka topics
5. **Comparison Engine** consumes from both topics, joins by `request_id` using Redis
6. **Deterministic comparison** runs first: status codes, headers, JSON deep diff
7. If there's a mismatch → **AI Service** (Gemini) analyzes the semantic meaning of the difference
8. **Risk score** is calculated and the result is stored in **Supabase** (PostgreSQL)
9. **React Dashboard** displays real-time results with filtering, severity badges, and AI explanations

---

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose**
- **Python 3.8+** (for setup and CLI tools)
- **Node.js 18+** (for dashboard)
- A **Supabase** Project ([supabase.com](https://supabase.com))
- (Optional) **Gemini API Key**

### Step 1: Clone & Setup
The platform includes an interactive setup wizard that configures all environment variables, directory structures, and Docker configurations.

```bash
git clone <repo-url> shadow-deploy
cd shadow-deploy
make setup
```

### Step 2: Start the Platform
Once configured, spin up the entire microservice stack with one command:

```bash
make start
```

### Step 3: Verify Health
Ensure all 9+ services (Kafka, Redis, Spring Boot APIs, AI Service) are running correctly:

```bash
make health
```

### Step 4: Start Mock API Servers
Start the V1 (production) and V2 (shadow) mock APIs with deliberate differences:

```bash
python cli/mock-servers.py
```

### Step 5: Generate Traffic & Populate Dashboard
Send traffic through both APIs and submit the results for comparison:

```bash
python cli/generate-traffic.py --count 30
```

### 🛠️ Common Makefile Commands

| Command | Description |
|---------|-------------|
| `make setup` | Run interactive configuration wizard |
| `make start` | Build and start all Docker containers |
| `make stop` | Stop and remove all containers |
| `make logs` | Tail logs for all services |
| `make health` | Run aggregate service health checks |
| `make dev` | Run dashboard in local development mode |
| `make clean` | Wipe volumes and reset environment |

### Service Ports

| Service | URL | Description |
|---------|-----|-------------|
| **Dashboard** | http://localhost:3004 | React dashboard (dev mode via Vite) |
| **NGINX Proxy** | http://localhost:8080 | Traffic mirror & routing point |
| **Mock API v1** | http://localhost:5001 | "Production" mock server |
| **Mock API v2** | http://localhost:5002 | "Shadow" mock server (with differences) |
| **Ingestion Service** | http://localhost:8081 | Traffic event ingestion |
| **Comparison Engine** | http://localhost:8082 | Redis join + comparison |
| **API Service** | http://localhost:8083 | Main control plane API |
| **AI Service** | http://localhost:8000 | Gemini comparison & configuration |
| **Kafka** | localhost:9092 | Message broker |
| **Redis** | localhost:6379 | Correlation cache |

---

## ☁️ Hybrid Cloud Deployment (AWS Free Tier)

Shadow Deploy is designed to be flexible. If you are constrained by **AWS Free Tier (1GB RAM)**, you can use the **Hybrid Architecture**:

1. **Host the lightweight APIs (Production v1 & Shadow v2)** on the AWS EC2 instance.
2. **Host the resource-heavy Shadow Deploy Platform** (Kafka, Redis, Spring Boot engines, Dashboard) locally on your machine.
3. Configure your local NGINX proxy to route traffic seamlessly to the cloud-hosted APIs using remote upstream IP addresses.

*Read the full [AWS Deployment Guide](docs/aws_deployment_guide.md) for step-by-step instructions on setting up this architecture.*

---

## 📊 Dashboard Features

- **Quick Configure Wizard**: Multi-step guide to set up production/shadow routing using natural language AI.
- **Interactive Website Testing**: Live path-testing tool to compare any two URLs in real-time.
- **Advanced Diff Viewer**: High-fidelity JSON diffing using `react-diff-viewer-continued`.
- **Dynamic Charting**: Responsive, auto-scaling latency charts (switches to horizontal layout for high endpoint counts) powered by `recharts`.
- **Historical Trends**: 7-day risk vs. pass rate charts.
- **Actionable Notifications**: Configure Slack, Email, and Webhook thresholds for high-risk deployments.
- **Reporting**: One-click **PDF** and **CSV** exports for audit trials and stakeholder reports.
- **Endpoint Tagging**: Organize your API surface with visual metadata (e.g., `Critical`, `Legacy`).

### Zero-Friction Setup
The Dashboard now features **Auto-Seeded Authentication**. A Spring Boot `CommandLineRunner` automatically provisions the default `admin` user with secure BCrypt hashing on database initialization, and the React login page comes pre-filled so you can start analyzing traffic immediately.

---

## 🔧 Shadow CLI (`shadowctl`)

Our unified Python CLI tool for platform management:

```bash
# Check overall pipeline health
python cli/shadowctl.py health

# View current container status
python cli/shadowctl.py status

# Trigger a manual endpoint comparison test
python cli/shadowctl.py test --endpoint /api/v1/users

# Configure NGINX proxy via natural language
python cli/shadowctl.py configure --prompt "Mirror 20% of traffic to port 4001"
```

---

## 📊 Dashboard

The dashboard is built with **React 18, TypeScript, Recharts**, and a **premium dark theme** inspired by Stripe and Linear.

### Pages

#### 1. Overview Page
- **Key Metrics**: Total requests, mismatches, mismatch rate, deployment risk score
- **Severity Breakdown**: Visual distribution of none/low/medium/high/critical mismatches
- **Top Endpoints**: Most impacted API endpoints ranked by mismatch count
- **Latency Delta**: P50, P95, P99 latency differences between v1 and v2

#### 2. Endpoint Analysis Page
- **Filterable Table**: Browse all comparisons with endpoint, method, severity, and status filters
- **Status Badges**: Color-coded severity (green → red) for quick scanning
- **Click-Through**: Click any row to see the full comparison detail

#### 3. Comparison Detail Page
- **Side-by-Side View**: Production vs Shadow response bodies displayed side by side
- **Field-Level Diffs**: Exact paths that changed (e.g., `/users/0/email`), showing old vs new values
- **AI Analysis**: Gemini's semantic explanation of why responses differ
- **Risk Assessment**: Whether to proceed, review, or block the deployment

### Authentication
- Powered by **Supabase Auth** (email + password)
- Session-based protection — no need for manual token management
- Sign up and sign in directly from the login page

---

## 🔬 Components Deep Dive

### 1. NGINX Proxy (Traffic Mirror)

The NGINX proxy is the entry point. It forwards the request to your production API and simultaneously **mirrors** it to your shadow API:

```nginx
location /api/ {
    proxy_pass http://production-backend;
    mirror /mirror;
    mirror_request_body on;
}

location = /mirror {
    internal;
    proxy_pass http://shadow-backend$request_uri;
}
```

**Key features:**
- Zero-copy traffic mirroring (no performance impact)
- `X-Request-ID` injection for correlation
- Configurable upstream definitions
- AI-powered natural language configuration (see AI NGINX Configurator)

### 2. Ingestion Service (Spring Boot)

Normalizes traffic events from three sources and publishes to Kafka:

- **Reverse Proxy mode** — NGINX sends traffic events
- **API Gateway Plugin** — Kong captures request/response lifecycle
- **SDK mode** — Java/Node.js middleware posts events

**Kafka Topics:**
| Topic | Key | Use |
|-------|-----|-----|
| `prod-traffic` | `tenant_id:request_id` | Production response events |
| `shadow-traffic` | `tenant_id:request_id` | Shadow response events |
| `comparison-results` | `tenant_id:request_id` | Enriched comparison output |
| `alerts` | `tenant_id:request_id` | High/critical severity alerts |

### 3. Comparison Engine (Spring Boot + Redis)

The core engine that pairs and compares responses:

1. **Stream Join** — Uses Redis to correlate production and shadow responses by `request_id` (with TTL expiry for unmatched pairs)
2. **Deterministic Comparison:**
   - HTTP status code match
   - Response header diff
   - JSON deep diff (field-level)
   - Response time delta
3. **Noise Detection** — Known noisy fields (e.g., `timestamp`, `request_id`) are tagged `NOISE` and excluded from mismatch counts
4. **AI Escalation** — If deterministic checks find real mismatches, the pair is sent to the AI service for semantic analysis
5. **Risk Scoring** — Weighted formula produces a 0–10 score

---

## ⚡ Advanced Features

### Traffic Percentage Control

Control what percentage of production traffic gets mirrored to the shadow backend. Set in `.env` or via the setup wizard:

```bash
# Mirror only 10% of traffic (safe for high-traffic production systems)
MIRROR_PERCENTAGE=10
```

Uses NGINX `split_clients` to hash each request ID — deterministic, stateless, and zero-overhead.

| Value | Effect |
|-------|--------|
| `100` | All traffic mirrored (default) |
| `50` | Half of all requests mirrored |
| `10` | 10% sampled — good for high-traffic APIs |
| `0` | Shadow testing paused |

### Noise Detection

Eliminate false-positive mismatches caused by fields that are inherently different on every request (timestamps, request IDs, session tokens).

**Two layers of noise management:**

#### 1. Auto-Detection (Inspired by Twitter Diffy)
After each comparison, the engine tracks which JSON paths differed. If a field changes in **>80% of comparisons** for the same `tenant:endpoint` pair, it is automatically flagged as "noisy" and tagged accordingly in future comparisons.

```
After 10+ comparisons of GET /api/users:
  /timestamp   → differs 100% of the time → auto-flagged as NOISE
  /request_id  → differs 100% of the time → auto-flagged as NOISE
  /email       → differs 2% of the time   → treated as real diff
```

Noise profiles are scoped per `{tenant_id}:{endpoint}` and refresh every 24 hours via Redis TTL.

#### 2. Manual Field Management (REST API)

Add or remove ignored fields without restarting any services:

```bash
# Add a field to ignore globally
curl -X POST http://localhost:8082/api/v1/noise-fields \
  -H 'Content-Type: application/json' \
  -d '{"field": "updated_at"}'

# List all manually ignored fields
curl http://localhost:8082/api/v1/noise-fields

# See auto-detected noisy fields for a specific endpoint
curl 'http://localhost:8082/api/v1/noise-fields/auto?tenant=default&endpoint=/api/tickets'

# Remove a field
curl -X DELETE http://localhost:8082/api/v1/noise-fields/updated_at
```

#### Transparency: NOISE-Tagged Diffs

Noisy diffs are **not silently hidden** — they appear in results with `"diff_type": "NOISE"` so you always know what's being filtered. Only real diffs affect your risk score and alert thresholds.


### 4. AI Service (Python FastAPI + Gemini)

The intelligence layer that turns raw diffs into actionable insights:

#### PII Masking
Before any response body is sent to the AI, sensitive data is automatically masked:
- Email addresses → `***@***.com`
- SSNs → `***-**-****`
- Credit card numbers → `****-****-****-1234`
- API keys and tokens → `[REDACTED]`

#### Semantic Comparison (Gemini)
Gemini evaluates whether differences are **meaningful**:
- "Added a `cache_ttl` field" → **Safe** (additive, non-breaking)
- "Changed `status` from 'active' to 'pending'" → **Risky** (semantic change)
- "Returns 500 instead of 200" → **Critical** (breaking regression)

#### Risk Score Formula

```
Risk = (1 - similarity_score) × 3.5     # 35% weight
     + status_mismatch × 2.5            # 25% weight
     + field_diff_count × 0.2           # 20% weight (capped)
     + structure_changed × 1.0          # 10% weight
     + latency_factor × 1.0            # 10% weight
```

| Score | Severity | Action |
|-------|----------|--------|
| 0–1 | None | ✅ Auto-deploy |
| 1–3 | Low | ✅ Safe to proceed |
| 3–5 | Medium | ⚠️ Review recommended |
| 5–7 | High | 🔴 Manual review required |
| 7–10 | Critical | 🚫 Block deployment |

Without a Gemini API key (or if the key returns errors), the service falls back to **smart programmatic analysis** that generates meaningful explanations from the field-level diffs — including added/removed/modified field counts, impact assessment, and confidence scores.

---

## 🔌 Traffic Ingestion Modes

### Mode 1: NGINX Reverse Proxy (Recommended)

The simplest approach — NGINX mirrors traffic at the network level. No code changes needed.

```
Client → NGINX → Production API (user sees this)
                ↘ Shadow API (mirrored, invisible)
```

**Best for:** Any HTTP/REST API. Zero code instrumentation required.

### Mode 2: API Gateway Plugin (Kong)

A Kong plugin that captures request/response pairs and sends them to the ingestion service.

```lua
-- kong/plugins/shadow-api/handler.lua
function ShadowApiHandler:log(conf)
    -- Captures full request + response after Kong processes it
    send_to_ingestion(request_data, response_data)
end
```

**Best for:** Organizations already using Kong as their API gateway.

### Mode 3: SDK Integration

Middleware that wraps your API handlers and captures traffic:

**Best for:** Microservice architectures where you want per-service control over what gets mirrored.

---

## 📦 SDKs & Plugins

### Java SDK (Spring Boot)

```java
@Bean
public ShadowApiInterceptor shadowInterceptor() {
    return ShadowApiInterceptor.builder()
        .ingestionUrl("http://shadow-proxy:8080/ingest/event")
        .apiKey("sk-shadow-your-key")
        .tenantId("your-tenant")
        .batchSize(50)          // Async batched sending
        .flushIntervalMs(5000)  // Flush every 5s
        .build();
}
```

### Node.js SDK (Express)

```javascript
const { shadowMiddleware } = require('@shadow-api/node-sdk');

app.use(shadowMiddleware({
    ingestionUrl: 'http://shadow-proxy:8080/ingest/event',
    apiKey: 'sk-shadow-your-key',
    tenantId: 'your-tenant',
    batchSize: 50,
    flushIntervalMs: 5000,
}));
```

### Kong Plugin

```yaml
plugins:
  - name: shadow-api
    config:
      ingestion_url: http://ingestion-service:8081/ingest/event
      api_key: sk-shadow-your-key
      tenant_id: your-tenant
```

---

## 📊 CI/CD Integration

The GitHub Actions workflow (`.github/workflows/shadow-validation.yml`) implements automated shadow validation as part of your deployment pipeline:

```
┌─────────────────────────────────────────────────────────┐
│                    CI/CD Pipeline                       │
│                                                         │
│  1. Build new API version                               │
│  2. Deploy as shadow container                          │
│  3. Configure NGINX to mirror traffic to shadow         │
│  4. Wait for N minutes of real traffic                  │
│  5. Query comparison results from API                   │
│  6. Check deployment risk score                         │
│                                                         │
│  Risk < 3.0? ──Yes──▶ ✅ Auto-promote to production     │
│       │                                                 │
│       No──▶  🚫 Block deployment                        │
│             📧 Send Slack/email alert                   │
│             📊 Attach risk report                       │
└─────────────────────────────────────────────────────────┘
```

### Alert Templates

- **Slack** — Rich notification with risk score, top mismatches, and action buttons
- **Email** — HTML report with severity breakdown and diff examples

---

## 🧠 AI NGINX Configurator

A natural-language interface that lets you configure NGINX traffic routing by describing what you want in plain English:

```
"Route production traffic to port 3000 and shadow traffic to port 4000"
```

The AI service parses this and rewrites the NGINX configuration automatically:

```bash
# Via CLI
python cli/configure-proxy.py "Mirror 50% of traffic from port 3000 to port 4000"

# Via Dashboard
# Go to Overview → Dynamic AI Configurator → Type your instruction → Apply
```

**How it works:**
1. Your instruction is sent to the Gemini API
2. Gemini extracts port numbers and routing rules
3. The `configurator.py` generates a valid NGINX config
4. The config is written to `/etc/nginx/conf.d/`
5. NGINX is reloaded (zero-downtime)

---

## 🔧 CLI Tool

```bash
# Generate a validation report for the last hour
python cli/shadowctl.py report --env=staging --last=1h

# Check deployment status for a specific build
python cli/shadowctl.py deployment-status --build=123

# Configure NGINX proxy with natural language
python cli/configure-proxy.py "Route production to port 3000, shadow to port 4000"
```

---

## 🔐 Security

| Layer | Implementation |
|-------|----------------|
| **Authentication** | Supabase Auth (email + password, JWT sessions) |
| **API Protection** | API key authentication for ingestion endpoints |
| **PII Masking** | Emails, SSNs, tokens masked before AI analysis |
| **Row-Level Security** | Supabase RLS policies on all tables |
| **Rate Limiting** | Per-tenant NGINX rate limiting |
| **TLS** | Configurable TLS between all services |
| **Logging** | Structured JSON logging across all services |
| **Multi-Tenancy** | Tenant isolation via `tenant_id` on every record |

---

## 🏢 How Large Companies Use Shadow Deployment

Shadow deployment is a battle-tested strategy used by the world's largest engineering teams:

| Company | Approach | Scale |
|---------|----------|-------|
| **Netflix** | Zuul proxy mirrors traffic to canary instances | Billions of requests/day |
| **Twitter/X** | [Diffy](https://github.com/twitter/diffy) compares production vs shadow responses | Millions of API calls |
| **GitHub** | [Scientist](https://github.com/github/scientist) runs old + new code paths simultaneously | Every deploy |
| **Google** | Internal shadow traffic system for all major APIs | All services |
| **Facebook** | Dark launches — features deployed but hidden from users | Global rollouts |

### Why They Don't Duplicate the Whole Website

The common misconception is that shadow deployment requires cloning your entire application. In reality:

1. **Only the backend API needs a shadow version** — the frontend stays exactly the same
2. **The shadow is just another container** — in Kubernetes, it's one YAML file
3. **Traffic mirroring is done at the proxy layer** — NGINX/Envoy/Istio handles it automatically
4. **Users never interact with the shadow** — they always see the production response

This platform handles the **hard part**: not the traffic mirroring (NGINX does that easily), but the **comparison of millions of responses** and **AI-powered analysis** of what broke and whether it's safe to deploy.

---

## 📁 Project Structure

```
shadow-deploy/
├── docker-compose.yml              # Full infrastructure + all services
├── nginx/                          # Reverse proxy with traffic mirroring
│   ├── nginx.conf                  # Mirror configuration
│   └── Dockerfile
├── ingestion-service/              # Spring Boot — captures traffic events
│   └── src/main/java/.../
│       ├── controller/IngestionController.java
│       ├── service/KafkaProducerService.java
│       ├── model/TrafficEvent.java
│       └── filter/TenantFilter.java
├── comparison-engine/              # Spring Boot — joins & compares
│   └── src/main/java/.../
│       ├── consumer/TrafficConsumer.java
│       ├── service/DeterministicComparator.java  # Comparison + NOISE tagging
│       ├── service/NoiseDetectionService.java     # Auto noise detection via Redis
│       ├── service/AIComparisonClient.java
│       ├── service/RiskScoreCalculator.java
│       └── controller/NoiseFieldController.java  # REST API for noise fields
├── api-service/                    # Spring Boot — REST API + JWT auth
│   └── src/main/java/.../
│       ├── controller/ComparisonController.java
│       ├── controller/MetricsController.java
│       ├── controller/AuthController.java
│       └── security/SecurityConfig.java
├── ai-service/                     # Python FastAPI — Gemini AI
│   ├── main.py                     # API endpoints
│   ├── configurator.py             # Natural language → NGINX config
│   └── comparison/
│       ├── semantic_comparator.py  # Gemini semantic comparison
│       ├── pii_masker.py           # Sensitive data masking
│       └── risk_scorer.py          # Risk score calculation
├── dashboard/                      # React 18 + TypeScript
│   ├── src/
│   │   ├── services/
│   │   │   ├── supabase.ts         # Supabase client
│   │   │   └── api.ts              # Data layer (reads from Supabase)
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx       # Supabase Auth login
│   │   │   ├── OverviewPage.tsx    # Metrics dashboard
│   │   │   ├── EndpointAnalysisPage.tsx  # Comparison browser
│   │   │   └── ComparisonDetailPage.tsx  # Detail view + AI analysis
│   │   └── App.tsx                 # Router + auth guards
│   ├── supabase-schema.sql         # Database tables + seed data
│   └── nginx.conf                  # Production Nginx config
├── sdks/
│   ├── java-sdk/                   # Spring Boot interceptor SDK
│   └── node-sdk/                   # Express middleware SDK
├── gateway-plugin/                 # Kong API gateway plugin
├── cli/                            # Command-line tools
│   ├── shadowctl.py                # Report & deployment CLI
│   ├── configure-proxy.py          # AI NGINX configurator CLI
│   ├── mock-servers.py             # V1/V2 mock APIs with deliberate diffs
│   └── generate-traffic.py         # Traffic generator (SDK ingestion)
├── templates/                      # Alert templates
│   ├── slack-alert.json
│   └── email-report.html
├── prometheus/                     # Metrics collection config
├── grafana/                        # Pre-built dashboards
├── docs/                           # OpenAPI specification
│   └── openapi.yaml
└── .github/workflows/              # CI/CD pipeline
    └── shadow-validation.yml
```

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Recharts, Vite |
| **Auth & Database** | Supabase (PostgreSQL + Auth) |
| **Backend APIs** | Spring Boot (Java 17) |
| **AI/ML** | Python FastAPI, Google Gemini API |
| **Message Broker** | Apache Kafka |
| **Caching** | Redis (stream join & correlation) |
| **Proxy** | NGINX (traffic mirroring) |
| **Monitoring** | Prometheus, Grafana |
| **Containerization** | Docker, Docker Compose |
| **CI/CD** | GitHub Actions |

---

## 📜 License

MIT — Use it, modify it, deploy it. Contributions welcome.
