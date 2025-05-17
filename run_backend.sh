#!/bin/bash
# save as run.sh

# Create venv if it doesn't exist
if [ ! -d "backend/venv" ]; then
    python3 -m venv backend/venv
fi

# Activate venv and run server
source backend/venv/bin/activate
cd backend
pip install -r requirements.txt
pip install email-validator
uvicorn app.main:app --reload