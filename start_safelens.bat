@echo off
TITLE SafeLens Launcher
color 0A

echo ========================================================
echo       SAFELENS: PRIVACY PRESERVING BROWSER AGENT
echo       Starting Ecosystem...
echo ========================================================
echo.

:: 1. Start Ollama (Minimizes the window to keep things clean)
echo [1/4] Booting Neural Engine (Phi-3)...
start "SafeLens AI Core" /min cmd /k "ollama serve"

:: 2. Start FastAPI Backend
echo [2/4] Starting Analysis Layer (FastAPI)...
start "SafeLens Backend" cmd /k "cd backend && call venv\Scripts\activate && uvicorn app.main:app --reload"

:: 3. Start Mitmproxy
echo [3/4] Activating Interception Layer (Proxy)...
:: Waiting a few seconds to ensure backend is up
timeout /t 3 /nobreak >nul
start "SafeLens Agent" cmd /k "cd backend\proxy && call ..\venv\Scripts\activate && mitmdump -s agent_core.py"

:: 4. Launch Chrome with Flags
echo [4/4] Injecting Agent into Browser...
timeout /t 2 /nobreak >nul
echo.
echo SYSTEM READY. Launching Controlled Browser Environment...

:: Checks standard Chrome installation paths
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --proxy-server="127.0.0.1:8080" --ignore-certificate-errors --user-data-dir="C:\temp\safelens_profile"
) else (
    echo.
    echo [!] Could not find Chrome automatically. Please run the Chrome command from README manually.
    pause
)
