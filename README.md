# AI Agent Browser Extension + Backend

Complete system with Chrome extension, FastAPI backend, LangChain, and multi-agent architecture.

## Quick Start

### 1. Setup Backend (with local Qwen2.5)

```bash
cd backend
./setup-qwen.sh  # Auto-configures everything
./start.sh       # Start the service
```

Backend runs on `http://localhost:8000`

### 2. Setup Extension

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension` folder
5. Open extension → Settings:
   ```
   AI Provider: Custom OpenAI-Compatible API
   API Key: ollama
   Endpoint: http://localhost:8000/api/task
   Model: qwen2.5
   ```
6. Save settings

### 3. Use It!

- Navigate to any webpage
- Open extension
- Ask: "What is this page about?"
- Or: "Search for AI agents"

---

## Architecture

```
Chrome Extension → FastAPI Backend → Multi-Agent System → Qwen2.5 (local)
                                    ├─ Planner Agent
                                    ├─ Analyzer Agent
                                    └─ Executor Agent
```

---

## Configuration

### Backend (.env)

For local Qwen2.5 (already configured in `.env.qwen`):

```env
OPENAI_API_KEY=ollama
MODEL_NAME=qwen2.5
BASE_URL=http://localhost:11434/v1
PORT=8000
```

### For Cloud APIs

Edit `backend/.env`:

**OpenAI:**
```env
OPENAI_API_KEY=sk-your-key
MODEL_NAME=gpt-4
BASE_URL=
```

**DeepSeek:**
```env
OPENAI_API_KEY=your-key
MODEL_NAME=deepseek-chat
BASE_URL=https://api.deepseek.com/v1
```

---

## Features

### Multi-Agent System

- **Planner**: Creates strategic plans
- **Analyzer**: Examines pages, finds elements
- **Executor**: Generates precise actions

### Extension Capabilities

- Click elements
- Fill forms
- Extract data
- Navigate pages
- Answer questions
- Search the web

### Session Management

- Multi-tab support
- Persistent chat history
- Context switching

---

## Requirements

### Backend
- Python 3.9+
- Ollama (for local models)

### Extension
- Chrome/Edge browser

---

## Installation Details

### Backend Setup

```bash
cd backend

# Auto setup (recommended)
./setup-qwen.sh

# Or manual
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.qwen .env
python app/main.py
```

### Ollama Setup

```bash
# Install Ollama (if not installed)
curl https://ollama.ai/install.sh | sh

# Pull Qwen2.5
ollama pull qwen2.5

# Start Ollama
ollama serve
```

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `POST /api/task` | Process task (main endpoint) |
| `GET /api/sessions` | List active sessions |
| `DELETE /api/history/{id}` | Clear chat history |

---

## Testing

```bash
# Test Ollama
curl http://localhost:11434/v1/models

# Test backend
curl http://localhost:8000/health

# Test multi-agent system
curl -X POST http://localhost:8000/api/test/agents \
  -H "Content-Type: application/json" \
  -d '{"api_key":"ollama","model":"qwen2.5","base_url":"http://localhost:11434/v1"}'
```

---

## Troubleshooting

### Backend won't start
```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama if needed
ollama serve
```

### Extension can't connect
- Check backend is running: `curl http://localhost:8000/health`
- Verify endpoint in extension settings: `http://localhost:8000/api/task`
- Check API key is set (any value works for local models)

### Slow responses
- Use smaller model: `qwen2.5:7b` instead of `qwen2.5:14b`
- Reduce max tokens in extension settings (1000-1500)
- Lower temperature (0.5-0.6)

---

## File Structure

```
ai-agent-clean/
├── backend/
│   ├── app/main.py              # FastAPI app
│   ├── agents/multi_agent.py    # Multi-agent system
│   ├── chains/reasoning_chains.py # LangChain chains
│   ├── requirements.txt
│   ├── setup-qwen.sh           # Auto setup
│   ├── start.sh                # Start server
│   └── .env.qwen               # Config template
├── extension/
│   ├── manifest.json
│   ├── scripts/
│   │   ├── background.js       # Main logic
│   │   └── content.js          # Page interaction
│   ├── ui/
│   │   ├── popup.html          # Extension UI
│   │   └── popup.js
│   ├── styles/
│   └── icons/
└── README.md                   # This file
```

---

## Performance Tips

For local models, use these extension settings:
- Temperature: 0.5-0.6
- Max Tokens: 1000-1500
- Action Delay: 800ms
- Max Actions: 5-8

---

## Security

- API keys stored in Chrome's encrypted storage
- Local models = 100% private
- No data sent to external servers (when using local models)

---

## Support

**Common Issues:**

1. **"Connection refused"** → Start Ollama: `ollama serve`
2. **"Model not found"** → Install model: `ollama pull qwen2.5`
3. **Backend errors** → Check `.env` configuration
4. **Extension errors** → Check endpoint URL and API key

**Need Help?**
- Check backend logs in terminal
- Enable verbose logging in extension settings
- Open browser console (F12) for extension logs

---

## License

MIT License

---

**Built with:** FastAPI, LangChain, Python, JavaScript
