#!/bin/bash

echo "========================================================"
echo "      SAFELENS: PRIVACY PRESERVING BROWSER AGENT"
echo "========================================================"

# Get the absolute path of the current directory
PROJECT_DIR=$(pwd)

echo "[1/4] Booting Neural Engine (Phi-3)..."
osascript -e "tell application \"Terminal\" to do script \"ollama serve\""

echo "[2/4] Starting Analysis Layer (FastAPI)..."
osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_DIR/backend' && source venv/bin/activate && uvicorn app.main:app --reload\""

echo "[3/4] Activating Interception Layer (Proxy)..."
# Small sleep to let backend initialize
sleep 2
osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_DIR/backend/proxy' && source ../venv/bin/activate && mitmdump -s agent_core.py\""

echo "[4/4] Injecting Agent into Browser..."
sleep 2

# Launch Chrome
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
    --proxy-server="127.0.0.1:8080" \
    --ignore-certificate-errors \
    --user-data-dir="/tmp/safelens_profile" &

echo "SYSTEM LIVE."
