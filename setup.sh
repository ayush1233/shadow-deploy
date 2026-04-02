#!/usr/bin/env bash
set -eu

# ═══════════════════════════════════════════════════════════
# Shadow API Validation Platform — Setup Wizard  (Bash)
# ═══════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

banner() {
    echo ""
    echo -e "${PURPLE}${BOLD}"
    echo "  ╔══════════════════════════════════════════════════════╗"
    echo "  ║   Shadow API Validation Platform — Setup Wizard     ║"
    echo "  ╚══════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "  ${DIM}One-command setup for the entire platform${NC}"
    echo ""
}

check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "  ${GREEN}[OK]${NC} $2"
        return 0
    fi
    local uname_s
    uname_s="$(uname -s 2>/dev/null)"
    if [[ "$uname_s" == MINGW* ]] || [[ "$uname_s" == MSYS* ]] || [[ -n "${WINDIR:-}" ]]; then
        if where.exe "$1" &> /dev/null; then
            echo -e "  ${GREEN}[OK]${NC} $2"
            return 0
        fi
    fi
    echo -e "  ${RED}[MISSING]${NC} $2"
    return 1
}

check_version() {
    local cmd="$1"
    local name="$2"
    local min_major="$3"
    local version_flag="${4:---version}"

    local cmd_path
    if command -v "$cmd" &> /dev/null; then
        cmd_path="$cmd"
    else
        local uname_s
        uname_s="$(uname -s 2>/dev/null)"
        if [[ "$uname_s" == MINGW* ]] || [[ "$uname_s" == MSYS* ]] || [[ -n "${WINDIR:-}" ]]; then
            cmd_path=$(where.exe "$cmd" 2>/dev/null | head -1 || true)
        else
            cmd_path=""
        fi
    fi

    if [[ -z "$cmd_path" ]]; then
        echo -e "  ${RED}[MISSING]${NC} $name"
        return 1
    fi

    local version
    version=$("$cmd_path" $version_flag 2>&1 | head -1 | grep -oE '[0-9]+\.[0-9]+' | head -1)
    local major
    major=$(echo "$version" | cut -d. -f1)

    if [ "$major" -ge "$min_major" ] 2>/dev/null; then
        echo -e "  ${GREEN}[OK]${NC} $name (v$version)"
        return 0
    else
        echo -e "  ${YELLOW}[OUTDATED]${NC} $name (v$version, need v$min_major+)"
        return 1
    fi
}

detect_os() {
    local uname_s
    uname_s="$(uname -s 2>/dev/null)"
    if [[ "$uname_s" == "Linux" ]]; then
        echo "linux"
    elif [[ "$uname_s" == "Darwin" ]]; then
        echo "mac"
    elif [[ "$uname_s" == MINGW* ]] || [[ "$uname_s" == MSYS* ]] || [[ -n "${WINDIR:-}" ]]; then
        echo "windows"
    else
        echo "linux"
    fi
}

generate_secret() {
    # Generate a random 32-char alphanumeric secret
    if command -v openssl &> /dev/null; then
        openssl rand -hex 16
    elif [[ -f /dev/urandom ]]; then
        cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 32
    else
        echo "change-me-$(date +%s)"
    fi
}

banner

OS_TYPE=$(detect_os)

# ═══════════════════════════════════════════════════════
# Step 1: Check Prerequisites
# ═══════════════════════════════════════════════════════
echo -e "${CYAN}${BOLD}  Step 1: Checking Prerequisites${NC}"
echo -e "  ${DIM}─────────────────────────────────${NC}"

CRITICAL_MISSING=0

check_version "docker" "Docker" 20 || CRITICAL_MISSING=1

check_command "docker-compose" "Docker Compose" || {
    if docker compose version &> /dev/null; then
        echo -e "  ${GREEN}[OK]${NC} Docker Compose (v2 plugin)"
    else
        CRITICAL_MISSING=1
    fi
}

check_version "node" "Node.js" 18 || CRITICAL_MISSING=1

# Optional
check_version "java" "Java (optional)" 17 "-version" || echo -e "  ${DIM}       Needed for local Java development only${NC}"

# Try python3 first, then python
if command -v python3 &> /dev/null; then
    check_version "python3" "Python (optional)" 3 || echo -e "  ${DIM}       Needed for CLI tools${NC}"
elif command -v python &> /dev/null; then
    check_version "python" "Python (optional)" 3 || echo -e "  ${DIM}       Needed for CLI tools${NC}"
else
    echo -e "  ${YELLOW}[MISSING]${NC} Python (optional)"
    echo -e "  ${DIM}       Needed for CLI tools${NC}"
fi

echo ""

