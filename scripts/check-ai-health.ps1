# ============================================================
# Check AI Services Health
# Quick status check for Ollama + FastAPI
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI Services Health Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Ollama
Write-Host "[Ollama Server]" -ForegroundColor Yellow
try {
    $ollamaResponse = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 5
    Write-Host "  Status:  CONNECTED" -ForegroundColor Green
    Write-Host "  URL:     http://localhost:11434" -ForegroundColor White
    Write-Host "  Models:" -ForegroundColor White
    foreach ($model in $ollamaResponse.models) {
        $sizeGB = [math]::Round($model.size / 1GB, 1)
        Write-Host "    - $($model.name) ($($sizeGB) GB)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Status:  NOT RUNNING" -ForegroundColor Red
    Write-Host "  Fix:     Run 'ollama serve' or use scripts/start-all-ai.ps1" -ForegroundColor Yellow
}

Write-Host ""

# Check FastAPI
Write-Host "[FastAPI AI Service]" -ForegroundColor Yellow
try {
    $fastApiResponse = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 5
    Write-Host "  Status:  RUNNING" -ForegroundColor Green
    Write-Host "  URL:     http://localhost:8000" -ForegroundColor White
    Write-Host "  Docs:    http://localhost:8000/docs" -ForegroundColor White
} catch {
    Write-Host "  Status:  NOT RUNNING" -ForegroundColor Red
    Write-Host "  Fix:     Run scripts/start-all-ai.ps1" -ForegroundColor Yellow
}

Write-Host ""

# Check Ollama via FastAPI
Write-Host "[Ollama via FastAPI]" -ForegroundColor Yellow
try {
    $ollamaViaFastApi = Invoke-RestMethod -Uri "http://localhost:8000/api/ollama/health" -TimeoutSec 10
    Write-Host "  Status:  $($ollamaViaFastApi.status)" -ForegroundColor Green
    Write-Host "  Models:  $($ollamaViaFastApi.model_count) available" -ForegroundColor White
} catch {
    Write-Host "  Status:  UNAVAILABLE" -ForegroundColor Red
}

Write-Host ""

# Check OLLAMA_MODELS env var
$modelsDir = [System.Environment]::GetEnvironmentVariable("OLLAMA_MODELS", "User")
Write-Host "[Configuration]" -ForegroundColor Yellow
Write-Host "  OLLAMA_MODELS: $modelsDir" -ForegroundColor White
if ($modelsDir -and (Test-Path $modelsDir)) {
    $size = (Get-ChildItem $modelsDir -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $sizeGB = [math]::Round($size / 1GB, 2)
    Write-Host "  Disk usage: $sizeGB GB" -ForegroundColor Gray
}

Write-Host ""
