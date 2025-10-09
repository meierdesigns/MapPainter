# PixelPainter System Monitor
# Keeps the system running continuously

Write-Host "========================================" -ForegroundColor Green
Write-Host "   PixelPainter System Monitor" -ForegroundColor Green
Write-Host "   Keeping system running..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

function Start-Backend {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting Backend Server..." -ForegroundColor Yellow
    Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Hidden
    Start-Sleep -Seconds 3
}

function Start-Frontend {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting Frontend Server..." -ForegroundColor Yellow
    Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Normal
    Start-Sleep -Seconds 5
}

while ($true) {
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    Write-Host "[$timestamp] Checking system status..." -ForegroundColor Cyan
    
    # Check Backend (Port 3001)
    if (-not (Test-Port -Port 3001)) {
        Write-Host "[WARNING] Backend server (3001) is down! Restarting..." -ForegroundColor Red
        Start-Backend
    }
    
    # Check Frontend (Port 3000)
    if (-not (Test-Port -Port 3000)) {
        Write-Host "[WARNING] Frontend server (3000) is down! Restarting..." -ForegroundColor Red
        Start-Frontend
    }
    
    # Check Node.js processes
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if (-not $nodeProcesses) {
        Write-Host "[ERROR] No Node.js processes found! Starting system..." -ForegroundColor Red
        Start-Backend
        Start-Sleep -Seconds 3
        Start-Frontend
    }
    
    Write-Host "[OK] System is running - Backend: 3001, Frontend: 3000" -ForegroundColor Green
    Write-Host "Waiting 30 seconds before next check..." -ForegroundColor Gray
    Start-Sleep -Seconds 30
}