if [ "$CRITICAL_MISSING" -eq 1 ]; then
    echo -e "  ${RED}${BOLD}Critical prerequisites missing!${NC}"
    echo -e "  ${DIM}Install Docker: https://docs.docker.com/get-docker/${NC}"
    echo -e "  ${DIM}Install Node.js: https://nodejs.org/${NC}"
    echo ""
    read -p "  Continue anyway? [y/N]: " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        echo -e "  ${DIM}Setup cancelled.${NC}"
        exit 1
    fi
fi

# Linux-specific warning about host.docker.internal
if [[ "$OS_TYPE" == "linux" ]]; then
    echo ""
    echo -e "  ${YELLOW}${BOLD}Linux Detected${NC}"
    echo -e "  ${DIM}  Note: 'host.docker.internal' may not resolve automatically on Linux Docker.${NC}"
    echo -e "  ${DIM}  If your v1/v2 apps run on the host, use your machine's private IP instead.${NC}"
    echo -e "  ${DIM}  Find it with: hostname -I | awk '{print \$1}'${NC}"
    PRIVATE_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "")
    if [[ -n "$PRIVATE_IP" ]]; then
        echo -e "  ${CYAN}  Detected private IP: ${BOLD}$PRIVATE_IP${NC}"
    fi
    echo ""
fi

# ═══════════════════════════════════════════════════════
# Step 2: Choose Deployment Mode
# ═══════════════════════════════════════════════════════
echo -e "${CYAN}${BOLD}  Step 2: Choose Deployment Mode${NC}"
echo -e "  ${DIM}─────────────────────────────────${NC}"
echo ""
echo -e "  ${BOLD}1)${NC} Local Development  ${DIM}— run everything on your machine${NC}"
echo -e "  ${BOLD}2)${NC} Production / EC2   ${DIM}— connect to external v1/v2 backends${NC}"
echo ""
read -p "  Select mode [1]: " DEPLOY_MODE
DEPLOY_MODE=${DEPLOY_MODE:-1}

echo ""

# ═══════════════════════════════════════════════════════
# Step 3: Interactive Configuration
# ═══════════════════════════════════════════════════════
echo -e "${CYAN}${BOLD}  Step 3: Platform Configuration${NC}"
echo -e "  ${DIM}─────────────────────────────────${NC}"

# --- Database ---
echo ""
echo -e "  ${BOLD}Database${NC}"

POSTGRES_PASSWORD_DEFAULT=$(generate_secret)
read -p "  PostgreSQL password [$POSTGRES_PASSWORD_DEFAULT]: " POSTGRES_PASSWORD
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-$POSTGRES_PASSWORD_DEFAULT}

REDIS_PASSWORD_DEFAULT=$(generate_secret)
read -p "  Redis password [$REDIS_PASSWORD_DEFAULT]: " REDIS_PASSWORD
REDIS_PASSWORD=${REDIS_PASSWORD:-$REDIS_PASSWORD_DEFAULT}

# --- API Keys ---
echo ""
echo -e "  ${BOLD}API Keys${NC}"

read -s -p "  Gemini API Key (optional, Enter to skip): " GEMINI_API_KEY
echo ""
GEMINI_API_KEY=${GEMINI_API_KEY:-}

JWT_SECRET_DEFAULT=$(generate_secret)
read -p "  JWT Secret [$JWT_SECRET_DEFAULT]: " JWT_SECRET
JWT_SECRET=${JWT_SECRET:-$JWT_SECRET_DEFAULT}

INTERNAL_SECRET_DEFAULT=$(generate_secret)
read -p "  Internal Shared Secret [$INTERNAL_SECRET_DEFAULT]: " INTERNAL_SHARED_SECRET
INTERNAL_SHARED_SECRET=${INTERNAL_SHARED_SECRET:-$INTERNAL_SECRET_DEFAULT}

# --- Target Backends ---
echo ""
echo -e "  ${BOLD}Target Application (V1 / V2 backends)${NC}"

if [[ "$DEPLOY_MODE" == "2" ]]; then
    echo -e "  ${DIM}  Production mode: enter the host/port of your running v1 and v2 apps.${NC}"
    if [[ "$OS_TYPE" == "linux" && -n "${PRIVATE_IP:-}" ]]; then
        DEFAULT_HOST="$PRIVATE_IP"
        echo -e "  ${DIM}  Using detected private IP as default: $PRIVATE_IP${NC}"
    else
        DEFAULT_HOST="host.docker.internal"
    fi
else
    echo -e "  ${DIM}  Local mode: use 'host.docker.internal' to reach apps on your host machine.${NC}"
    DEFAULT_HOST="host.docker.internal"
fi
echo ""

read -p "  V1 (production) backend host [$DEFAULT_HOST]: " PROD_BACKEND_HOST
PROD_BACKEND_HOST=${PROD_BACKEND_HOST:-$DEFAULT_HOST}

