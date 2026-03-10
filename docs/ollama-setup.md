# Using Ollama (Local LLM) with Shadow Deploy

Shadow Deploy supports **local LLM inference** via [Ollama](https://ollama.com), keeping all production data on your own infrastructure — no API keys, no cloud calls, no data leaving your network.

---

## Table of Contents

1. [Why Ollama?](#why-ollama)
2. [Prerequisites](#prerequisites)
3. [Quick Start (Docker Compose)](#quick-start-docker-compose)
4. [Quick Start (Standalone Ollama)](#quick-start-standalone-ollama)
5. [Choosing a Model](#choosing-a-model)
6. [Configuration Reference](#configuration-reference)
7. [Verifying It Works](#verifying-it-works)
8. [GPU Acceleration](#gpu-acceleration)
9. [Switching Between Providers](#switching-between-providers)
10. [Performance Tuning](#performance-tuning)
11. [Troubleshooting](#troubleshooting)
12. [Architecture Overview](#architecture-overview)

---

## Why Ollama?

| Concern | Gemini (Cloud) | Ollama (Local) |
|---------|----------------|----------------|
| Data privacy | Bodies sent to Google | Everything stays on-premise |
| Latency | ~1-3s (network round-trip) | ~2-10s (depends on hardware) |
| Cost | Free tier limits, then pay-per-token | Free forever (you provide hardware) |
| Internet required | Yes | No |
| Compliance (GDPR, HIPAA) | Requires DPA with Google | Fully compliant by default |
| Quality | Excellent (Gemini 2.0 Flash) | Good (varies by model) |

**Recommendation:** Use Ollama when you're comparing production responses that contain PII, customer data, internal API structures, or anything you don't want leaving your network.

---

## Prerequisites

### Hardware Requirements

| Model | RAM Required | VRAM (GPU) | Disk Space |
|-------|-------------|------------|------------|
| `llama3.1` (8B) | 8 GB | 6 GB | ~4.7 GB |
| `llama3.1:70b` | 64 GB | 48 GB | ~40 GB |
| `mistral` (7B) | 8 GB | 6 GB | ~4.1 GB |
| `phi3:mini` (3.8B) | 4 GB | 3 GB | ~2.3 GB |
| `codellama` (7B) | 8 GB | 6 GB | ~3.8 GB |
| `qwen2.5` (7B) | 8 GB | 6 GB | ~4.4 GB |

> CPU-only inference works but is 5-10x slower than GPU. For real-time comparison, a GPU with at least 6 GB VRAM is strongly recommended.

### Software

- **Docker** and **Docker Compose** v2+ (if using the bundled Ollama container)
- **OR** [Ollama](https://ollama.com/download) installed natively on your host

---

## Quick Start (Docker Compose)

This is the easiest way — Shadow Deploy includes a pre-configured Ollama container.

### Step 1: Edit your `.env` file

```bash
# Tell the AI service to use Ollama
LLM_PROVIDER=ollama

# These are the defaults — only change if you customized the setup
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.1
```

### Step 2: Start the platform with the Ollama profile

```bash
# Start everything including Ollama
docker compose --profile ollama up -d
```

This starts the normal Shadow Deploy stack **plus** the `ollama` container on `shadow-net`.

### Step 3: Pull your chosen model

The Ollama container starts empty — you need to download a model:

```bash
# Pull the default model (llama3.1 8B, ~4.7 GB download)
docker exec shadow-ollama ollama pull llama3.1
```

Wait for the download to complete. You'll see progress like:

```
pulling manifest
pulling 8eeb52dfb3bb... 100% ▕████████████████▏ 4.7 GB
pulling 948af2743fc7... 100% ▕████████████████▏ 1.5 KB
...
success
```

### Step 4: Verify

```bash
# Check that the model is available
docker exec shadow-ollama ollama list

# Check the AI service detected Ollama
curl http://localhost:8005/api/v1/status
```

Expected response:

```json
{
  "service": "ai-comparison-service",
  "llm_provider": "OllamaProvider",
  "llm_configured": true,
  "pii_masker_active": true,
  "risk_scorer_active": true
}
```

### Step 5: Restart the AI service (if it started before the model was pulled)

```bash
docker compose restart ai-service
```

---

## Quick Start (Standalone Ollama)

If you already have Ollama running on your host machine (not in Docker):

### Step 1: Install Ollama

```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download/windows
```

### Step 2: Pull a model

```bash
ollama pull llama3.1
```

### Step 3: Start the Ollama server (if not already running)

```bash
ollama serve
# Listens on http://localhost:11434 by default
```

### Step 4: Configure Shadow Deploy

In your `.env` file:

```bash
LLM_PROVIDER=ollama

# Point to your host machine's Ollama instance
# If running ai-service in Docker but Ollama on the host:
OLLAMA_BASE_URL=http://host.docker.internal:11434

# If running everything natively (no Docker):
# OLLAMA_BASE_URL=http://localhost:11434

OLLAMA_MODEL=llama3.1
```

> **Important:** When the AI service runs inside Docker but Ollama runs on the host, use `http://host.docker.internal:11434` (works on Docker Desktop for Windows/Mac). On Linux, use `http://172.17.0.1:11434` or add `--network host` to the ai-service container.

### Step 5: Restart the AI service

```bash
docker compose restart ai-service
```

---

## Choosing a Model

### Recommended Models for API Comparison

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| **`llama3.1`** | 8B | Fast | Very Good | Default choice, great balance |
| **`mistral`** | 7B | Fast | Good | Lighter alternative to Llama |
| **`phi3:mini`** | 3.8B | Very Fast | Acceptable | Low-resource machines, quick checks |
| **`qwen2.5`** | 7B | Fast | Very Good | Strong at structured/JSON output |
| **`llama3.1:70b`** | 70B | Slow | Excellent | When quality matters most (needs 64 GB+ RAM) |
| **`codellama`** | 7B | Fast | Good | API/code-focused comparisons |
| **`deepseek-coder-v2`** | 16B | Medium | Excellent | Best for code/API analysis if you have 16 GB+ RAM |

### How to switch models

```bash
# Pull the new model
docker exec shadow-ollama ollama pull mistral

# Update .env
OLLAMA_MODEL=mistral

# Restart the AI service
docker compose restart ai-service
```

### Test a model before committing

```bash
# Interactive test
docker exec -it shadow-ollama ollama run llama3.1 "Compare these two JSON responses and rate similarity 0-1: {\"name\":\"John\"} vs {\"name\":\"Jane\"}"
```

---

## Configuration Reference

All configuration is via environment variables in your `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | *(empty — auto-detect)* | `"gemini"`, `"ollama"`, or `""` for auto-detection |
| `OLLAMA_BASE_URL` | `http://ollama:11434` (Docker) / `http://localhost:11434` (native) | Ollama API endpoint |
| `OLLAMA_MODEL` | `llama3.1` | Model name (must be pulled first) |
| `GEMINI_API_KEY` | *(empty)* | Only needed if using Gemini provider |

### Auto-detection behavior (when `LLM_PROVIDER` is empty)

1. If `GEMINI_API_KEY` is set → uses **Gemini**
2. Else if Ollama is reachable at `OLLAMA_BASE_URL` → uses **Ollama**
3. Else → uses **heuristic-only** comparison (no LLM, deterministic field-level diffing only)

---

## Verifying It Works

### 1. Check the status endpoint

```bash
curl -s http://localhost:8005/api/v1/status | python -m json.tool
```

Look for `"llm_provider": "OllamaProvider"` and `"llm_configured": true`.

### 2. Check the AI service logs

```bash
docker compose logs ai-service | grep -i "provider\|ollama"
```

You should see:

```
ai-service  | 2026-03-10 ... [INFO] ai-service - LLM provider: OllamaProvider
ai-service  | 2026-03-10 ... [INFO] ai-service.llm_provider - Ollama provider: base_url=http://ollama:11434, model=llama3.1
ai-service  | 2026-03-10 ... [INFO] ai-service.semantic_comparator - SemanticComparator using OllamaProvider
```

### 3. Run a test comparison

```bash
curl -s -X POST http://localhost:8005/api/v1/compare \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "test-ollama-001",
    "endpoint": "/api/users",
    "prod_body": "{\"id\": 1, \"name\": \"Alice\", \"email\": \"alice@example.com\"}",
    "shadow_body": "{\"id\": 1, \"name\": \"Alice\", \"email\": \"alice@test.com\", \"role\": \"admin\"}",
    "status_match": true,
    "latency_delta_ms": 50
  }' | python -m json.tool
```

Expected: a response with `similarity_score`, `explanation`, `severity`, etc. — generated by your local LLM.

### 4. Run the full traffic pipeline

```bash
python cli/generate-traffic.py --count 10
```

Then check the dashboard — comparisons should appear with AI-generated explanations.

---

## GPU Acceleration

### NVIDIA GPU (Docker Compose)

Edit `docker-compose.yml` to add GPU access to the Ollama container:

```yaml
  ollama:
    image: ollama/ollama:latest
    container_name: shadow-ollama
    profiles:
      - ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
    networks:
      - shadow-net
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
          memory: 4G
```

**Prerequisites:**
- NVIDIA driver installed on host
- [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html) installed

Verify GPU is detected:

```bash
docker exec shadow-ollama nvidia-smi
```

### AMD GPU

Use the ROCm-enabled Ollama image:

```yaml
  ollama:
    image: ollama/ollama:rocm
    # ... rest of config same as above
    devices:
      - /dev/kfd
      - /dev/dri
```

### Apple Silicon (M1/M2/M3)

GPU acceleration works automatically when Ollama is installed natively (not in Docker). Docker on macOS does not pass through the GPU, so for best performance on Apple Silicon:

1. Install Ollama natively: `brew install ollama`
2. Run `ollama serve`
3. Set `OLLAMA_BASE_URL=http://host.docker.internal:11434` in `.env`

---

## Switching Between Providers

You can switch providers at any time by changing `.env` and restarting:

### Switch from Gemini to Ollama

```bash
# .env
LLM_PROVIDER=ollama
# GEMINI_API_KEY=...  ← can keep or remove, won't be used

docker compose restart ai-service
```

### Switch from Ollama to Gemini

```bash
# .env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-key-here

docker compose restart ai-service
```

### Switch to heuristic-only (no LLM)

```bash
# .env
LLM_PROVIDER=
# Remove or comment out GEMINI_API_KEY
# Stop Ollama if running

docker compose --profile ollama stop ollama
docker compose restart ai-service
```

The heuristic comparator still performs field-level diffing, status code comparison, latency analysis, and structural change detection — just without natural language explanations.

---

## Performance Tuning

### Reduce response time

1. **Use a smaller model**: `phi3:mini` (3.8B) responds in ~1-2s on GPU vs ~5-10s for `llama3.1` (8B)
2. **Keep the model loaded**: Ollama unloads models after 5 minutes of inactivity. Set `OLLAMA_KEEP_ALIVE` to keep it warm:
   ```bash
   docker exec shadow-ollama sh -c 'echo "OLLAMA_KEEP_ALIVE=24h" >> /etc/environment'
   ```
3. **Pre-warm the model** after container start:
   ```bash
   docker exec shadow-ollama ollama run llama3.1 "hello" --verbose
   ```

### Reduce memory usage

1. Use quantized models (Ollama downloads quantized by default — Q4_0):
   ```bash
   ollama pull llama3.1  # Already Q4 quantized (~4.7 GB)
   ```
2. Use a smaller model: `phi3:mini` needs only ~4 GB RAM
3. Set memory limits in `docker-compose.yml`:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 8G
   ```

### Handle high throughput

For high-traffic scenarios (many comparisons per second):

1. The AI service already runs LLM calls in a thread pool (`asyncio.to_thread`), so concurrent requests are handled without blocking
2. Ollama queues requests internally — it processes one inference at a time per model
3. For parallel inference, run multiple Ollama instances or use `OLLAMA_NUM_PARALLEL=4` (requires enough VRAM for 4 concurrent contexts)

---

## Troubleshooting

### "Ollama not reachable" in logs

```
WARNING ai-service.llm_provider - Ollama not reachable at http://ollama:11434: ...
WARNING ai-service - No LLM provider available — falling back to heuristic comparison
```

**Causes and fixes:**

| Cause | Fix |
|-------|-----|
| Ollama container not running | `docker compose --profile ollama up -d ollama` |
| Model not pulled yet | `docker exec shadow-ollama ollama pull llama3.1` |
| Wrong `OLLAMA_BASE_URL` | Check `.env` — use `http://ollama:11434` for Docker, `http://host.docker.internal:11434` for host Ollama |
| ai-service started before Ollama was ready | `docker compose restart ai-service` |
| Ollama on a different Docker network | Ensure both are on `shadow-net` |

### "LLM comparison failed" / JSON parse errors

```
ERROR ai-service.semantic_comparator - Failed to parse LLM response as JSON: ...
```

Some models are less reliable at structured JSON output. Fixes:

1. **Use a better model**: `llama3.1` and `qwen2.5` are most reliable at JSON output
2. The system automatically falls back to heuristic comparison when JSON parsing fails — this is safe
3. Check the full error in logs: `docker compose logs ai-service --tail 50`

### Ollama is slow (>30s per comparison)

1. **No GPU detected**: Check `docker exec shadow-ollama ollama ps` — if it shows `CPU`, see the [GPU Acceleration](#gpu-acceleration) section
2. **Model too large for RAM**: If the model exceeds available RAM, it swaps to disk. Use a smaller model
3. **First request is always slow**: Ollama loads the model into memory on first inference (~10-30s). Subsequent requests are faster

### Out of memory

```
Error: model requires more system memory (8.0 GiB) than is available (4.0 GiB)
```

Switch to a smaller model:

```bash
docker exec shadow-ollama ollama pull phi3:mini
# Update .env: OLLAMA_MODEL=phi3:mini
docker compose restart ai-service
```

### Check what's running in Ollama

```bash
# List downloaded models
docker exec shadow-ollama ollama list

# See currently loaded model (and resource usage)
docker exec shadow-ollama ollama ps

# Test a model directly
docker exec -it shadow-ollama ollama run llama3.1 "Say hello in JSON format"
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Shadow Deploy Platform                       │
│                                                                  │
│  ┌──────────────┐    ┌───────────────────────────────────────┐  │
│  │  Comparison   │    │           AI Service (FastAPI)         │  │
│  │  Engine       │───▶│                                       │  │
│  │  (Java)       │    │  ┌─────────────┐  ┌───────────────┐  │  │
│  └──────────────┘    │  │ PII Masker  │  │ Risk Scorer   │  │  │
│                       │  └──────┬──────┘  └───────────────┘  │  │
│                       │         │                             │  │
│                       │         ▼                             │  │
│                       │  ┌─────────────────────────┐         │  │
│                       │  │  SemanticComparator      │         │  │
│                       │  │                          │         │  │
│                       │  │  ┌───────────────────┐   │         │  │
│                       │  │  │   LLM Provider    │   │         │  │
│                       │  │  │   (pluggable)     │   │         │  │
│                       │  │  └────────┬──────────┘   │         │  │
│                       │  └───────────┼──────────────┘         │  │
│                       └──────────────┼────────────────────────┘  │
│                                      │                           │
│                    ┌─────────────────┼─────────────────┐         │
│                    │                 │                  │         │
│                    ▼                 ▼                  ▼         │
│  ┌──────────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │  GeminiProvider   │  │ OllamaProvider  │  │  Heuristic    │  │
│  │  (Cloud API)      │  │ (Local HTTP)    │  │  (No LLM)     │  │
│  │                   │  │                 │  │               │  │
│  │  google.genai SDK │  │  /api/generate  │  │  Field-level  │  │
│  │  ──────────────── │  │  ───────────    │  │  diffing only │  │
│  │  Gemini 2.0 Flash │  │  llama3.1 etc.  │  │               │  │
│  └────────┬──────────┘  └────────┬────────┘  └───────────────┘  │
│           │                      │                               │
└───────────┼──────────────────────┼───────────────────────────────┘
            │                      │
            ▼                      ▼
   ┌─────────────────┐   ┌─────────────────┐
   │  Google Cloud    │   │  Ollama Server  │
   │  (external)      │   │  (on-premise)   │
   │                  │   │                 │
   │  Data leaves     │   │  Data stays     │
   │  your network    │   │  local          │
   └─────────────────┘   └─────────────────┘
```

### How the provider is selected

```
startup
  │
  ├── LLM_PROVIDER="gemini"  ──▶  GeminiProvider (needs GEMINI_API_KEY)
  │
  ├── LLM_PROVIDER="ollama"  ──▶  OllamaProvider (needs running Ollama)
  │
  └── LLM_PROVIDER=""  (auto-detect)
        │
        ├── GEMINI_API_KEY set?  ──▶  GeminiProvider
        │
        ├── Ollama reachable?    ──▶  OllamaProvider
        │
        └── Neither              ──▶  Heuristic-only (no LLM)
```

### Data flow with Ollama

1. **Comparison Engine** sends `prod_body` + `shadow_body` to the AI service via HTTP
2. **PII Masker** strips emails, SSNs, phone numbers, etc. from both bodies
3. **SemanticComparator** builds a comparison prompt and calls `OllamaProvider.generate_json()`
4. **OllamaProvider** sends a `POST /api/generate` request to the local Ollama server
5. Ollama runs inference **entirely on your hardware** and returns a JSON result
6. The response never leaves `shadow-net` (the Docker bridge network)

---

## Further Reading

- [Ollama Documentation](https://github.com/ollama/ollama/blob/main/README.md)
- [Ollama Model Library](https://ollama.com/library)
- [Ollama API Reference](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html)
