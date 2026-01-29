# Script to start FastAPI service properly
# This ensures only ONE instance runs

Write-Host "Checking for existing FastAPI processes..."

# Find all processes listening on port 8000
$processes = netstat -ano | findstr ":8000" | ForEach-Object {
    if ($_ -match '\s+(\d+)$') {
        $matches[1]
    }
} | Select-Object -Unique

if ($processes) {
    Write-Host "Found processes on port 8000: $($processes -join ', ')"
    Write-Host "Stopping them..."
    foreach ($pid in $processes) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction Stop
            Write-Host "  Stopped process $pid"
        } catch {
            Write-Host "  Could not stop process $pid: $_"
        }
    }
    Start-Sleep -Seconds 2
}

# Verify port is free
$remaining = netstat -ano | findstr ":8000"
if ($remaining) {
    Write-Host "WARNING: Port 8000 is still in use!"
    Write-Host "Please manually stop processes and try again."
    exit 1
}

Write-Host "Port 8000 is free. Starting FastAPI service..."
Write-Host ""

# Start the service
Set-Location $PSScriptRoot
.\venv\Scripts\python main.py