read -p "  V1 (production) backend port [5001]: " PROD_BACKEND_PORT
PROD_BACKEND_PORT=${PROD_BACKEND_PORT:-5001}

read -p "  V2 (shadow) backend host [$DEFAULT_HOST]: " SHADOW_BACKEND_HOST
SHADOW_BACKEND_HOST=${SHADOW_BACKEND_HOST:-$DEFAULT_HOST}

read -p "  V2 (shadow) backend port [5002]: " SHADOW_BACKEND_PORT
SHADOW_BACKEND_PORT=${SHADOW_BACKEND_PORT:-5002}

read -p "  Mirror percentage (0-100) [100]: " MIRROR_PERCENTAGE
MIRROR_PERCENTAGE=${MIRROR_PERCENTAGE:-100}

# --- CORS ---
echo ""
echo -e "  ${BOLD}Dashboard URL (for CORS)${NC}"

if [[ "$DEPLOY_MODE" == "2" ]]; then
    read -p "  Dashboard URL (e.g. http://your-ip:3004) [*]: " CORS_ALLOWED_ORIGINS
    CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:-*}
    VITE_API_URL_DEFAULT="http://${PROD_BACKEND_HOST}:8083"
    read -p "  Dashboard API URL [$VITE_API_URL_DEFAULT]: " VITE_API_URL
    VITE_API_URL=${VITE_API_URL:-$VITE_API_URL_DEFAULT}
else
    CORS_ALLOWED_ORIGINS="http://localhost:3004"
    VITE_API_URL="http://localhost:8083"
fi

# --- Supabase (optional) ---
echo ""
echo -e "  ${BOLD}Supabase (optional — press Enter to skip)${NC}"
echo -e "  ${DIM}  Only needed if using Supabase as your database backend.${NC}"

read -p "  Supabase Project URL []: " SUPABASE_URL
SUPABASE_URL=${SUPABASE_URL:-}

read -s -p "  Supabase Anon Key []: " SUPABASE_ANON_KEY
echo ""
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-}

echo ""

# ═══════════════════════════════════════════════════════
# Step 4: Generate Configuration Files
# ═══════════════════════════════════════════════════════
echo -e "${CYAN}${BOLD}  Step 4: Generating Configuration${NC}"
echo -e "  ${DIM}─────────────────────────────────${NC}"

# Generate .env
cat > "$SCRIPT_DIR/.env" << EOF
# ═══════════════════════════════════════════════════════
# Shadow Deploy Platform Configuration
# Generated by setup.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Mode: $([ "$DEPLOY_MODE" == "2" ] && echo "Production" || echo "Local Development")
# ═══════════════════════════════════════════════════════

# ── Database ──────────────────────────────────────────
POSTGRES_USER=shadow
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD

# ── Security ─────────────────────────────────────────
JWT_SECRET=$JWT_SECRET
INTERNAL_SHARED_SECRET=$INTERNAL_SHARED_SECRET

# ── AI Service ───────────────────────────────────────
GEMINI_API_KEY=$GEMINI_API_KEY
LLM_PROVIDER=gemini

# ── Target Application Backends ──────────────────────
PROD_BACKEND_HOST=$PROD_BACKEND_HOST
PROD_BACKEND_PORT=$PROD_BACKEND_PORT
SHADOW_BACKEND_HOST=$SHADOW_BACKEND_HOST
SHADOW_BACKEND_PORT=$SHADOW_BACKEND_PORT

# ── Traffic Mirroring ────────────────────────────────
MIRROR_PERCENTAGE=$MIRROR_PERCENTAGE

# ── CORS & Dashboard ────────────────────────────────
CORS_ALLOWED_ORIGINS=$CORS_ALLOWED_ORIGINS
VITE_API_URL=$VITE_API_URL

# ── Service Ports (change if conflicts) ──────────────
DASHBOARD_PORT=3004
NGINX_PROXY_PORT=8080
API_SERVICE_PORT=8083
AI_SERVICE_PORT=8005
INGESTION_PORT=8081
COMPARISON_PORT=8082
GRAFANA_PORT=3001
PROMETHEUS_PORT=9090

# ── Supabase (optional) ─────────────────────────────
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF
echo -e "  ${GREEN}[OK]${NC} Generated .env"

# Generate dashboard/.env.local
cat > "$SCRIPT_DIR/dashboard/.env.local" << EOF
VITE_API_URL=$VITE_API_URL
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF
echo -e "  ${GREEN}[OK]${NC} Generated dashboard/.env.local"

# Generate supabase.ts (only if Supabase URL provided)
if [[ -n "$SUPABASE_URL" ]]; then
    cat > "$SCRIPT_DIR/dashboard/src/services/supabase.ts" << EOF
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '${SUPABASE_URL}';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '${SUPABASE_ANON_KEY}';

