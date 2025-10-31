// Popup script for AI Agent Browser Extension

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
  
  chrome.storage.sync.set(settings, () => {
    showSettingsStatus('Settings saved successfully!', 'success');
    updateApiKeyStatus(settings.apiKey, settings.apiProvider);
  });
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
    
    // Show loading
    showLoading(true);
    hideResult();
    hideStatus();
    
    // Disable button
    const executeBtn = document.getElementById('executeAgent');
    executeBtn.disabled = true;
    
    // Get current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      
      if (!tab) {
        showLoading(false);
        executeBtn.disabled = false;
        showStatus('No active tab found', 'error');
        return;
      }
      
      // Send message to background script
      chrome.runtime.sendMessage({
        action: 'executeAgent',
        task: task
      }, (response) => {
        showLoading(false);
        executeBtn.disabled = false;
        
        if (chrome.runtime.lastError) {
          showStatus(`Error: ${chrome.runtime.lastError.message}`, 'error');
          return;
        }
        
        if (response && response.success) {
          showResult(response.result);
          showStatus('Agent execution completed!', 'success');
        } else {
          showStatus(`Error: ${response ? response.error : 'Unknown error'}`, 'error');
        }
      });
    });
  });
}

// Show status message
function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type} show`;
  
  // Auto-hide after 5 seconds for success messages
  if (type === 'success') {
    setTimeout(() => {
      statusDiv.classList.remove('show');
    }, 5000);
  }
}

// Hide status
function hideStatus() {
  const statusDiv = document.getElementById('status');
  statusDiv.classList.remove('show');
}

// Show settings status message
function showSettingsStatus(message, type) {
  const statusDiv = document.getElementById('settingsStatus');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type} show`;
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusDiv.classList.remove('show');
  }, 3000);
}

// Show/hide loading
function showLoading(show) {
  const loadingDiv = document.getElementById('loading');
  if (show) {
    loadingDiv.classList.add('show');
  } else {
    loadingDiv.classList.remove('show');
  }
}

// Show result
function showResult(result) {
  const resultDiv = document.getElementById('result');
  
  let html = '';
  
  if (result.understanding) {
    html += `<h3>Understanding:</h3><p>${escapeHtml(result.understanding)}</p>`;
  }
  
  if (result.actions && result.actions.length > 0) {
    html += `<h3>Actions Executed:</h3>`;
    result.actions.forEach((action, index) => {
      html += `<div class="action-item">
        <strong>${index + 1}. ${escapeHtml(action.type)}</strong>: ${escapeHtml(action.description)}
      </div>`;
    });
  }
  
  if (result.result) {
    html += `<h3>Result:</h3><p>${escapeHtml(result.result)}</p>`;
  }
  
  resultDiv.innerHTML = html;
  resultDiv.classList.add('show');
}

// Hide result
function hideResult() {
  const resultDiv = document.getElementById('result');
  resultDiv.classList.remove('show');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
