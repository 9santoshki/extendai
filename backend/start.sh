#!/bin/bash

# AI Agent Backend Startup Script

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  AI Agent Backend - FastAPI Service                       ║"
echo "║  Hybrid LangChain + Multi-Agent System                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Creating from .env.example..."
    cp .env.example .env
    echo "   Please edit .env and add your API key"
    echo ""
    read -p "Press Enter to continue or Ctrl+C to exit..."
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
    echo ""
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📥 Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "✓ Dependencies installed"
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check API key
if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your_api_key_here" ]; then
    echo "❌ Error: OPENAI_API_KEY not configured in .env"
    echo "   Please edit .env and add your API key"
    exit 1
fi

echo "✓ Configuration loaded"
echo ""

# Start the server
echo "🚀 Starting FastAPI server..."
echo "   URL: http://localhost:${PORT:-8000}"
echo "   Docs: http://localhost:${PORT:-8000}/docs"
echo ""
echo "Press Ctrl+C to stop"
echo "─────────────────────────────────────────────────────────────"
echo ""

python app/main.py
