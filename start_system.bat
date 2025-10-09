@echo off
echo ========================================
echo    PixelPainter System Start
echo ========================================

echo [1/4] Beende alle Node.js-Prozesse...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/4] Starte Backend-Server (Port 3001)...
start /B node server.js
timeout /t 3 /nobreak >nul

echo [3/4] Pruefe Backend-Status...
netstat -an | findstr :3001
if %errorlevel% neq 0 (
    echo ERROR: Backend-Server konnte nicht gestartet werden!
    pause
    exit /b 1
)

echo [4/4] Starte Frontend-Server (Port 3000)...
start npm start

echo ========================================
echo    System erfolgreich gestartet!
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:3001
echo ========================================
pause
