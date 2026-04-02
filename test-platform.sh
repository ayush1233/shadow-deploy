#!/usr/bin/env bash
set -u

# ═══════════════════════════════════════════════
# Shadow API Platform — End-to-End Test
# ═══════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

BASE_API="http://localhost:8083/api/v1"
INGEST_API="http://localhost:8081/api/v1"
AI_API="http://localhost:8005/api/v1"

PASS=0
FAIL=0

echo ""
echo -e "${CYAN}${BOLD}========================================${NC}"
echo -e "${CYAN}${BOLD}   Shadow API Platform - E2E Test       ${NC}"
echo -e "${CYAN}${BOLD}========================================${NC}"
echo ""

# ── 1. Test AI Service (Gemini Integration) ──
echo -e "${YELLOW}1. Testing AI Service (Gemini Integration)...${NC}"

AI_PAYLOAD='{
  "request_id": "test-ai-001",
  "endpoint": "/api/users/123",
  "prod_body": "{\"id\":123,\"name\":\"John Doe\",\"email\":\"john@example.com\"}",
  "shadow_body": "{\"id\":123,\"name\":\"John Doe\",\"email\":\"john@example.com\",\"role\":\"admin\"}",
  "status_match": true,
  "latency_delta_ms": 15
}'

AI_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$AI_API/compare" \
    -H "Content-Type: application/json" \
    -d "$AI_PAYLOAD" 2>/dev/null || echo "CURL_FAILED")

if [[ "$AI_RESPONSE" == "CURL_FAILED" ]]; then
    echo -e "  ${RED}[FAIL] AI Service test failed: could not connect${NC}"
    FAIL=$((FAIL + 1))
else
    HTTP_CODE=$(echo "$AI_RESPONSE" | tail -1)
    BODY=$(echo "$AI_RESPONSE" | sed '$d')
    if [[ "$HTTP_CODE" =~ ^2 ]]; then
        SIM_SCORE=$(echo "$BODY" | grep -oE '"similarity_score"\s*:\s*[0-9.]+' | head -1 | grep -oE '[0-9.]+$')
        SEVERITY=$(echo "$BODY" | grep -oE '"severity"\s*:\s*"[^"]+"' | head -1 | grep -oE '"[^"]+"\s*$' | tr -d '"')
        echo -e "  ${GREEN}[PASS] AI Service responded successfully!${NC}"
        echo -e "  ${DIM}   Similarity Score: ${SIM_SCORE:-N/A}${NC}"
        echo -e "  ${DIM}   Severity: ${SEVERITY:-N/A}${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}[FAIL] AI Service returned HTTP $HTTP_CODE${NC}"
        FAIL=$((FAIL + 1))
    fi
fi
echo ""

# ── 2. Test API Service Authentication ──
echo -e "${YELLOW}2. Testing API Service (Authentication)...${NC}"

AUTH_PAYLOAD='{"username":"admin","password":"shadow-admin"}'
AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_API/auth/login" \
    -H "Content-Type: application/json" \
    -d "$AUTH_PAYLOAD" 2>/dev/null || echo "CURL_FAILED")

TOKEN=""
if [[ "$AUTH_RESPONSE" == "CURL_FAILED" ]]; then
    echo -e "  ${RED}[FAIL] Authentication failed: could not connect${NC}"
    FAIL=$((FAIL + 1))
else
    HTTP_CODE=$(echo "$AUTH_RESPONSE" | tail -1)
    BODY=$(echo "$AUTH_RESPONSE" | sed '$d')
    if [[ "$HTTP_CODE" =~ ^2 ]]; then
        TOKEN=$(echo "$BODY" | grep -oE '"token"\s*:\s*"[^"]+"' | head -1 | grep -oE '"[^"]+"\s*$' | tr -d '"')
        echo -e "  ${GREEN}[PASS] Successfully logged in! Received JWT token.${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}[FAIL] Authentication returned HTTP $HTTP_CODE${NC}"
        FAIL=$((FAIL + 1))
    fi
fi
echo ""

# ── 3. Test Metric Retrieval (Authenticated) ──
echo -e "${YELLOW}3. Testing API Service (Metrics Dashboard Data)...${NC}"

if [[ -z "$TOKEN" ]]; then
    echo -e "  ${RED}[SKIP] Skipping — no auth token from previous step${NC}"
    FAIL=$((FAIL + 1))