if (SUPABASE_URL === 'https://your-project.supabase.co') {
    console.warn('Supabase URL not configured. Run ./setup.sh or set VITE_SUPABASE_URL in dashboard/.env.local');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
EOF
    echo -e "  ${GREEN}[OK]${NC} Generated dashboard/src/services/supabase.ts"
fi

echo ""

# ═══════════════════════════════════════════════════════
# Step 5: Database Migration
# ═══════════════════════════════════════════════════════
if [[ -n "$SUPABASE_URL" ]]; then
    read -p "  Run Supabase schema migration now? [y/N]: " RUN_MIGRATE
    if [[ "$RUN_MIGRATE" =~ ^[Yy]$ ]]; then
        echo ""
        echo -e "  ${YELLOW}${BOLD}Manual Step Required:${NC}"
        echo -e "  ${DIM}1. Go to your Supabase Dashboard -> SQL Editor -> New Query${NC}"
        echo -e "  ${DIM}2. Paste the contents of: dashboard/supabase-schema.sql${NC}"
        echo -e "  ${DIM}3. Click 'Run'${NC}"
        echo ""
        read -p "  Press Enter when done..."
    fi
fi

# ═══════════════════════════════════════════════════════
# Step 6: Start Services
# ═══════════════════════════════════════════════════════
echo ""
read -p "  Start all services now? [Y/n]: " START_SERVICES
START_SERVICES=${START_SERVICES:-Y}

if [[ "$START_SERVICES" =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "  ${CYAN}Starting all services...${NC}"
    cd "$SCRIPT_DIR"

    if [[ "$DEPLOY_MODE" == "2" ]]; then
        echo -e "  ${DIM}Using production + EC2 overrides...${NC}"
        docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ec2.yml up -d --build
    else
        docker compose up -d --build
    fi

    echo ""
    echo -e "  ${CYAN}Waiting for services to become healthy...${NC}"
    # Try python3 first, fall back to python
    if command -v python3 &> /dev/null; then
        python3 cli/healthcheck.py --wait --timeout 120 || true
    elif command -v python &> /dev/null; then
        python cli/healthcheck.py --wait --timeout 120 || true
    else
        echo -e "  ${DIM}Python not found — skipping health check. Check manually with 'docker compose ps'${NC}"
    fi
fi

# ═══════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}${BOLD}  ╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}  ║         Setup Complete!              ║${NC}"
echo -e "${GREEN}${BOLD}  ╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Service URLs:${NC}"
echo -e "  ${DIM}Dashboard:${NC}          ${CYAN}http://localhost:3004${NC}"
echo -e "  ${DIM}NGINX Proxy:${NC}        ${CYAN}http://localhost:8080${NC}"
echo -e "  ${DIM}API Service:${NC}        ${CYAN}http://localhost:8083${NC}"
echo -e "  ${DIM}AI Service:${NC}         ${CYAN}http://localhost:8005${NC}"
echo -e "  ${DIM}Ingestion Service:${NC}  ${CYAN}http://localhost:8081${NC}"
echo -e "  ${DIM}Grafana:${NC}            ${CYAN}http://localhost:3001${NC}  ${DIM}(admin/shadow-admin)${NC}"
echo -e "  ${DIM}Prometheus:${NC}         ${CYAN}http://localhost:9090${NC}"
echo ""
echo -e "  ${BOLD}Default Credentials:${NC}"
echo -e "  ${DIM}Dashboard Login:${NC}    admin / shadow-admin"
echo -e "  ${DIM}API Key:${NC}            sk-shadow-default-key-change-me"
echo ""
echo -e "  ${BOLD}Quick Commands:${NC}"
echo -e "  ${DIM}make health${NC}     — Check all service health"
echo -e "  ${DIM}make logs${NC}       — Tail all service logs"
echo -e "  ${DIM}make test${NC}       — Run end-to-end platform test"
echo -e "  ${DIM}make shadow${NC}     — Start shadow testing"
echo -e "  ${DIM}make dev${NC}        — Start dashboard in dev mode"
echo -e "  ${DIM}make stop${NC}       — Stop all services"
echo ""
if [[ "$DEPLOY_MODE" == "2" ]]; then
    echo -e "  ${YELLOW}${BOLD}Production Notes:${NC}"
    echo -e "  ${DIM}  • Make sure your v1 app is running on ${PROD_BACKEND_HOST}:${PROD_BACKEND_PORT}${NC}"
    echo -e "  ${DIM}  • Make sure your v2 app is running on ${SHADOW_BACKEND_HOST}:${SHADOW_BACKEND_PORT}${NC}"
    echo -e "  ${DIM}  • Send traffic through http://your-server:80 (NGINX) to start comparisons${NC}"
    echo ""
fi
