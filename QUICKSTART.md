# Quick Start Guide

Get up and running in 5 minutes.

## Step 1: Backend Setup (2 minutes)

```bash
cd backend
./setup-qwen.sh  # Installs everything automatically
./start.sh       # Starts the server
```

**What this does:**
- Checks Ollama installation
- Installs Qwen2.5 model
- Configures backend
- Installs Python dependencies

## Step 2: Extension Setup (1 minute)

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select `extension` folder
5. Click the extension icon

## Step 3: Configure (1 minute)

In extension popup → **Settings** tab:

```
AI Provider: Custom OpenAI-Compatible API
API Key: ollama
Custom API Endpoint: http://localhost:8000/api/task
Model Name: qwen2.5
```

Click **Save All Settings**

## Step 4: Test (1 minute)

1. Go to any webpage (e.g., google.com)
2. Open extension
3. Type: "What is this page about?"
4. Press Enter

Done! 🎉

---

## Troubleshooting

**Backend won't start:**
```bash
ollama serve  # Start Ollama first
```

**Extension can't connect:**
- Check backend is running: `curl http://localhost:8000/health`
- Verify endpoint URL in settings

**Slow responses:**
- Normal for local models
- Use smaller model: `ollama pull qwen2.5:7b`

---

## Using Cloud APIs Instead

### OpenAI

Backend `.env`:
```env
OPENAI_API_KEY=sk-your-key
MODEL_NAME=gpt-4
BASE_URL=
```

Extension settings:
```
API Key: sk-your-key
Endpoint: http://localhost:8000/api/task
Model: gpt-4
```

### DeepSeek

Backend `.env`:
```env
OPENAI_API_KEY=your-key
MODEL_NAME=deepseek-chat
BASE_URL=https://api.deepseek.com/v1
```

---

## Next Steps

- Try different tasks: "Search for X", "Fill this form", "Extract data"
- Customize agent personality in settings
- Enable web search for real-time information
- Check multi-tab support (chat persists per tab)

---

**Need help?** Check README.md for detailed documentation.
