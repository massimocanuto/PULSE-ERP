$ErrorActionPreference = "Stop"

# Define the port to check
$port = 5000

Write-Host "Checking for processes on port $port..." -ForegroundColor Cyan

# Find the process occupying the port
$processId = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Select-Object -Unique

if ($processId) {
    Write-Host "Port $port is in use by PID: $processId" -ForegroundColor Yellow
    try {
        Stop-Process -Id $processId -Force
        Write-Host "Process $processId has been terminated successfully." -ForegroundColor Green
    } catch {
        Write-Host "Failed to terminate process $processId. Please try running as Administrator." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Port $port is free." -ForegroundColor Green
}

# Add a small delay to ensure the port is fully released
Start-Sleep -Seconds 1

Write-Host "Starting PULSE ERP Development Server..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

# Run the dev command
npm run dev
