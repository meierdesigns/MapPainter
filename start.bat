@echo off
title PixelPainter Development Server
echo Starting PixelPainter Development Server...
echo.

REM Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Error installing dependencies!
        pause
        exit /b 1
    )
    echo.
)

REM Check if port 3000 is already in use
netstat -an | find "3000" >nul
if not errorlevel 1 (
    echo Port 3000 is already in use. Stopping existing processes...
    taskkill /f /im node.exe 2>nul
    taskkill /f /im npm.exe 2>nul
    timeout /t 3 /nobreak >nul
)

REM Clear any cached files
if exist "dist" rmdir /s /q "dist" 2>nul
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache" 2>nul

REM Start the development server
echo Starting development server on http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
call npm start
