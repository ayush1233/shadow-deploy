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

Instead of hoping your tests catch everything, **mirror 100% of your real production traffic** to your new API version, compare every single response, and let AI tell you if it's safe to ship.

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

- **Docker & Docker Compose** (for running the full microservice stack)
- **Node.js 18+** (for the dashboard)
- A **Supabase** account (free tier works — [supabase.com](https://supabase.com))
- (Optional) **Gemini API Key** for AI-powered comparison

### Step 1: Clone & Install

```bash
git clone <repo-url> shadow-deploy
cd shadow-deploy
```

### Step 2: Set Up Supabase Database

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → New Query
3. Copy-paste the contents of `dashboard/supabase-schema.sql` and click **Run**
4. Go to **Authentication → Providers → Email** and disable "Confirm email" (for local dev)
5. Copy your **Project URL** and **Anon Key** from **Settings → API**

### Step 3: Configure the Dashboard

Update `dashboard/src/services/supabase.ts` with your Supabase credentials:

```typescript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### Step 4: Start the Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Open **http://localhost:3000** → Create Account → Sign In → You'll see the dashboard with seed data.

### Step 5: Start the Full Backend Stack (Optional)

```bash
# Set your Gemini API key
export GEMINI_API_KEY=your-gemini-api-key

# Start all microservices
docker-compose up -d --build
```

### Service Ports

| Service | URL | Description |
|---------|-----|-------------|
| **Dashboard (dev)** | http://localhost:3000 | React dashboard (Vite dev server) |
| **Dashboard (Docker)** | http://localhost:3002 | Nginx-served production build |
| **NGINX Proxy** | http://localhost:8080 | Traffic mirror point |
| **API Service** | http://localhost:8083 | REST API (JWT auth) |
| **AI Service** | http://localhost:8000 | Gemini-powered comparison |
| **Ingestion Service** | http://localhost:8081 | Traffic capture |
| **Comparison Engine** | http://localhost:8082 | Diff engine |
| **Grafana** | http://localhost:3001 | Metrics dashboards |
| **Prometheus** | http://localhost:9090 | Metrics collection |
| **Kafka** | localhost:29092 | Message broker |

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
3. **AI Escalation** — If deterministic checks find mismatches, the pair is sent to the AI service for semantic analysis
4. **Risk Scoring** — Weighted formula produces a 0–10 score

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

Without a Gemini API key, the service falls back to heuristic comparison rules.

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
│       ├── service/DeterministicComparator.java
│       ├── service/AIComparisonClient.java
│       └── service/RiskScoreCalculator.java
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
│   └── configure-proxy.py          # AI NGINX configurator CLI
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
