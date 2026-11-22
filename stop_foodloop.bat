@echo off
title FOODLOOP AI - Shutdown Utility
color 0C

echo =====================================================================
echo                    FOODLOOP AI - SHUTDOWN UTILITY
echo =====================================================================
echo.
echo Stopping running Uvicorn backend and Node.js Next.js processes on ports 8000 and 3000...

:: Find and terminate processes on port 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo Terminating backend process PID %%a on port 8000...
    taskkill /F /PID %%a >nul 2>&1
)

:: Find and terminate processes on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Terminating frontend process PID %%a on port 3000...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [OK] FOODLOOP AI processes stopped successfully.
pause
