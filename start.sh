#!/bin/bash

# Harvest Moon Game Launcher Script
# This script starts the development server and opens the game

echo "🌾 Starting Harvest Moon Game..."
echo "======================================"

# Kill any existing server on port 8000
echo "Checking for existing servers..."
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Stopping existing server on port 8000..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    sleep 1
fi

# Start the development server in the background
echo "Starting development server on port 8000..."
python3 -m http.server 8000 > /dev/null 2>&1 &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

# Check if server started successfully
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Server started successfully!"
    echo "🎮 Opening game in your browser..."
    
    # Open browser (works on macOS)
    open http://localhost:8000
    
    echo ""
    echo "======================================"
    echo "🎯 Game is now running at: http://localhost:8000"
    echo "📝 Press Ctrl+C to stop the server"
    echo "🔧 Press F1 in game for debug mode"
    echo "======================================"
    
    # Keep script running and handle cleanup
    trap "echo ''; echo 'Stopping server...'; kill $SERVER_PID 2>/dev/null; exit 0" INT
    
    # Wait for the server process
    wait $SERVER_PID
else
    echo "❌ Failed to start server on port 8000"
    echo "Try running manually: python3 -m http.server 8000"
    exit 1
fi