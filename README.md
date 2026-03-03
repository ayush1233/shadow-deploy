# Shadow API Validation Platform

[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=github-actions)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Java](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk)](https://openjdk.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)

> AI-powered shadow API validation platform that mirrors production traffic to a shadow version, compares responses using deterministic + Gemini AI semantic comparison, and generates deployment risk scores.

---

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client     │────▶│   NGINX Proxy    │────▶│  Production API │
│   Traffic    │     │  (Mirror Layer)  │     └─────────────────┘
└─────────────┘     │                  │
                    │  Mirror Traffic   │     ┌─────────────────┐
                    │  ──────────────▶  │────▶│   Shadow API    │
                    └────────┬─────────┘     └─────────────────┘
                             │
                    ┌────────▼─────────┐
                    │ Ingestion Service │
                    │  (Spring Boot)   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   Apache Kafka    │
                    │  prod-traffic     │
                    │  shadow-traffic   │
                    └────────┬─────────┘
                             │
                    ┌────────▼──────────┐     ┌─────────────────┐
                    │ Comparison Engine  │────▶│  AI Service     │
                    │  (Spring Boot)    │     │  (FastAPI +     │
                    │  + Redis Join     │     │   Gemini API)   │
                    └────────┬──────────┘     └─────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Kafka Results    │
                    │  + Elasticsearch  │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ API Service       │     ┌─────────────────┐
                    │ (JWT Auth)        │────▶│ React Dashboard │
                    └──────────────────┘     └─────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- (Optional) Gemini API Key for AI comparison

### 1. Clone & Configure

```bash
git clone <repo-url> shadow-deploy
cd shadow-deploy
```

### 2. Set Environment Variables

```bash
# Required for AI comparison
export GEMINI_API_KEY=your-gemini-api-key

# Optional overrides
export JWT_SECRET=your-jwt-secret-min-256-bits
```

Add `GEMINI_API_KEY` to `docker-compose.yml` → `ai-service` → `environment`:

```yaml
ai-service:
  environment:
    - GEMINI_API_KEY=${GEMINI_API_KEY}
```

### 3. Start All Services

```bash
docker-compose up -d --build
```

### 4. Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **Dashboard** | http://localhost:3000 | — |
| **API Service** | http://localhost:8083 | admin / shadow-admin |
| **AI Service** | http://localhost:8000 | — |
| **NGINX Proxy** | http://localhost:8080 | — |
| **Grafana** | http://localhost:3001 | admin / shadow-admin |
| **Prometheus** | http://localhost:9090 | — |
| **Elasticsearch** | http://localhost:9200 | — |
| **Kafka** | localhost:29092 | — |

---

## 📦 Components

### Microservices

| Service | Tech | Port | Description |
|---------|------|------|-------------|
| **Ingestion Service** | Spring Boot | 8081 | Normalizes traffic from proxy/SDK/plugin → Kafka |
| **Comparison Engine** | Spring Boot | 8082 | Joins streams, deterministic diff, calls AI |
| **API Service** | Spring Boot | 8083 | JWT auth, dashboard APIs, deployment approval |
| **AI Service** | Python FastAPI | 8000 | Gemini semantic comparison, PII masking, risk scoring |
| **Dashboard** | React + TS | 3000 | Real-time monitoring and comparison viewer |

### Kafka Topics

| Topic | Partition Key | Description |
|-------|---------------|-------------|
| `prod-traffic` | `tenant_id:request_id` | Production response events |
| `shadow-traffic` | `tenant_id:request_id` | Shadow response events |
| `comparison-results` | `tenant_id:request_id` | Enriched comparison results |
| `alerts` | `tenant_id:request_id` | High/critical severity alerts |

### Ingestion Modes

1. **Reverse Proxy** — NGINX mirrors traffic automatically
2. **API Gateway Plugin** — Kong plugin captures request/response lifecycle
3. **SDK Integration** — Java/Node.js middleware with async batched sending

---

## 🤖 AI Comparison (Gemini)

The AI service uses **Google Gemini** for semantic comparison:

1. **PII Masking** — Sensitive fields (email, SSN, tokens) are masked before AI analysis
2. **Semantic Analysis** — Gemini evaluates if differences are meaningful
3. **Risk Scoring** — Weighted formula: similarity (35%) + status (25%) + fields (20%) + structure (10%) + latency (10%)
4. **Severity Classification** — `none` | `low` | `medium` | `high` | `critical`

Without a Gemini API key, the service falls back to heuristic comparison.

---

## 🔌 SDK Usage

### Java (Spring Boot)

```java
@Bean
public ShadowApiInterceptor shadowInterceptor() {
    return ShadowApiInterceptor.builder()
        .ingestionUrl("http://shadow-proxy:8080/ingest/event")
        .apiKey("sk-shadow-your-key")
        .tenantId("your-tenant")
        .build();
}
```

### Node.js (Express)

```javascript
const { shadowMiddleware } = require('@shadow-api/node-sdk');

app.use(shadowMiddleware({
    ingestionUrl: 'http://shadow-proxy:8080/ingest/event',
    apiKey: 'sk-shadow-your-key',
    tenantId: 'your-tenant',
}));
```

---

## 🔧 CLI Tool

```bash
# Validation report
python cli/shadowctl.py report --env=staging --last=1h

# Deployment status
python cli/shadowctl.py deployment-status --build=123
```

---

## 📊 CI/CD Integration

The GitHub Actions workflow (`.github/workflows/shadow-validation.yml`) implements:

```
New version deployed as shadow
         ↓
Mirror % traffic to shadow
         ↓
Compute AI deployment risk score
         ↓
Risk < threshold? ──Yes──▶ Auto-promote
         │
         No──▶ Block deployment + notify
```

---

## 🔐 Security

- **TLS** between services (configurable)
- **PII masking** before AI comparison
- **API key authentication** for ingestion endpoints
- **JWT tokens** for dashboard access
- **Per-tenant rate limiting** via NGINX
- **Structured JSON logging** across all services

---

## 📁 Project Structure

```
shadow-deploy/
├── docker-compose.yml          # Full infra + services
├── nginx/                      # Reverse proxy with mirroring
├── prometheus/                 # Metrics collection
├── grafana/                    # Dashboards & provisioning
├── elasticsearch/              # Index templates
├── ingestion-service/          # Spring Boot — traffic ingestion
├── comparison-engine/          # Spring Boot — diff + AI
├── api-service/                # Spring Boot — dashboard APIs
├── ai-service/                 # Python FastAPI — Gemini AI
├── dashboard/                  # React + TypeScript
├── sdks/
│   ├── java-sdk/               # Spring Boot SDK
│   └── node-sdk/               # Express middleware
├── gateway-plugin/             # Kong plugin
├── cli/                        # shadowctl CLI tool
├── templates/                  # Slack & email alerts
├── docs/                       # OpenAPI spec
└── .github/workflows/          # CI/CD pipeline
```

---

## 📜 License

MIT
