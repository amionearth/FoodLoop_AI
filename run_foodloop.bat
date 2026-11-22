@echo off
title FOODLOOP AI - One-Click Launcher
color 0A

echo =====================================================================
echo                     FOODLOOP AI - HACKATHON LAUNCHER
echo              Predict. Rescue. Redistribute. Prevent.
echo =====================================================================
echo.

:: 1. Verify Prerequisites
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Python is not found in your PATH!
    echo Please install Python 3.10+ and add it to your system PATH.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Node.js / npm is not found in your PATH!
    echo Please install Node.js 18+ and add it to your system PATH.
    pause
    exit /b 1
)

echo [1/5] Checking ML Model Artifact...
if not exist "backend\ml\models\demand_forecaster_latest.joblib" (
    echo Model artifact not found. Running ML training pipeline...
    python -m backend.ml.train
    if %ERRORLEVEL% neq 0 (
        echo [WARNING] ML training exited with an error. Continuing with baseline models...
    )
) else (
    echo [OK] Trained ML model artifact found.
)

echo [2/5] Initializing Database & Hackathon Seed Data...
python -m backend.app.seed
echo [OK] Database ready with test accounts.

echo.
echo [3/5] Starting FastAPI Backend on http://localhost:8000 ...
start "FOODLOOP AI - Backend API" cmd /k "title FOODLOOP Backend & color 0B & python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000"

:: Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak >nul

echo [4/5] Starting Next.js Frontend on http://localhost:3000 ...
start "FOODLOOP AI - Web Portal" cmd /k "title FOODLOOP Frontend & color 0E & cd frontend && npm run dev"

:: Wait 4 seconds for frontend dev server
timeout /t 4 /nobreak >nul

echo [5/5] Launching FOODLOOP AI Web Portal in default browser...
start http://localhost:3000

echo.
echo =====================================================================
echo                      FOODLOOP AI IS NOW RUNNING!
echo =====================================================================
echo.
echo  * Web Application : http://localhost:3000
echo  * Backend API Docs : http://localhost:8000/docs
echo  * Health Endpoint : http://localhost:8000/api/health
echo.
echo  PRE-CONFIGURED TEST PERSONAS (Password for all: FoodloopTest123!):
echo  -----------------------------------------------------------------
echo   1. Seller:    seller.test@foodloop.local   (Green Harvest Kitchen)
echo   2. Kitchen:   kitchen.test@foodloop.local  (Aashray Community Kitchen)
echo   3. Food Bank: foodbank.test@foodloop.local (Annapoorna Food Bank)
echo.
echo  (You can also click the 1-click test login buttons on the homepage)
echo.
echo Press any key in this window to close this launcher info (services remain running).
pause >nul
