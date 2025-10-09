@echo off
echo ========================================
echo    PixelPainter System Monitor
echo    Keeping system running...
echo ========================================

:monitor_loop
echo [%date% %time%] Checking system status...

REM Check if backend is running
netstat -an | findstr ":3001.*LISTENING" >nul
if %errorlevel% neq 0 (
    echo [WARNING] Backend server (3001) is down! Restarting...
    start /B node server.js
    timeout /t 3 /nobreak >nul
)

REM Check if frontend is running
netstat -an | findstr ":3000.*LISTENING" >nul
if %errorlevel% neq 0 (
    echo [WARNING] Frontend server (3000) is down! Restarting...
    start npm start
    timeout /t 5 /nobreak >nul
)

REM Check if any node processes are running
tasklist | findstr node.exe >nul
if %errorlevel% neq 0 (
    echo [ERROR] No Node.js processes found! Starting system...
    call start_system.bat
    timeout /t 10 /nobreak >nul
)

echo [OK] System is running - Backend: 3001, Frontend: 3000
echo Waiting 30 seconds before next check...
timeout /t 30 /nobreak >nul

goto monitor_loop
