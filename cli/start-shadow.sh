#!/usr/bin/env bash
set -u

# ═══════════════════════════════════════════════
# Shadow Deployment Auto-Run CLI
# ═══════════════════════════════════════════════
#
# Usage:
#   ./cli/start-shadow.sh [OPTIONS]
#
# Options:
#   -p, --prod-port PORT       Production app port (default: 3000)
#   -s, --shadow-port PORT     Shadow app port (default: 4000)
#   -d, --shadow-dir DIR       Path to v2 app directory (auto-starts it)
#
# Examples:
#   ./cli/start-shadow.sh -p 5001 -s 5002
#   ./cli/start-shadow.sh --shadow-dir ~/projects/my-app-v2 --shadow-port 4000

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# Defaults
PROD_PORT=3000
SHADOW_PORT=4000
SHADOW_APP_DIR=""
APP_PID=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        -p|--prod-port)     PROD_PORT="$2"; shift 2 ;;
        -s|--shadow-port)   SHADOW_PORT="$2"; shift 2 ;;
        -d|--shadow-dir)    SHADOW_APP_DIR="$2"; shift 2 ;;
        -h|--help)
            echo "Usage: $0 [-p prod_port] [-s shadow_port] [-d shadow_app_dir]"
            echo ""
            echo "Options:"
            echo "  -p, --prod-port PORT       Production app port (default: 3000)"
            echo "  -s, --shadow-port PORT     Shadow app port (default: 4000)"
            echo "  -d, --shadow-dir DIR       Path to v2 app to auto-start"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
    esac
done

cleanup() {
    if [[ -n "$APP_PID" ]]; then
        echo -e "\n${YELLOW}Stopping shadow app (PID $APP_PID)...${NC}"
        kill "$APP_PID" 2>/dev/null || true
        wait "$APP_PID" 2>/dev/null || true
        echo -e "${GREEN}Shadow app stopped.${NC}"
    fi
}
trap cleanup EXIT INT TERM

echo ""
echo -e "${CYAN}${BOLD}========================================${NC}"
echo -e "${CYAN}${BOLD}   Shadow Deployment Auto-Run CLI       ${NC}"
echo -e "${CYAN}${BOLD}========================================${NC}"

# ── Step 1: Start the v2 shadow app (if directory provided) ──
if [[ -n "$SHADOW_APP_DIR" ]]; then
    echo ""
    echo -e "${YELLOW}[1] Starting new v2 Shadow App on port $SHADOW_PORT...${NC}"

    if [[ ! -d "$SHADOW_APP_DIR" ]]; then
        echo -e "  ${RED}Error: Directory '$SHADOW_APP_DIR' does not exist.${NC}"
        exit 1
    fi

    if [[ -f "$SHADOW_APP_DIR/package.json" ]]; then
        echo -e "  ${DIM}Detected Node.js app. Running npm install && npm start...${NC}"
        (cd "$SHADOW_APP_DIR" && npm install --silent && PORT=$SHADOW_PORT npm start) &
        APP_PID=$!
        echo -e "  ${GREEN}[OK] Node.js app starting in background (PID $APP_PID)${NC}"

    elif [[ -f "$SHADOW_APP_DIR/requirements.txt" ]]; then
        echo -e "  ${DIM}Detected Python app. Running uvicorn...${NC}"
        (cd "$SHADOW_APP_DIR" && pip install -r requirements.txt -q && uvicorn main:app --port "$SHADOW_PORT") &
        APP_PID=$!
        echo -e "  ${GREEN}[OK] Python app starting in background (PID $APP_PID)${NC}"

    elif [[ -f "$SHADOW_APP_DIR/pom.xml" ]]; then
        echo -e "  ${DIM}Detected Java/Maven app. Running mvn spring-boot:run...${NC}"
        (cd "$SHADOW_APP_DIR" && mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=$SHADOW_PORT") &
        APP_PID=$!
        echo -e "  ${GREEN}[OK] Java app starting in background (PID $APP_PID)${NC}"

    elif [[ -f "$SHADOW_APP_DIR/go.mod" ]]; then
        echo -e "  ${DIM}Detected Go app. Running go run...${NC}"
        (cd "$SHADOW_APP_DIR" && PORT=$SHADOW_PORT go run .) &
        APP_PID=$!
        echo -e "  ${GREEN}[OK] Go app starting in background (PID $APP_PID)${NC}"

    else
        echo -e "  ${YELLOW}Could not auto-detect language.${NC}"
        echo -e "  ${DIM}Please start your app manually on port $SHADOW_PORT.${NC}"
    fi

    # Give the app a moment to start
    echo -e "  ${DIM}Waiting 5s for app to initialize...${NC}"
    sleep 5
else
    echo ""
    echo -e "${DIM}[1] No app directory provided.${NC}"
    echo -e "${DIM}    Assuming v2 Shadow App is already running on port $SHADOW_PORT.${NC}"
fi

# ── Step 2: Reconfigure NGINX proxy via AI Configurator ──
echo ""
echo -e "${YELLOW}[2] Reconfiguring NGINX Proxy via AI Configurator...${NC}"

PROMPT="Route production traffic to port $PROD_PORT and shadow traffic to port $SHADOW_PORT"
echo -e "  ${DIM}Sending prompt to AI: '$PROMPT'${NC}"

CONFIG_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:8083/api/v1/configure-proxy" \
    -H "Content-Type: application/json" \
    -d "{\"prompt\":\"$PROMPT\"}" 2>/dev/null || echo "CURL_FAILED")

if [[ "$CONFIG_RESPONSE" == "CURL_FAILED" ]]; then
    echo -e "  ${RED}Failed to update NGINX Proxy via AI. Is the platform running?${NC}"
    echo -e "  ${DIM}Make sure 'docker-compose up -d' has been run first.${NC}"
    exit 1
else
    HTTP_CODE=$(echo "$CONFIG_RESPONSE" | tail -1)
    BODY=$(echo "$CONFIG_RESPONSE" | sed '$d')
    if [[ "$HTTP_CODE" =~ ^2 ]]; then
        MESSAGE=$(echo "$BODY" | grep -oE '"message"\s*:\s*"[^"]+"' | head -1 | sed 's/"message"\s*:\s*//;s/^"//;s/"$//')
        echo -e "  ${GREEN}[OK] AI Response: ${MESSAGE:-Configuration applied}${NC}"
    else
        echo -e "  ${RED}Failed to configure proxy (HTTP $HTTP_CODE)${NC}"
        exit 1
    fi
fi

# ── Summary ──
echo ""
echo -e "${CYAN}${BOLD}========================================${NC}"
echo -e "${GREEN}${BOLD}  Shadow Testing is LIVE!${NC}"
echo -e "${CYAN}${BOLD}========================================${NC}"
echo ""
echo -e "  Primary App running on port: ${BOLD}$PROD_PORT${NC}"
echo -e "  Shadow  App running on port: ${BOLD}$SHADOW_PORT${NC}"
echo ""
echo -e "  Send traffic to:  ${CYAN}http://localhost:8080/${NC}"
echo -e "  View results at:  ${CYAN}http://localhost:3004/${NC}"
echo ""

# If we started an app, keep running until Ctrl+C
if [[ -n "$APP_PID" ]]; then
    echo -e "${DIM}  Press Ctrl+C to stop the shadow app and exit.${NC}"
    echo ""
    wait "$APP_PID" 2>/dev/null || true
fi
