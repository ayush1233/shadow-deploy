# ═══════════════════════════════════════════════════════════
# Shadow API Validation Platform — Setup Wizard  (PowerShell)
# ═══════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-Color {
    param([string]$Text, [ConsoleColor]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Show-Banner {
    Write-Host ""
    Write-Color "  +======================================================+" Magenta
    Write-Color "  |   Shadow API Validation Platform -- Setup Wizard      |" Magenta
    Write-Color "  +======================================================+" Magenta
    Write-Host ""
    Write-Color "  One-command setup for the entire platform" DarkGray
    Write-Host ""
}

function Test-Command {
    param([string]$Command, [string]$Name)
    if (Get-Command $Command -ErrorAction SilentlyContinue) {
        Write-Host "  [OK] $Name" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "  [MISSING] $Name" -ForegroundColor Red
        return $false
    }
}

function Test-CommandVersion {
    param(
        [string]$Command,
        [string]$Name,
        [int]$MinMajor,
        [string]$VersionFlag = "--version"
    )
    if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
        Write-Host "  [MISSING] $Name" -ForegroundColor Red
        return $false
    }
    try {
        $versionOutput = & $Command $VersionFlag 2>&1 | Select-Object -First 1
        $versionStr = [string]$versionOutput
        $pattern = '(\d+\.\d+[\.\d]*)'
        if ($versionStr -match $pattern) {
            $ver = $matches[1]
            $major = [int]($ver.Split('.')[0])
            if ($major -ge $MinMajor) {
                Write-Host "  [OK] $Name (v$ver)" -ForegroundColor Green
                return $true
            }
            else {
                Write-Host "  [OUTDATED] $Name (v$ver, need v$MinMajor or higher)" -ForegroundColor Yellow
                return $false
            }
        }
        else {
            Write-Host "  [OK] $Name" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "  [MISSING] $Name" -ForegroundColor Red
        return $false
    }
}

function New-Secret {
    $bytes = New-Object byte[] 16
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [BitConverter]::ToString($bytes).Replace("-","").ToLower()
}

function Read-SecureInput {
    param([string]$Prompt)
    $secure = Read-Host $Prompt -AsSecureString
    return [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}

Show-Banner

# ═══════════════════════════════════════════════════════
# Step 1: Check Prerequisites
# ═══════════════════════════════════════════════════════
Write-Color "  Step 1: Checking Prerequisites" Cyan
Write-Color "  ---------------------------------" DarkGray

$CriticalMissing = $false

if (-not (Test-CommandVersion "docker" "Docker" 20)) { $CriticalMissing = $true }
if (-not (Test-Command "docker-compose" "Docker Compose")) {
    try {
        docker compose version 2>$null | Out-Null
        Write-Host "  [OK] Docker Compose (v2 plugin)" -ForegroundColor Green
    }
    catch {
        $CriticalMissing = $true
    }
}
if (-not (Test-CommandVersion "node" "Node.js" 18)) { $CriticalMissing = $true }

# Optional
$javaOk = Test-CommandVersion "java" "Java (optional)" 17 "-version"
if (-not $javaOk) { Write-Color "         Needed for local Java development only" DarkGray }

$pythonOk = Test-CommandVersion "python" "Python (optional)" 3
if (-not $pythonOk) { Write-Color "         Needed for CLI tools" DarkGray }

Write-Host ""

if ($CriticalMissing) {
    Write-Color "  Critical prerequisites missing!" Red
    Write-Color "  Install Docker: https://docs.docker.com/get-docker/" DarkGray
    Write-Color "  Install Node.js: https://nodejs.org/" DarkGray
    Write-Host ""
    $Continue = Read-Host "  Continue anyway? [y/N]"
    if ($Continue -ne "y" -and $Continue -ne "Y") {
        Write-Color "  Setup cancelled." DarkGray
        exit 1
    }
}

# ═══════════════════════════════════════════════════════
# Step 2: Choose Deployment Mode
# ═══════════════════════════════════════════════════════
Write-Color "  Step 2: Choose Deployment Mode" Cyan
Write-Color "  ---------------------------------" DarkGray
Write-Host ""
Write-Host "  1) Local Development  " -NoNewLine; Write-Color "-- run everything on your machine" DarkGray
Write-Host "  2) Production / EC2   " -NoNewLine; Write-Color "-- connect to external v1/v2 backends" DarkGray
Write-Host ""
$DeployMode = Read-Host "  Select mode [1]"
if ([string]::IsNullOrWhiteSpace($DeployMode)) { $DeployMode = "1" }

Write-Host ""

# ═══════════════════════════════════════════════════════
# Step 3: Interactive Configuration
# ═══════════════════════════════════════════════════════
Write-Color "  Step 3: Platform Configuration" Cyan
Write-Color "  ---------------------------------" DarkGray

# --- Database ---
Write-Host ""
Write-Color "  Database" White

$PostgresPasswordDefault = New-Secret
$PostgresPassword = Read-Host "  PostgreSQL password [$PostgresPasswordDefault]"
if ([string]::IsNullOrWhiteSpace($PostgresPassword)) { $PostgresPassword = $PostgresPasswordDefault }

$RedisPasswordDefault = New-Secret
$RedisPassword = Read-Host "  Redis password [$RedisPasswordDefault]"
if ([string]::IsNullOrWhiteSpace($RedisPassword)) { $RedisPassword = $RedisPasswordDefault }

# --- API Keys ---
Write-Host ""
Write-Color "  API Keys" White

$GeminiApiKeyPlain = Read-SecureInput "  Gemini API Key (optional, Enter to skip)"

$JwtSecretDefault = New-Secret
$JwtSecret = Read-Host "  JWT Secret [$JwtSecretDefault]"
if ([string]::IsNullOrWhiteSpace($JwtSecret)) { $JwtSecret = $JwtSecretDefault }

$InternalSecretDefault = New-Secret
$InternalSharedSecret = Read-Host "  Internal Shared Secret [$InternalSecretDefault]"
if ([string]::IsNullOrWhiteSpace($InternalSharedSecret)) { $InternalSharedSecret = $InternalSecretDefault }

# --- Target Backends ---
Write-Host ""
Write-Color "  Target Application (V1 / V2 backends)" White

if ($DeployMode -eq "2") {
    Write-Color "  Production mode: enter the host/port of your running v1 and v2 apps." DarkGray
    $DefaultHost = "host.docker.internal"
} else {
    Write-Color "  Local mode: use 'host.docker.internal' to reach apps on your host machine." DarkGray
    $DefaultHost = "host.docker.internal"
}
Write-Host ""

$ProdBackendHost = Read-Host "  V1 (production) backend host [$DefaultHost]"
if ([string]::IsNullOrWhiteSpace($ProdBackendHost)) { $ProdBackendHost = $DefaultHost }

$ProdBackendPort = Read-Host "  V1 (production) backend port [5001]"
if ([string]::IsNullOrWhiteSpace($ProdBackendPort)) { $ProdBackendPort = "5001" }

$ShadowBackendHost = Read-Host "  V2 (shadow) backend host [$DefaultHost]"
if ([string]::IsNullOrWhiteSpace($ShadowBackendHost)) { $ShadowBackendHost = $DefaultHost }

$ShadowBackendPort = Read-Host "  V2 (shadow) backend port [5002]"
if ([string]::IsNullOrWhiteSpace($ShadowBackendPort)) { $ShadowBackendPort = "5002" }

$MirrorPercentage = Read-Host "  Mirror percentage (0-100) [100]"
if ([string]::IsNullOrWhiteSpace($MirrorPercentage)) { $MirrorPercentage = "100" }

# --- CORS ---
Write-Host ""
Write-Color "  Dashboard URL (for CORS)" White

if ($DeployMode -eq "2") {
    $CorsOrigins = Read-Host "  Dashboard URL (e.g. http://your-ip:3004) [*]"
    if ([string]::IsNullOrWhiteSpace($CorsOrigins)) { $CorsOrigins = "*" }
    $ViteApiUrlDefault = "http://${ProdBackendHost}:8083"
    $ViteApiUrl = Read-Host "  Dashboard API URL [$ViteApiUrlDefault]"
    if ([string]::IsNullOrWhiteSpace($ViteApiUrl)) { $ViteApiUrl = $ViteApiUrlDefault }
} else {
    $CorsOrigins = "http://localhost:3004"
    $ViteApiUrl = "http://localhost:8083"
}

# --- Supabase (optional) ---
Write-Host ""
Write-Color "  Supabase (optional -- press Enter to skip)" White
Write-Color "  Only needed if using Supabase as your database backend." DarkGray

$SupabaseUrl = Read-Host "  Supabase Project URL []"
$SupabaseAnonKeyPlain = Read-SecureInput "  Supabase Anon Key []"

Write-Host ""

# ═══════════════════════════════════════════════════════
# Step 4: Generate Configuration Files
# ═══════════════════════════════════════════════════════
Write-Color "  Step 4: Generating Configuration" Cyan
Write-Color "  ---------------------------------" DarkGray

$Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
$ModeLabel = if ($DeployMode -eq "2") { "Production" } else { "Local Development" }
$nl = [Environment]::NewLine

# Generate .env
$envContent = "# =======================================================$nl"
$envContent += "# Shadow Deploy Platform Configuration$nl"
$envContent += "# Generated by setup.ps1 on $Timestamp$nl"
$envContent += "# Mode: $ModeLabel$nl"
$envContent += "# =======================================================$nl"
$envContent += "$nl"
$envContent += "# -- Database ------------------------------------------$nl"
$envContent += "POSTGRES_USER=shadow$nl"
$envContent += "POSTGRES_PASSWORD=$PostgresPassword$nl"
$envContent += "REDIS_PASSWORD=$RedisPassword$nl"
$envContent += "$nl"
$envContent += "# -- Security -----------------------------------------$nl"
$envContent += "JWT_SECRET=$JwtSecret$nl"
$envContent += "INTERNAL_SHARED_SECRET=$InternalSharedSecret$nl"
$envContent += "$nl"
$envContent += "# -- AI Service ---------------------------------------$nl"
$envContent += "GEMINI_API_KEY=$GeminiApiKeyPlain$nl"
$envContent += "LLM_PROVIDER=gemini$nl"
$envContent += "$nl"
$envContent += "# -- Target Application Backends ----------------------$nl"
$envContent += "PROD_BACKEND_HOST=$ProdBackendHost$nl"
$envContent += "PROD_BACKEND_PORT=$ProdBackendPort$nl"
$envContent += "SHADOW_BACKEND_HOST=$ShadowBackendHost$nl"
$envContent += "SHADOW_BACKEND_PORT=$ShadowBackendPort$nl"
$envContent += "$nl"
$envContent += "# -- Traffic Mirroring --------------------------------$nl"
$envContent += "MIRROR_PERCENTAGE=$MirrorPercentage$nl"
$envContent += "$nl"
$envContent += "# -- CORS & Dashboard ---------------------------------$nl"
$envContent += "CORS_ALLOWED_ORIGINS=$CorsOrigins$nl"
$envContent += "VITE_API_URL=$ViteApiUrl$nl"
$envContent += "$nl"
$envContent += "# -- Service Ports (change if conflicts) --------------$nl"
$envContent += "DASHBOARD_PORT=3004$nl"
$envContent += "NGINX_PROXY_PORT=80$nl"
$envContent += "API_SERVICE_PORT=8083$nl"
$envContent += "AI_SERVICE_PORT=8005$nl"
$envContent += "INGESTION_PORT=8081$nl"
$envContent += "COMPARISON_PORT=8082$nl"
$envContent += "GRAFANA_PORT=3001$nl"
$envContent += "PROMETHEUS_PORT=9090$nl"
$envContent += "$nl"
$envContent += "# -- Supabase (optional) ------------------------------$nl"
$envContent += "SUPABASE_URL=$SupabaseUrl$nl"
$envContent += "SUPABASE_ANON_KEY=$SupabaseAnonKeyPlain"

$envPath = Join-Path $ScriptDir '.env'
[System.IO.File]::WriteAllText($envPath, $envContent)
Write-Host "  [OK] Generated .env" -ForegroundColor Green

# Generate dashboard/.env.local
$dashEnvContent = "VITE_API_URL=$ViteApiUrl$nl"
$dashEnvContent += "VITE_SUPABASE_URL=$SupabaseUrl$nl"
$dashEnvContent += "VITE_SUPABASE_ANON_KEY=$SupabaseAnonKeyPlain"

$dashEnvPath = Join-Path $ScriptDir 'dashboard' '.env.local'
[System.IO.File]::WriteAllText($dashEnvPath, $dashEnvContent)
Write-Host "  [OK] Generated dashboard/.env.local" -ForegroundColor Green

# Generate supabase.ts (only if Supabase URL provided)
if (-not [string]::IsNullOrWhiteSpace($SupabaseUrl)) {
    $pipe = [string]([char]124) + [string]([char]124)
    $comma = [string]([char]44)

    $tsContent = ''
    $tsContent += 'import { createClient } from ' + [char]39 + '@supabase/supabase-js' + [char]39 + ';' + $nl
    $tsContent += $nl
    $tsContent += 'const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ' + $pipe + ' ' + [char]39 + $SupabaseUrl + [char]39 + ';' + $nl
    $tsContent += 'const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ' + $pipe + ' ' + [char]39 + $SupabaseAnonKeyPlain + [char]39 + ';' + $nl
    $tsContent += $nl
    $tsContent += 'if (SUPABASE_URL === ' + [char]39 + 'https://your-project.supabase.co' + [char]39 + ') {' + $nl
    $tsContent += '    console.warn(' + [char]39 + 'Supabase URL not configured. Run ./setup.sh or set VITE_SUPABASE_URL in dashboard/.env.local' + [char]39 + ');' + $nl
    $tsContent += '}' + $nl
    $tsContent += $nl
    $tsContent += 'export const supabase = createClient(SUPABASE_URL' + $comma + ' SUPABASE_ANON_KEY);' + $nl

    $tsPath = Join-Path $ScriptDir 'dashboard' 'src' 'services' 'supabase.ts'
    [System.IO.File]::WriteAllText($tsPath, $tsContent)
    Write-Host "  [OK] Generated dashboard/src/services/supabase.ts" -ForegroundColor Green
}

Write-Host ""

# ═══════════════════════════════════════════════════════
# Step 5: Database Migration
# ═══════════════════════════════════════════════════════
if (-not [string]::IsNullOrWhiteSpace($SupabaseUrl)) {
    $RunMigrate = Read-Host "  Run Supabase schema migration now? [y/N]"
    if ($RunMigrate -eq "y" -or $RunMigrate -eq "Y") {
        Write-Host ""
        Write-Color "  Manual Step Required:" Yellow
        Write-Color "  1. Go to your Supabase Dashboard -> SQL Editor -> New Query" DarkGray
        Write-Color "  2. Paste the contents of: dashboard/supabase-schema.sql" DarkGray
        Write-Color "  3. Click Run" DarkGray
        Write-Host ""
        Read-Host "  Press Enter when done"
    }
}

# ═══════════════════════════════════════════════════════
# Step 6: Start Services
# ═══════════════════════════════════════════════════════
Write-Host ""
$StartServices = Read-Host "  Start all services now? [Y/n]"
if ([string]::IsNullOrWhiteSpace($StartServices)) { $StartServices = "Y" }

if ($StartServices -eq "y" -or $StartServices -eq "Y") {
    Write-Host ""
    Write-Color "  Starting all services..." Cyan
    Set-Location $ScriptDir

    if ($DeployMode -eq "2") {
        Write-Color "  Using production + EC2 overrides..." DarkGray
        docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ec2.yml up -d --build
    } else {
        docker compose up -d --build
    }

    Write-Host ""
    Write-Color "  Waiting for services to become healthy..." Cyan
    if (Get-Command "python" -ErrorAction SilentlyContinue) {
        python cli/healthcheck.py --wait --timeout 120
    } elseif (Get-Command "python3" -ErrorAction SilentlyContinue) {
        python3 cli/healthcheck.py --wait --timeout 120
    } else {
        Write-Color "  Python not found -- skipping health check. Check manually with 'docker compose ps'" DarkGray
    }
}

# ═══════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════
Write-Host ""
Write-Color "  +======================================+" Green
Write-Color "  |         Setup Complete!               |" Green
Write-Color "  +======================================+" Green
Write-Host ""
Write-Color "  Service URLs:" White
Write-Host "  Dashboard:          " -NoNewLine; Write-Color "http://localhost:3004" Cyan
Write-Host "  NGINX Proxy:        " -NoNewLine; Write-Color "http://localhost:80" Cyan
Write-Host "  API Service:        " -NoNewLine; Write-Color "http://localhost:8083" Cyan
Write-Host "  AI Service:         " -NoNewLine; Write-Color "http://localhost:8005" Cyan
Write-Host "  Ingestion Service:  " -NoNewLine; Write-Color "http://localhost:8081" Cyan
Write-Host "  Grafana:            " -NoNewLine; Write-Color "http://localhost:3001" Cyan
Write-Host "  Prometheus:         " -NoNewLine; Write-Color "http://localhost:9090" Cyan
Write-Host ""
Write-Color "  Default Credentials:" White
Write-Host "  Dashboard Login:    " -NoNewLine; Write-Color "admin / shadow-admin" DarkGray
Write-Host "  API Key:            " -NoNewLine; Write-Color "sk-shadow-default-key-change-me" DarkGray
Write-Host ""
Write-Color "  Quick Commands:" White
Write-Color "  make health     - Check all service health" DarkGray
Write-Color "  make logs       - Tail all service logs" DarkGray
Write-Color "  make test       - Run end-to-end platform test" DarkGray
Write-Color "  make shadow     - Start shadow testing" DarkGray
Write-Color "  make dev        - Start dashboard in dev mode" DarkGray
Write-Color "  make stop       - Stop all services" DarkGray
Write-Host ""

if ($DeployMode -eq "2") {
    Write-Color "  Production Notes:" Yellow
    Write-Color "  * Make sure your v1 app is running on ${ProdBackendHost}:${ProdBackendPort}" DarkGray
    Write-Color "  * Make sure your v2 app is running on ${ShadowBackendHost}:${ShadowBackendPort}" DarkGray
    Write-Color "  * Send traffic through http://your-server:80 (NGINX) to start comparisons" DarkGray
    Write-Host ""
}
