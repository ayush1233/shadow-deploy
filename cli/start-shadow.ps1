param(
    [Parameter(Mandatory = $false)][int]$ProdPort = 3000,
    [Parameter(Mandatory = $false)][int]$ShadowPort = 4000,
    [Parameter(Mandatory = $false)][string]$ShadowAppDir
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   🚀 Shadow Deployment Auto-Run CLI    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$AppProcess = $null

# Step 1: Start the new 'v2' code if a directory was provided
if ($ShadowAppDir) {
    Write-Host ""
    Write-Host "[1] Starting new v2 Shadow App on Port $ShadowPort..." -ForegroundColor Yellow
    
    if (-not (Test-Path $ShadowAppDir)) {
        Write-Host "❌ Error: Directory '$ShadowAppDir' does not exist." -ForegroundColor Red
        exit 1
    }

    if (Test-Path "$ShadowAppDir\package.json") {
        Write-Host "    📦 Detected Node.js app! Running npm install and npm start..."
        # Running in a new window so the logs don't clutter the CLI output
        $AppProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd `"$ShadowAppDir`" && npm install && set PORT=$ShadowPort && npm start" -PassThru
        Write-Host "    ✅ Node app started in a new terminal window." -ForegroundColor Green
    } 
    elseif (Test-Path "$ShadowAppDir\requirements.txt") {
        Write-Host "    🐍 Detected Python app! Running uvicorn..."
        $AppProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd `"$ShadowAppDir`" && pip install -r requirements.txt && uvicorn main:app --port $ShadowPort" -PassThru
        Write-Host "    ✅ Python app started in a new terminal window." -ForegroundColor Green
    }
    else {
        Write-Host "    ⚠️ Could not auto-detect language. Please start your app manually on Port $ShadowPort." -ForegroundColor DarkYellow
    }
}
else {
    Write-Host ""
    Write-Host "[1] No app directory provided." -ForegroundColor DarkGray
    Write-Host "    Assuming v2 Shadow App is already manually running on Port $ShadowPort." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "[2] Reconfiguring NGINX Proxy via AI Configurator..." -ForegroundColor Yellow

# Step 2: Use the AI to configure the proxy automatically
$Prompt = "Route production traffic to port $ProdPort and shadow traffic to port $ShadowPort"
Write-Host "    🤖 Sending prompt to AI: '$Prompt'"

try {
    $Body = @{ prompt = $Prompt } | ConvertTo-Json
    $Response = Invoke-RestMethod -Uri "http://localhost:8083/api/v1/configure-proxy" -Method Post -Body $Body -ContentType "application/json"
    
    Write-Host "    ✅ AI Response: $($Response.message)" -ForegroundColor Green
}
catch {
    Write-Host "    ❌ Failed to update NGINX Proxy via AI. Is the platform running?" -ForegroundColor Red
    if ($AppProcess) { Stop-Process -Id $AppProcess.Id -Force -ErrorAction SilentlyContinue }
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✨ Shadow Testing is LIVE! ✨" -ForegroundColor Green
Write-Host "Primary App is running on port: $ProdPort" 
Write-Host "Shadow App is running on port:  $ShadowPort"
Write-Host ""
Write-Host "👉 Send your traffic to http://localhost:8080/ to test!" -ForegroundColor Cyan
Write-Host "👉 View the results at  http://localhost:3004/" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
