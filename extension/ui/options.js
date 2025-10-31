// Options page script for AI Agent Browser Extension

// Default settings
const DEFAULT_SETTINGS = {
  apiProvider: 'openai',
  apiKey: '',
  apiEndpoint: '',
  modelName: '',
  temperature: 0.7,
  maxTokens: 1500,
  actionDelay: 500,
  maxActions: 10,
  highlightElements: true,
  autoScroll: true,
  verboseLogging: false,
  maxElements: 50,
  maxTextLength: 5000,
  agentPersonality: 'a helpful and friendly AI browsing assistant',
  enableWebSearch: true,
  autoAnalyzePage: true
};

// Provider information
const PROVIDER_INFO = {
  openai: 'OpenAI GPT-4 - Most capable model. Get API key at platform.openai.com',
  deepseek: 'DeepSeek - Cost-effective alternative. Get API key at platform.deepseek.com',
  qwen: 'Alibaba Qwen via DashScope - Chinese AI model. Get API key at dashscope.aliyun.com',
  custom: 'Use any OpenAI-compatible API endpoint (e.g., local LLM, proxy service)'
};

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize tabs
  initializeTabs();
  
  // Load settings
  await loadSettings();
  
  // Initialize sliders
  initializeSliders();
  
  // Event listeners
  document.getElementById('executeAgent').addEventListener('click', executeAgent);
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('resetSettings').addEventListener('click', resetSettings);
  document.getElementById('apiProvider').addEventListener('change', onProviderChange);
  
  // Load saved task if any
  chrome.storage.local.get(['lastTask'], (result) => {
    if (result.lastTask) {
      document.getElementById('task').value = result.lastTask;
    }
  });
});

// Initialize tab switching
function initializeTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      const tabName = tab.getAttribute('data-tab');
      document.getElementById(tabName + 'Tab').classList.add('active');
    });
  });
}

// Initialize sliders with value display
function initializeSliders() {
  // Temperature slider
  const tempSlider = document.getElementById('temperature');
  const tempValue = document.getElementById('temperatureValue');
  tempSlider.addEventListener('input', (e) => {
    tempValue.textContent = (e.target.value / 10).toFixed(1);
  });
  
  // Max tokens slider
  const tokensSlider = document.getElementById('maxTokens');
  const tokensValue = document.getElementById('maxTokensValue');
  tokensSlider.addEventListener('input', (e) => {
    tokensValue.textContent = e.target.value;
  });
  
  // Action delay slider
  const delaySlider = document.getElementById('actionDelay');
  const delayValue = document.getElementById('actionDelayValue');
  delaySlider.addEventListener('input', (e) => {
    delayValue.textContent = e.target.value + 'ms';
  });
  
  // Max actions slider
  const actionsSlider = document.getElementById('maxActions');
  const actionsValue = document.getElementById('maxActionsValue');
  actionsSlider.addEventListener('input', (e) => {
    actionsValue.textContent = e.target.value;
  });
  
  // Max elements slider
  const elementsSlider = document.getElementById('maxElements');
  const elementsValue = document.getElementById('maxElementsValue');
  elementsSlider.addEventListener('input', (e) => {
    elementsValue.textContent = e.target.value;
  });
  
  // Max text length slider
  const textSlider = document.getElementById('maxTextLength');
  const textValue = document.getElementById('maxTextLengthValue');
  textSlider.addEventListener('input', (e) => {
    textValue.textContent = e.target.value;
  });
  
  // Set initial values
  tempValue.textContent = (tempSlider.value / 10).toFixed(1);
  tokensValue.textContent = tokensSlider.value;
  delayValue.textContent = delaySlider.value + 'ms';
  actionsValue.textContent = actionsSlider.value;
  elementsValue.textContent = elementsSlider.value;
  textValue.textContent = textSlider.value;
}

// Load settings from storage
async function loadSettings() {
  chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS), (result) => {
    const settings = { ...DEFAULT_SETTINGS, ...result };
    
    // Populate form fields
    document.getElementById('apiProvider').value = settings.apiProvider;
    document.getElementById('apiKey').value = settings.apiKey;
    document.getElementById('apiEndpoint').value = settings.apiEndpoint;
    document.getElementById('modelName').value = settings.modelName;
    document.getElementById('temperature').value = settings.temperature * 10;
    document.getElementById('temperatureValue').textContent = settings.temperature.toFixed(1);
    document.getElementById('maxTokens').value = settings.maxTokens;
    document.getElementById('maxTokensValue').textContent = settings.maxTokens;
    document.getElementById('actionDelay').value = settings.actionDelay;
    document.getElementById('actionDelayValue').textContent = settings.actionDelay + 'ms';
    document.getElementById('maxActions').value = settings.maxActions;
    document.getElementById('maxActionsValue').textContent = settings.maxActions;
    document.getElementById('highlightElements').checked = settings.highlightElements;
    document.getElementById('autoScroll').checked = settings.autoScroll;
    document.getElementById('verboseLogging').checked = settings.verboseLogging;
    document.getElementById('maxElements').value = settings.maxElements;
    document.getElementById('maxElementsValue').textContent = settings.maxElements;
    document.getElementById('maxTextLength').value = settings.maxTextLength;
    document.getElementById('maxTextLengthValue').textContent = settings.maxTextLength;
    document.getElementById('agentPersonality').value = settings.agentPersonality;
    document.getElementById('enableWebSearch').checked = settings.enableWebSearch;
    document.getElementById('autoAnalyzePage').checked = settings.autoAnalyzePage;
    
    // Update UI based on provider
    onProviderChange();
    
    // Update API key status
    updateApiKeyStatus(settings.apiKey, settings.apiProvider);
  });
}