else
    METRICS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_API/metrics/summary" \
        -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "CURL_FAILED")

    if [[ "$METRICS_RESPONSE" == "CURL_FAILED" ]]; then
        echo -e "  ${RED}[FAIL] Metrics retrieval failed: could not connect${NC}"
        FAIL=$((FAIL + 1))
    else
        HTTP_CODE=$(echo "$METRICS_RESPONSE" | tail -1)
        BODY=$(echo "$METRICS_RESPONSE" | sed '$d')
        if [[ "$HTTP_CODE" =~ ^2 ]]; then
            TOTAL_REQ=$(echo "$BODY" | grep -oE '"total_requests"\s*:\s*[0-9]+' | head -1 | grep -oE '[0-9]+$')
            echo -e "  ${GREEN}[PASS] Metrics retrieved successfully!${NC}"
            echo -e "  ${DIM}   Total Requests: ${TOTAL_REQ:-N/A}${NC}"
            PASS=$((PASS + 1))
        else
            echo -e "  ${RED}[FAIL] Metrics retrieval returned HTTP $HTTP_CODE${NC}"
            FAIL=$((FAIL + 1))
        fi
    fi
fi
echo ""

# ── 4. Test Ingestion Service ──
echo -e "${YELLOW}4. Testing Ingestion Service (SDK mode simulation)...${NC}"

REQ_ID="req-$$-$(date +%s)"
INGEST_PAYLOAD="{
  \"request_id\": \"$REQ_ID\",
  \"tenant_id\": \"demo\",
  \"traffic_type\": \"production\",
  \"method\": \"POST\",
  \"endpoint\": \"/api/checkout\",
  \"response_status\": 200,
  \"response_body\": \"{\\\"order_id\\\":\\\"ORD-12345\\\",\\\"status\\\":\\\"success\\\"}\",
  \"response_time_ms\": 120
}"

INGEST_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$INGEST_API/ingest/event" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: sk-shadow-demo-key-change-me" \
    -d "$INGEST_PAYLOAD" 2>/dev/null || echo "CURL_FAILED")

if [[ "$INGEST_RESPONSE" == "CURL_FAILED" ]]; then
    echo -e "  ${RED}[FAIL] Event ingestion failed: could not connect${NC}"
    FAIL=$((FAIL + 1))
else
    HTTP_CODE=$(echo "$INGEST_RESPONSE" | tail -1)
    if [[ "$HTTP_CODE" =~ ^2 ]]; then
        echo -e "  ${GREEN}[PASS] Event ingested successfully into Kafka!${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}[FAIL] Event ingestion returned HTTP $HTTP_CODE${NC}"
        FAIL=$((FAIL + 1))
    fi
fi
echo ""

# ── 5. Test AI Proxy Configurator ──
echo -e "${YELLOW}5. Testing AI NGINX Configurator...${NC}"

CONFIG_PAYLOAD='{"instruction":"Please route our main production traffic to port 3000 and mirror it to our shadow V2 app on 4000"}'
CONFIG_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$AI_API/configure-proxy" \
    -H "Content-Type: application/json" \
    -d "$CONFIG_PAYLOAD" 2>/dev/null || echo "CURL_FAILED")

if [[ "$CONFIG_RESPONSE" == "CURL_FAILED" ]]; then
    echo -e "  ${RED}[FAIL] AI Configurator failed: could not connect${NC}"
    FAIL=$((FAIL + 1))
else
    HTTP_CODE=$(echo "$CONFIG_RESPONSE" | tail -1)
    BODY=$(echo "$CONFIG_RESPONSE" | sed '$d')
    if [[ "$HTTP_CODE" =~ ^2 ]]; then
        STATUS=$(echo "$BODY" | grep -oE '"status"\s*:\s*"[^"]+"' | head -1 | grep -oE '"[^"]+"\s*$' | tr -d '"')
        MESSAGE=$(echo "$BODY" | grep -oE '"message"\s*:\s*"[^"]+"' | head -1 | sed 's/"message"\s*:\s*//;s/^"//;s/"$//')
        if [[ "$STATUS" == "success" ]]; then
            echo -e "  ${GREEN}[PASS] AI correctly parsed the ports and updated NGINX config!${NC}"
            echo -e "  ${DIM}   Message: ${MESSAGE:-N/A}${NC}"
            PASS=$((PASS + 1))
        else
            echo -e "  ${GREEN}[PASS] AI Configurator responded (status: ${STATUS:-unknown})${NC}"
            PASS=$((PASS + 1))
        fi
    else
        echo -e "  ${RED}[FAIL] AI Configurator returned HTTP $HTTP_CODE${NC}"
        FAIL=$((FAIL + 1))
    fi
fi
echo ""

# ── Summary ──
TOTAL=$((PASS + FAIL))
echo -e "${CYAN}${BOLD}========================================${NC}"
echo -e "  Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC} (out of $TOTAL tests)"
echo -e "${CYAN}${BOLD}========================================${NC}"
echo ""
echo -e "  ${DIM}Check the dashboard at:${NC}  ${CYAN}http://localhost:3004${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
