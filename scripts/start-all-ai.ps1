# ============================================================
# Start All AI Services - Ollama + FastAPI
# For AIoT Learning Platform
# ============================================================

$ErrorActionPreference = "Continue"
$MODELS_DIR = "D:\AI\Models"
$PROJECT_ROOT = Split-Path -Parent $PSScriptRoot
$AI_SERVICE_DIR = Join-Path $PROJECT_ROOT "ai-service"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AIoT Platform - Start AI Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- Step 1: Ensure OLLAMA_MODELS is set ---
$env:OLLAMA_MODELS = $MODELS_DIR

# --- Step 2: Start Ollama ---
Write-Host "[1/3] Checking Ollama server..." -ForegroundColor Yellow
$ollamaRunning = $false
try {
    $null = Invoke-WebRequest -Uri "http://localhost:11434" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    $ollamaRunning = $true
    Write-Host "  Ollama already running!" -ForegroundColor Green
} catch {
    Write-Host "  Starting Ollama..." -ForegroundColor Yellow
    Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 5

    try {
        $null = Invoke-WebRequest -Uri "http://localhost:11434" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        $ollamaRunning = $true
        Write-Host "  Ollama started!" -ForegroundColor Green
    } catch {
        Write-Host "  WARNING: Ollama may not be running" -ForegroundColor Red
    }
}

# --- Step 3: Check models ---
Write-Host "[2/3] Checking models..." -ForegroundColor Yellow
if ($ollamaRunning) {
    $models = ollama list 2>&1
    Write-Host $models -ForegroundColor Gray

    $requiredModels = @("deepseek-coder:1.3b", "qwen2.5-coder:7b-instruct")
    foreach ($model in $requiredModels) {
        $found = $models | Select-String -Pattern $model.Split(":")[0] -Quiet
        if (-not $found) {
            Write-Host "  Missing model: $model - pulling..." -ForegroundColor Yellow
            ollama pull $model
        }
    }
}

# --- Step 4: Start FastAPI ---
Write-Host "[3/3] Starting FastAPI AI Service..." -ForegroundColor Yellow
if (Test-Path (Join-Path $AI_SERVICE_DIR "venv\Scripts\python.exe")) {
    $pythonPath = Join-Path $AI_SERVICE_DIR "venv\Scripts\python.exe"
} else {
    $pythonPath = "python"
}

# Kill existing FastAPI on port 8000
$existing = netstat -ano 2>$null | findstr ":8000" | ForEach-Object {
    if ($_ -match '\s+(\d+)$') { $matches[1] }
} | Select-Object -Unique

if ($existing) {
    Write-Host "  Stopping existing process on port 8000..." -ForegroundColor Yellow
    foreach ($pid in $existing) {
        try { Stop-Process -Id $pid -Force -ErrorAction Stop } catch {}
    }
    Start-Sleep -Seconds 2
}

Write-Host "  Starting FastAPI on port 8000..." -ForegroundColor Yellow
Start-Process -FilePath $pythonPath -ArgumentList "main.py" -WorkingDirectory $AI_SERVICE_DIR -WindowStyle Normal
Start-Sleep -Seconds 3

# --- Status ---
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  AI Services Status" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check Ollama
try {
    $ollamaHealth = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 5
    $modelNames = ($ollamaHealth.models | ForEach-Object { $_.name }) -join ", "
    Write-Host "  Ollama:  RUNNING (models: $modelNames)" -ForegroundColor Green
} catch {
    Write-Host "  Ollama:  NOT RUNNING" -ForegroundColor Red
}

# Check FastAPI
try {
    $fastApiHealth = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 5
    Write-Host "  FastAPI: RUNNING (v$($fastApiHealth.version))" -ForegroundColor Green
} catch {
    Write-Host "  FastAPI: NOT RUNNING (may still be starting...)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  Endpoints:" -ForegroundColor White
Write-Host "    Ollama:          http://localhost:11434" -ForegroundColor Gray
Write-Host "    FastAPI:         http://localhost:8000" -ForegroundColor Gray
Write-Host "    FastAPI Docs:    http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "    Ollama Health:   http://localhost:8000/api/ollama/health" -ForegroundColor Gray
Write-Host "    Ollama Chat:     http://localhost:8000/api/ollama/chat" -ForegroundColor Gray
Write-Host ""
