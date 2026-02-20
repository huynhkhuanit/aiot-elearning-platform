# ============================================================
# Setup Ollama Local - AI Models - Đường dẫn tùy chỉnh
# For AIoT Learning Platform - Backup for Google Colab
# Tích hợp với ai-service/main.py
# ============================================================
# Cách dùng:
#   .\setup-ollama-local.ps1                    # Mặc định: D:\AI\Models
#   .\setup-ollama-local.ps1 -ModelsDir "E:\AI\Models"
# ============================================================

param(
    [Parameter()]
    [string]$ModelsDir = "D:\AI\Models"
)

$ErrorActionPreference = "Stop"
$MODELS_DIR = $ModelsDir
$OLLAMA_INSTALLER_URL = "https://ollama.com/download/OllamaSetup.exe"
$INSTALLER_PATH = "$env:TEMP\OllamaSetup.exe"

# Models to pull - khớp với ai-service/config.py (OLLAMA_CHAT_MODEL, OLLAMA_COMPLETION_MODEL)
$MODELS = @(
    "deepseek-coder:1.3b",        # OLLAMA_COMPLETION_MODEL - Fast FIM (~776MB)
    "qwen2.5-coder:7b-instruct",  # OLLAMA_CHAT_MODEL - Coding + Vietnamese (~4.7GB)
    "codellama:7b-instruct"       # Alternative (optional)
)

# Đảm bảo OLLAMA_MODELS được set sớm nhất
$env:OLLAMA_MODELS = $MODELS_DIR

# Path tới ai-service (script chạy từ scripts/)
$ROOT_DIR = Split-Path -Parent $PSScriptRoot
$AI_SERVICE_ENV = Join-Path $ROOT_DIR "ai-service\.env"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Ollama Local Setup - AIoT Platform" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Models sẽ lưu tại: $MODELS_DIR" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Ollama is installed
Write-Host "[1/6] Checking Ollama installation..." -ForegroundColor Yellow
$ollamaInstalled = $false
try {
    $version = ollama --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Ollama already installed: $version" -ForegroundColor Green
        $ollamaInstalled = $true
    }
} catch {
    Write-Host "  Ollama not found. Will install." -ForegroundColor Yellow
}

if (-not $ollamaInstalled) {
    Write-Host "[2/6] Downloading Ollama installer..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri $OLLAMA_INSTALLER_URL -OutFile $INSTALLER_PATH -UseBasicParsing
        Write-Host "  Downloaded to $INSTALLER_PATH" -ForegroundColor Green

        Write-Host "[2/6] Installing Ollama (silent)..." -ForegroundColor Yellow
        Start-Process -FilePath $INSTALLER_PATH -ArgumentList "/S" -Wait
        Write-Host "  Ollama installed!" -ForegroundColor Green

        # Refresh PATH
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
    } catch {
        Write-Host "  ERROR: Could not install Ollama automatically." -ForegroundColor Red
        Write-Host "  Please download and install manually from https://ollama.com" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[2/6] Skipping installation (already installed)" -ForegroundColor Green
}

# Step 3: Configure model storage path
Write-Host "[3/6] Configuring model storage at $MODELS_DIR..." -ForegroundColor Yellow

if (-not (Test-Path $MODELS_DIR)) {
    New-Item -ItemType Directory -Path $MODELS_DIR -Force | Out-Null
    Write-Host "  Created directory: $MODELS_DIR" -ForegroundColor Green
} else {
    Write-Host "  Directory exists: $MODELS_DIR" -ForegroundColor Green
}

# Set OLLAMA_MODELS environment variable (system-wide)
$currentVal = [System.Environment]::GetEnvironmentVariable("OLLAMA_MODELS", "User")
if ($currentVal -ne $MODELS_DIR) {
    [System.Environment]::SetEnvironmentVariable("OLLAMA_MODELS", $MODELS_DIR, "User")
    $env:OLLAMA_MODELS = $MODELS_DIR
    Write-Host "  Set OLLAMA_MODELS=$MODELS_DIR (User env var)" -ForegroundColor Green
} else {
    Write-Host "  OLLAMA_MODELS already set to $MODELS_DIR" -ForegroundColor Green
}

# Step 4: Dừng Ollama cũ (nếu có) rồi khởi động với OLLAMA_MODELS đúng đường dẫn
Write-Host "[4/6] Starting Ollama server with models path: $MODELS_DIR..." -ForegroundColor Yellow
$ollamaRunning = $false