// Save settings to storage
async function saveSettings() {
  const settings = {
    apiProvider: document.getElementById('apiProvider').value,
    apiKey: document.getElementById('apiKey').value.trim(),
    apiEndpoint: document.getElementById('apiEndpoint').value.trim(),
    modelName: document.getElementById('modelName').value.trim(),
    temperature: parseFloat(document.getElementById('temperature').value) / 10,
    maxTokens: parseInt(document.getElementById('maxTokens').value),
    actionDelay: parseInt(document.getElementById('actionDelay').value),
    maxActions: parseInt(document.getElementById('maxActions').value),
    highlightElements: document.getElementById('highlightElements').checked,
    autoScroll: document.getElementById('autoScroll').checked,
    verboseLogging: document.getElementById('verboseLogging').checked,
    maxElements: parseInt(document.getElementById('maxElements').value),
    maxTextLength: parseInt(document.getElementById('maxTextLength').value),
    agentPersonality: document.getElementById('agentPersonality').value.trim(),
    enableWebSearch: document.getElementById('enableWebSearch').checked,
    autoAnalyzePage: document.getElementById('autoAnalyzePage').checked
  };
  
  // Validate API key
  if (!settings.apiKey) {
    showSettingsStatus('Please enter an API key', 'error');
    return;
  }
  
  // Validate custom endpoint
  if (settings.apiProvider === 'custom' && !settings.apiEndpoint) {
    showSettingsStatus('Please enter a custom API endpoint', 'error');
    return;
  }
  
  // Save settings first
  chrome.storage.sync.set(settings, () => {
    // After saving settings, then do the connection test
    setTimeout(async () => {
      showSettingsStatus('Settings saved successfully! Testing connection... (This may take up to 30 seconds for local models)', 'info');
      
      try {
        // First test if backend is reachable 
        const backendReachable = await testBackendReachability();
        if (!backendReachable) {
          showSettingsStatus('❌ Backend server not reachable. Please ensure the backend server is running. Check the terminal where you started it.', 'error');
          updateApiKeyStatus(settings.apiKey, settings.apiProvider);
          return;
        }
        
        // Test the API connection
        // Create a timeout promise - extend timeout for local models (30 seconds to be safe)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection test timed out after 30 seconds. Local models may take longer to respond on first request as they need to load.')), 30000);
        });
        
        // Create the API test promise
        const apiTestPromise = testApiConnection(settings);
        
        // Race the promises to implement timeout
        const result = await Promise.race([apiTestPromise, timeoutPromise]);
        
        if (result.success) {
          showSettingsStatus('✅ Connection test successful! API is responding. First query to local models may take longer as the model loads.', 'success');
        } else {
          showSettingsStatus(`❌ Connection test failed: ${result.error}`, 'error');
        }
      } catch (error) {
        showSettingsStatus(`❌ Connection test failed: ${error.message}`, 'error');
      }
      
      updateApiKeyStatus(settings.apiKey, settings.apiProvider);
    }, 100); // Small delay to ensure settings are saved
  });
}

// Test if backend is reachable
async function testBackendReachability() {
  // Get current settings to use the correct endpoint
  const settings = await new Promise(resolve => {
    chrome.storage.sync.get(['apiProvider', 'apiEndpoint'], resolve);
  });
  
  // Determine the correct backend URL based on provider
  let backendUrl = 'http://localhost:8001/';
  if (settings.apiProvider === 'custom' && settings.apiEndpoint) {
    // Use the user's configured endpoint
    if (settings.apiEndpoint.endsWith('/')) {
      backendUrl = settings.apiEndpoint;
    } else {
      backendUrl = settings.apiEndpoint + '/';
    }
  }
  
  try {
    // Try a simple GET request to the base URL with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Backend reachability test failed:', error);
    // Also try the docs endpoint which might be available
    try {
      const docsUrl = backendUrl.endsWith('/') ? backendUrl + 'docs' : backendUrl + '/docs';
      const docsController = new AbortController();
      const docsTimeoutId = setTimeout(() => docsController.abort(), 5000); // 5 second timeout
      
      const docsResponse = await fetch(docsUrl, {
        method: 'GET',
        signal: docsController.signal
      });
      
      clearTimeout(docsTimeoutId);
      return docsResponse.ok;
    } catch (docsError) {
      console.error('Backend docs reachability test also failed:', docsError);
      return false;
    }
  }
}

