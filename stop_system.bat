@echo off
echo ========================================
echo    PixelPainter System Stop
echo ========================================

echo Beende alle Node.js-Prozesse...
taskkill /f /im node.exe 2>nul

echo Pruefe ob alle Prozesse beendet wurden...
timeout /t 2 /nobreak >nul
tasklist | findstr node.exe
if %errorlevel% equ 0 (
    echo WARNUNG: Einige Node.js-Prozesse laufen noch!
) else (
    echo Alle Node.js-Prozesse erfolgreich beendet.
)

echo ========================================
echo    System gestoppt!
echo ========================================
pause