# Dừng Ollama đang chạy để đảm bảo khởi động lại với OLLAMA_MODELS đúng
$ollamaProcesses = Get-Process | Where-Object { $_.ProcessName -like "*ollama*" }
if ($ollamaProcesses) {
    Write-Host "  Stopping existing Ollama process(es)..." -ForegroundColor Yellow
    $ollamaProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Khởi động Ollama với OLLAMA_MODELS (process con kế thừa env từ session này)
$env:OLLAMA_MODELS = $MODELS_DIR
Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
Start-Sleep -Seconds 5

# Verify
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434" -UseBasicParsing -TimeoutSec 10
    Write-Host "  Ollama server started! Models will be stored at: $MODELS_DIR" -ForegroundColor Green
    $ollamaRunning = $true
} catch {
    Write-Host "  WARNING: Could not verify Ollama is running. Check if ollama is in PATH." -ForegroundColor Red
}

# Step 5: Pull models
Write-Host "[5/6] Pulling AI models..." -ForegroundColor Yellow
Write-Host "  This may take 10-30 minutes depending on internet speed." -ForegroundColor Gray
Write-Host ""

foreach ($model in $MODELS) {
    Write-Host "  Pulling $model ..." -ForegroundColor Cyan
    $env:OLLAMA_MODELS = $MODELS_DIR
    ollama pull $model
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  $model pulled successfully!" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: Failed to pull $model" -ForegroundColor Red
    }
    Write-Host ""
}

# Step 6: Cập nhật ai-service/.env để tích hợp với main.py
Write-Host "[6/6] Updating ai-service/.env for main.py integration..." -ForegroundColor Yellow
$aiServiceDir = Split-Path -Parent $AI_SERVICE_ENV
if (-not (Test-Path $aiServiceDir)) {
    Write-Host "  WARNING: ai-service directory not found at $aiServiceDir - skipping .env update" -ForegroundColor Yellow
} else {
$ollamaVars = @{
    "OLLAMA_BASE_URL" = "http://localhost:11434"
    "OLLAMA_CHAT_MODEL" = "qwen2.5-coder:7b-instruct"
    "OLLAMA_COMPLETION_MODEL" = "deepseek-coder:1.3b"
}
$lines = @()
if (Test-Path $AI_SERVICE_ENV) {
    $lines = Get-Content $AI_SERVICE_ENV -Encoding UTF8
}
$updatedKeys = @{}
$newLines = @()
foreach ($line in $lines) {
    $modified = $false
    foreach ($key in $ollamaVars.Keys) {
        if ($line -match "^\s*$key\s*=") {
            $newLines += "$key=$($ollamaVars[$key])"
            $updatedKeys[$key] = $true
            $modified = $true
            break
        }
    }
    if (-not $modified) {
        $newLines += $line
    }
}
foreach ($key in $ollamaVars.Keys) {
    if (-not $updatedKeys[$key]) {
        $newLines += "$key=$($ollamaVars[$key])"
    }
}
try {
    $newLines | Set-Content $AI_SERVICE_ENV -Encoding UTF8 -Force
    Write-Host "  Updated ai-service\.env with Ollama config" -ForegroundColor Green
} catch {
    Write-Host "  WARNING: Could not update ai-service\.env - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Add manually to ai-service\.env:" -ForegroundColor Yellow
    Write-Host "    OLLAMA_BASE_URL=http://localhost:11434" -ForegroundColor Gray
    Write-Host "    OLLAMA_CHAT_MODEL=qwen2.5-coder:7b-instruct" -ForegroundColor Gray
    Write-Host "    OLLAMA_COMPLETION_MODEL=deepseek-coder:1.3b" -ForegroundColor Gray
}
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Models directory: $MODELS_DIR" -ForegroundColor White
Write-Host "  Ollama server:   http://localhost:11434" -ForegroundColor White
Write-Host "  ai-service .env:  $AI_SERVICE_ENV" -ForegroundColor White
Write-Host ""
Write-Host "  Installed models:" -ForegroundColor White
$env:OLLAMA_MODELS = $MODELS_DIR
ollama list
Write-Host ""
Write-Host "  Run ai-service:" -ForegroundColor Yellow
Write-Host "    cd ai-service && python -m uvicorn main:app --host 0.0.0.0 --port 8000" -ForegroundColor Gray
Write-Host ""
