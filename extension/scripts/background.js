// Background service worker for AI Agent Browser Extension

// Global variable to track active requests
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 1;

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'executeAgent') {
    handleAgentExecution(request.task, sender.tab ? sender.tab.id : null)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'analyzeContent') {
    analyzePageContent(request.content, request.task)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Handle agent execution
async function handleAgentExecution(task, tabId) {
  try {
    if (!tabId) {
      // Get active tab if not provided
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs || tabs.length === 0) {
        throw new Error('No active tab found');
      }
      tabId = tabs[0].id;
    }
    
    // Get settings
    const settings = await getSettings();
    
    // Get page content from content script
    let pageData;
    try {
      const response = await chrome.tabs.sendMessage(tabId, { 
        action: 'getPageInfo',
        settings: settings
      });
      
      if (!response.success) {
        console.warn('Failed to get page information from content script, using basic page data:', response.error);
        // Create basic page data as fallback
        const tab = await chrome.tabs.get(tabId);
        pageData = {
          url: tab.url || 'unknown',
          title: tab.title || 'Unknown',
          text: 'Page content could not be retrieved. This may happen on restricted pages (Chrome settings, extensions, etc.) or if the content script failed to load.',
          interactiveElements: [],
          forms: [],
          links: [],
          error: 'Content script unavailable - using basic page info'
        };
      } else {
        pageData = response.data;
      }
    } catch (error) {
      console.warn('Content script communication failed, using basic page data:', error.message);
      // Create basic page data as fallback when content script is not available
      const tab = await chrome.tabs.get(tabId);
      pageData = {
        url: tab.url || 'unknown',
        title: tab.title || 'Unknown',
        text: 'Page content could not be retrieved from the content script',
        interactiveElements: [],
        forms: [],
        links: []
      };
    }
    
    // Format config for the backend - the base_url should point to Ollama API, not the task endpoint
    const config = {
      api_key: settings.apiKey,
      model: settings.modelName || 'qwen2.5:0.5b',
      base_url: 'http://localhost:11434/v1', // Ollama API endpoint for the LLM
      personality: settings.agentPersonality || 'a helpful and friendly AI browsing assistant'
    };
    
    // Call the backend API directly
    const result = await callBackendAPI(task, pageData, config);
    
    // Limit actions based on settings
    if (result.actions && result.actions.length > settings.maxActions) {
      result.actions = result.actions.slice(0, settings.maxActions);
    }
    
    // Execute actions based on analysis (only if page is on a regular website, not extension/internal pages)
    const tab = await chrome.tabs.get(tabId);
    if (result.actions && result.actions.length > 0 && 
        tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
      for (const action of result.actions) {
        try {
          await chrome.tabs.sendMessage(tabId, { 
            action: 'executeAction', 
            actionData: action,
            settings: settings
          });
          // Wait between actions
          await new Promise(resolve => setTimeout(resolve, settings.actionDelay));
        } catch (actionError) {
          console.warn('Failed to execute action:', actionError.message);
          // Continue with other actions even if one fails
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error in handleAgentExecution:', error);
    throw error; // Re-throw to be handled by the caller
  }
}

// Call backend API for agent processing
async function callBackendAPI(task, page_data, config) {
  try {
    // The backend expects the format: { task, page_data, config, session_id }
    const requestBody = {
      task: task,
      page_data: page_data,
      config: config,
      session_id: 'default'
    };
    
    // Get settings to use the correct backend URL
    const settings = await getSettings();
    // Use the user-configured API endpoint for custom provider
    let backendUrl = 'http://localhost:8001/api/task';
    if (settings.apiProvider === 'custom' && settings.apiEndpoint) {
      // For custom provider, expect the apiEndpoint to be the complete task endpoint
      // If it ends with a slash, append 'api/task', otherwise append '/api/task'
      if (settings.apiEndpoint.endsWith('/')) {
        backendUrl = settings.apiEndpoint + 'api/task';
      } else {
        backendUrl = settings.apiEndpoint + '/api/task';
      }
    }
    
    console.log('AI Agent - Backend Request:', requestBody);
    console.log('AI Agent - Using Backend URL:', backendUrl);
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Agent - Backend Error Response:', errorText);
      throw new Error(`Backend API request failed (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    console.log('AI Agent - Backend Response:', result);
    
    return result;
  } catch (error) {
    console.error('Error calling backend API:', error);
    if (error.name === 'AbortError') {
      throw new Error('Backend API call timed out after 30 seconds. Please check if the backend server is still running.');
    }
    throw new Error(`Backend API call failed: ${error.message}`);
  }
}

// Legacy analyzePageContent function (kept for compatibility but not used in new flow)
async function analyzePageContent(pageData, task, settings) {
  if (!settings) {
    settings = await getSettings();
  }
  
  if (!settings.apiKey) {
    throw new Error('API key not configured. Please set it in the extension settings.');
  }
  
  // Get web search results if needed
  let webSearchContext = '';
  if (settings.enableWebSearch && needsWebSearch(task)) {
    try {
      const searchResults = await performWebSearch(task);
      webSearchContext = `\n\nWeb Search Results:\n${searchResults}`;
    } catch (error) {
      console.warn('Web search failed:', error.message);
    }
  }
  
  const prompt = `You are ${settings.agentPersonality || 'a helpful and friendly AI browsing assistant'}. 
You are currently on a webpage and the user needs your help.

=== CURRENT PAGE CONTEXT ===
URL: ${pageData.url}
Title: ${pageData.title}
Main Content: ${pageData.text.substring(0, settings.maxTextLength)}

Interactive Elements Available:
${JSON.stringify(pageData.interactiveElements.slice(0, Math.min(20, settings.maxElements)), null, 2)}

Page Summary: ${generatePageSummary(pageData)}
${webSearchContext}

=== USER REQUEST ===
${task}

=== YOUR TASK ===
Based on the page context above and the user's request, determine what actions to take.

Respond with a JSON object containing:
1. "understanding": Your friendly explanation of what you see and understand about the user's request
2. "actions": Array of actions to take (can be empty if just providing information), each with:
   - "type": "click" | "type" | "scroll" | "navigate" | "wait" | "extract"
   - "selector": CSS selector for the element (for click/type actions)
   - "value": Value to type (for type actions) or URL (for navigate)
   - "description": What this action does
3. "result": Your helpful response to the user, explaining what you did or found

Example responses:

1. Action-based:
{
  "understanding": "I can see this is a search page. I'll help you search for AI agents!",
  "actions": [
    {"type": "type", "selector": "input[name='q']", "value": "AI agents", "description": "Type search query"},
    {"type": "click", "selector": "button[type='submit']", "description": "Click search button"}
  ],
  "result": "I've searched for 'AI agents' for you. The results should appear shortly!"
}

2. Information-based (no actions needed):
{
  "understanding": "You're asking about the page content. Let me tell you what I see!",
  "actions": [],
  "result": "This page is about [topic]. The main points are: [summary]. Is there anything specific you'd like me to do?"
}

Be conversational and helpful! Respond ONLY with valid JSON, no additional text.`;

  try {
    const apiConfig = getApiConfig(settings);
    
    if (settings.verboseLogging) {
      console.log('AI Agent - API Request:', {
        provider: settings.apiProvider,
        endpoint: apiConfig.endpoint,
        model: apiConfig.model
      });
    }
    
    const requestBody = {
      model: apiConfig.model,
      messages: [
        { role: 'system', content: 'You are an AI agent that analyzes webpages and determines actions. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: settings.temperature,
      max_tokens: settings.maxTokens
    };
    
    if (settings.verboseLogging) {
      console.log('AI Agent - Request body:', JSON.stringify(requestBody, null, 2));
    }
    
    const response = await fetch(apiConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      if (settings.verboseLogging) {
        console.error('AI Agent - API Error Response:', errorText);
      }
      throw new Error(`API request failed (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    if (settings.verboseLogging) {
      console.log('AI Agent - API Response:', content);
    }
    
    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return JSON.parse(content);
  } catch (error) {
    console.error('Error calling AI API:', error);
    
    // Provide helpful error messages
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error(`Cannot connect to ${apiConfig.endpoint}. Please check:\n1. Is your local server running?\n2. Is the endpoint URL correct?\n3. For local models: CORS must be enabled (see LOCAL_MODELS.md)`);
    }
    
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}

// Get settings from storage
async function getSettings() {
  return new Promise((resolve) => {
    const defaultSettings = {
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
    
    chrome.storage.sync.get(Object.keys(defaultSettings), (result) => {
      resolve({ ...defaultSettings, ...result });
    });
  });
}

// Check if task needs web search
function needsWebSearch(task) {
  const searchKeywords = [
    'search for', 'look up', 'find information about',
    'what is', 'who is', 'when did', 'where is',
    'tell me about', 'information on', 'latest news',
    'current', 'recent', 'today', 'now'
  ];
  
  const taskLower = task.toLowerCase();
  return searchKeywords.some(keyword => taskLower.includes(keyword));
}

// Perform web search using DuckDuckGo
async function performWebSearch(query) {
  try {
    // Use DuckDuckGo Instant Answer API (no key required)
    const searchQuery = encodeURIComponent(query);
    const response = await fetch(`https://api.duckduckgo.com/?q=${searchQuery}&format=json&no_html=1&skip_disambig=1`);
    
    if (!response.ok) {
      throw new Error('Search failed');
    }
    
    const data = await response.json();
    let results = [];
    
    // Get abstract
    if (data.Abstract) {
      results.push(`Summary: ${data.Abstract}`);
    }
    
    // Get related topics
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      const topics = data.RelatedTopics
        .filter(t => t.Text)
        .slice(0, 3)
        .map(t => t.Text);
      if (topics.length > 0) {
        results.push(`Related: ${topics.join('; ')}`);
      }
    }
    
    return results.length > 0 ? results.join('\n') : 'No additional information found';
  } catch (error) {
    console.error('Web search error:', error);
    return '';
  }
}

// Generate page summary
function generatePageSummary(pageData) {
  const summary = [];
  
  // Page type detection
  if (pageData.forms && pageData.forms.length > 0) {
    summary.push('This page has forms for user input');
  }
  
  if (pageData.links && pageData.links.length > 10) {
    summary.push('This is a navigation-heavy page with many links');
  }
  
  if (pageData.interactiveElements) {
    const buttons = pageData.interactiveElements.filter(e => e.type === 'button').length;
    const inputs = pageData.interactiveElements.filter(e => e.type === 'input').length;
    
    if (buttons > 0) summary.push(`${buttons} buttons available`);
    if (inputs > 0) summary.push(`${inputs} input fields available`);
  }
  
  return summary.length > 0 ? summary.join(', ') : 'Standard webpage';
}

// Get API configuration based on provider
function getApiConfig(settings) {
  const providers = {
    openai: {
      endpoint: 'https://api.openai.com/v1/chat/completions',
      model: settings.modelName || 'gpt-4'
    },
    deepseek: {
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
      model: settings.modelName || 'deepseek-chat'
    },
    qwen: {
      endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      model: settings.modelName || 'qwen-plus'
    },
    custom: {
      endpoint: settings.apiEndpoint || 'https://api.openai.com/v1/chat/completions',
      model: settings.modelName || 'gpt-4'
    }
  };
  
  return providers[settings.apiProvider] || providers.openai;
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Agent Browser Extension installed');
});

// Listen for browser action click to toggle sidebar
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Toggle sidebar on the current tab
    await chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
  } catch (error) {
    // If content script is not available on this tab (e.g. chrome:// URLs), show a notification
    console.log('Could not toggle sidebar on this page:', error.message);
    // Optionally, you could open a new tab with a special UI for unsupported pages
  }
});
