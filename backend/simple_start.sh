#!/bin/bash

# Simple Backend Startup Script for AI Agent
# Lightweight version without complex agent system

echo "🚀 Starting AI Agent Simple Backend..."

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down simple backend..."
    pkill -f "python.*simple_main" 2>/dev/null
    exit 0
}

# Trap exit signals
trap cleanup EXIT INT TERM

# Main loop
while true; do
    echo "🔄 Starting simple backend server..."
    cd /Users/sk/sk/proj/ai-agent-clean/backend
    
    # Activate virtual environment and start simple backend
    source venv/bin/activate
    python app/simple_main.py > simple_backend.log 2>&1 &
    BACKEND_PID=$!
    
    echo "✅ Simple backend started with PID: $BACKEND_PID"
    echo "📝 Logs are being written to simple_backend.log"
    echo "💡 Press Ctrl+C to stop the backend"
    
    # Wait for the process (this will return when the process exits)
    wait $BACKEND_PID
    
    # If we get here, the backend crashed
    echo "⚠️  Simple backend process exited unexpectedly"
    echo "📋 Recent log entries:"
    tail -n 10 simple_backend.log
    echo ""
    
    # Wait before restart
    echo "⏳ Restarting in 3 seconds..."
    sleep 3
done