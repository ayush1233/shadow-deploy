# test-platform.ps1
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Shadow API Platform - E2E Test       " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$BASE_API = "http://localhost:8083/api/v1"
$INGEST_API = "http://localhost:8081/api/v1"
$AI_API = "http://localhost:8005/api/v1"

# 1. Test AI Service (Gemini Integration)
Write-Host "1. Testing AI Service (Gemini Integration)..." -ForegroundColor Yellow
$ai_payload = @{
    request_id       = "test-ai-001"
    endpoint         = "/api/users/123"
    prod_body        = '{"id":123,"name":"John Doe","email":"john@example.com"}'
    shadow_body      = '{"id":123,"name":"John Doe","email":"john@example.com","role":"admin"}'
    status_match     = $true
    latency_delta_ms = 15
} | ConvertTo-Json

try {
    $ai_result = Invoke-RestMethod -Uri "$AI_API/compare" -Method Post -Body $ai_payload -ContentType "application/json"
    Write-Host "✅ AI Service responded successfully!" -ForegroundColor Green
    Write-Host "   Similarity Score: $($ai_result.similarity_score)"
    Write-Host "   Severity: $($ai_result.severity)"
    Write-Host "   AI Explanation: $($ai_result.explanation)"
}
catch {
    Write-Host "❌ AI Service test failed: $_" -ForegroundColor Red
}
Write-Host ""

# 2. Test API Service Authentication
Write-Host "2. Testing API Service (Authentication)..." -ForegroundColor Yellow
$auth_payload = @{
    username = "admin"
    password = "shadow-admin"
} | ConvertTo-Json

try {
    $auth_result = Invoke-RestMethod -Uri "$BASE_API/auth/login" -Method Post -Body $auth_payload -ContentType "application/json"
    $token = $auth_result.token
    Write-Host "✅ Successfully logged in! Received JWT token." -ForegroundColor Green
}
catch {
    Write-Host "❌ Authentication failed: $_" -ForegroundColor Red
    exit
}
Write-Host ""

# 3. Test Metric Retrieval (Authenticated)
Write-Host "3. Testing API Service (Metrics Dashboard Data)..." -ForegroundColor Yellow
$headers = @{ "Authorization" = "Bearer $token" }
try {
    $metrics = Invoke-RestMethod -Uri "$BASE_API/metrics/summary" -Method Get -Headers $headers
    Write-Host "✅ Metrics retrieved successfully!" -ForegroundColor Green
    Write-Host "   Total Requests: $($metrics.total_requests)"
    Write-Host "   Mismatch Rate: $($metrics.mismatch_rate)%"
    Write-Host "   Risk Score: $($metrics.risk_score)"
}
catch {
    Write-Host "❌ Metrics retrieval failed: $_" -ForegroundColor Red
}
Write-Host ""

# 4. Test Ingestion Service
Write-Host "4. Testing Ingestion Service (SDK mode simulation)..." -ForegroundColor Yellow
$ingest_payload = @{
    request_id       = "req-$(Get-Random)"
    tenant_id        = "demo"
    traffic_type     = "production"
    method           = "POST"
    endpoint         = "/api/checkout"
    response_status  = 200
    response_body    = '{"order_id":"ORD-12345","status":"success"}'
    response_time_ms = 120
} | ConvertTo-Json

try {
    $ingest_result = Invoke-RestMethod -Uri "$INGEST_API/ingest/event" -Method Post -Body $ingest_payload -ContentType "application/json" -Headers @{"X-API-Key" = "sk-shadow-demo-key-change-me" } -UseBasicParsing
    Write-Host "✅ Event ingested successfully into Kafka!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Event ingestion failed: $_" -ForegroundColor Red
}
Write-Host ""

# 5. Test AI Proxy Configurator
Write-Host "5. Testing AI NGINX Configurator..." -ForegroundColor Yellow
$config_payload = @{
    instruction = "Please route our main production traffic to port 3000 and mirror it to our shadow V2 app on 4000"
} | ConvertTo-Json

try {
    $config_result = Invoke-RestMethod -Uri "$AI_API/configure-proxy" -Method Post -Body $config_payload -ContentType "application/json"
    if ($config_result.status -eq "success") {
        Write-Host "✅ AI correctly parsed the ports and updated NGINX config!" -ForegroundColor Green
        Write-Host "   AI Parsed: Prod -> $($config_result.parsed_ports.production_port), Shadow -> $($config_result.parsed_ports.shadow_port)"
        Write-Host "   Message: $($config_result.message)"
    }
}
catch {
    Write-Host "❌ AI Configurator failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test complete! Check the dashboard at:  " -ForegroundColor Cyan
Write-Host "http://localhost:3004                   " -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
