#!/bin/bash

# Robust Backend Startup Script for AI Agent
# Automatically restarts backend if it crashes

echo "🚀 Starting AI Agent Backend with auto-restart..."

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down backend..."
    pkill -f "python.*app/main" 2>/dev/null
    exit 0
}

# Trap exit signals
trap cleanup EXIT INT TERM

# Main loop
while true; do
    echo "🔄 Starting backend server..."
    cd /Users/sk/sk/proj/ai-agent-clean/backend
    
    # Activate virtual environment and start backend
    source venv/bin/activate
    python app/main.py > backend_stable.log 2>&1 &
    BACKEND_PID=$!
    
    echo "✅ Backend started with PID: $BACKEND_PID"
    echo "📝 Logs are being written to backend_stable.log"
    echo "💡 Press Ctrl+C to stop the backend"
    
    # Wait for the process (this will return when the process exits)
    wait $BACKEND_PID
    
    # If we get here, the backend crashed
    echo "⚠️  Backend process exited unexpectedly"
    echo "📋 Recent log entries:"
    tail -n 10 backend_stable.log
    echo ""
    
    # Wait before restart
    echo "⏳ Restarting in 3 seconds..."
    sleep 3
done