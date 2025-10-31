#!/bin/bash

# Quick Setup Script for Local Qwen2.5

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  AI Agent Backend - Local Qwen2.5 Setup                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed"
    echo ""
    echo "Please install Ollama first:"
    echo "  macOS/Linux: curl https://ollama.ai/install.sh | sh"
    echo "  Or visit: https://ollama.ai"
    exit 1
fi

echo "✓ Ollama is installed"

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollama is not running"
    echo ""
    echo "Starting Ollama in background..."
    nohup ollama serve > /dev/null 2>&1 &
    sleep 2
    
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✓ Ollama started successfully"
    else
        echo "❌ Failed to start Ollama"
        echo "   Please start it manually: ollama serve"
        exit 1
    fi
else
    echo "✓ Ollama is running"
fi

# Check if qwen2.5 is installed
echo ""
echo "Checking for Qwen2.5 model..."
if ollama list | grep -q "qwen2.5"; then
    echo "✓ Qwen2.5 is installed"
else
    echo "⚠️  Qwen2.5 not found"
    echo ""
    read -p "Would you like to install qwen2.5:7b? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Downloading qwen2.5:7b (this may take a few minutes)..."
        ollama pull qwen2.5:7b
        echo "✓ Qwen2.5 installed"
    else
        echo "Please install manually: ollama pull qwen2.5"
        exit 1
    fi
fi

# Configure .env
echo ""
echo "Configuring backend..."
if [ -f .env ]; then
    echo "⚠️  .env file already exists"
    read -p "Overwrite with Qwen2.5 configuration? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp .env.qwen .env
        echo "✓ Configuration updated"
    else
        echo "Keeping existing .env"
    fi
else
    cp .env.qwen .env
    echo "✓ Configuration created"
fi

# Test connection
echo ""
echo "Testing Ollama connection..."
if curl -s http://localhost:11434/v1/models > /dev/null 2>&1; then
    echo "✓ Ollama API is accessible"
else
    echo "❌ Cannot connect to Ollama API"
    echo "   Make sure Ollama is running: ollama serve"
    exit 1
fi

# Install Python dependencies
echo ""
echo "Installing Python dependencies..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "✓ Dependencies installed"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Setup Complete! 🎉                                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Configuration:"
echo "  Model: qwen2.5"
echo "  Ollama: http://localhost:11434"
echo "  Backend: http://localhost:8000"
echo ""
echo "Next steps:"
echo "  1. Start the backend:"
echo "     $ ./start.sh"
echo ""
echo "  2. Configure Chrome extension:"
echo "     - AI Provider: Custom OpenAI-Compatible API"
echo "     - API Key: ollama"
echo "     - Endpoint: http://localhost:8000/api/task"
echo "     - Model: qwen2.5"
echo ""
echo "  3. Test it:"
echo "     $ curl http://localhost:8000/health"
echo ""
echo "Ready to go! 🚀"