// Test API connection
async function testApiConnection(settings) {
  // Use the user-configured API endpoint for custom provider
  let testUrl = 'http://localhost:8001/api/task';
  if (settings.apiProvider === 'custom' && settings.apiEndpoint) {
    // For custom provider, expect the apiEndpoint to be the base URL
    // If it ends with a slash, append 'api/task', otherwise append '/api/task'
    if (settings.apiEndpoint.endsWith('/')) {
      testUrl = settings.apiEndpoint + 'api/task';
    } else {
      testUrl = settings.apiEndpoint + '/api/task';
    }
  }
  
  // Create a minimal page_data for the test
  const testData = {
    url: 'test://extension.test',
    title: 'Test Connection',
    text: 'Test page for API connection verification',
    interactiveElements: []
  };
  
  // Format config for backend - using 'ollama' as API key for local models
  const config = {
    api_key: settings.apiKey || 'ollama',  // Use 'ollama' if no API key provided (for local models)
    model: settings.modelName || 'qwen2.5',  // Use the model specified in settings
    base_url: settings.apiEndpoint || 'http://localhost:11434/v1',  // Default to Ollama if not specified
    personality: settings.agentPersonality || 'a helpful and friendly AI browsing assistant'
  };
  
  console.log('Testing API connection to:', testUrl, 'with config:', config);
  
  try {
    const requestBody = {
      task: "Just say 'Connection successful' - this is a test to verify API connectivity",
      page_data: testData,
      config: config,
      session_id: 'test-connection'
    };
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API test failed (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    return { success: true, result };
  } catch (error) {
    console.error('API connection test failed:', error);
    return { success: false, error: error.message };
  }
}

// Reset settings to defaults
async function resetSettings() {
  if (!confirm('Are you sure you want to reset all settings to defaults? Your API key will be preserved.')) {
    return;
  }
  
  chrome.storage.sync.get(['apiKey', 'apiProvider'], (result) => {
    const resetSettings = {
      ...DEFAULT_SETTINGS,
      apiKey: result.apiKey || '',
      apiProvider: result.apiProvider || 'openai'
    };
    
    chrome.storage.sync.set(resetSettings, () => {
      loadSettings();
      showSettingsStatus('Settings reset to defaults', 'success');
    });
  });
}

// Handle provider change
function onProviderChange() {
  const provider = document.getElementById('apiProvider').value;
  const customEndpointGroup = document.getElementById('customEndpointGroup');
  const providerInfo = document.getElementById('providerInfo');
  
  // Show/hide custom endpoint field
  if (provider === 'custom') {
    customEndpointGroup.style.display = 'block';
  } else {
    customEndpointGroup.style.display = 'none';
  }
  
  // Show provider info
  providerInfo.textContent = PROVIDER_INFO[provider];
  providerInfo.classList.add('show');
}

// Update API key status display
function updateApiKeyStatus(apiKey, provider) {
  const statusDiv = document.getElementById('apiKeyStatus');
  const providerNames = {
    openai: 'OpenAI',
    deepseek: 'DeepSeek',
    qwen: 'Qwen',
    custom: 'Custom API'
  };
  
  if (apiKey) {
    statusDiv.textContent = `${providerNames[provider]} API: Configured ✓`;
    statusDiv.className = 'api-key-status configured';
  } else {
    statusDiv.textContent = 'API Key: Not configured (required for AI features)';
    statusDiv.className = 'api-key-status not-configured';
  }
}

// Execute AI agent
async function executeAgent() {
  const task = document.getElementById('task').value.trim();
  
  if (!task) {
    showStatus('Please enter a task for the AI agent', 'error');
    return;
  }
  
  // Check if API key is configured
  chrome.storage.sync.get(['apiKey'], (result) => {
    if (!result.apiKey) {
      showStatus('Please configure your API key in Settings tab first', 'error');
      return;
    }
    
    // Save task for next time
    chrome.storage.local.set({ lastTask: task });
    
    // Show status
    showStatus('Task sent to background. Use the sidebar to interact with the agent.', 'info');
    
    // In a real implementation, this would send the task to the background script
    // For the options page, we'll just show a message
    setTimeout(() => {
      showStatus('Agent would execute on the current page. Open the extension on a webpage to use.', 'info');
    }, 2000);
  });
}

// Show status message
function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type} show`;
  
  // Auto-hide after 5 seconds for success messages
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      statusDiv.classList.remove('show');
    }, 5000);
  }
}

// Show settings status message
function showSettingsStatus(message, type) {
  const statusDiv = document.getElementById('settingsStatus');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type} show`;
  
  // Auto-hide after 5 seconds for better visibility, except for info messages which last longer
  const timeoutDuration = type === 'info' ? 8000 : 5000;
  setTimeout(() => {
    statusDiv.classList.remove('show');
  }, timeoutDuration);
}