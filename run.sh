#!/bin/bash

# Install Python dependencies
echo "Installing Python dependencies..."
cd backend
python -m pip install -r requirements.txt

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
cd ../bot-trader
npm install

# Start backend server in background
echo "Starting backend server..."
cd ../backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "Starting frontend server..."
cd ../bot-trader
npm run dev -- --port 3000 --hostname 0.0.0.0

# If frontend exits, kill backend
kill $BACKEND_PID 