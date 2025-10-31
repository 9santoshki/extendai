// Sidebar script for AI Agent Browser Extension

document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const closeBtn = document.getElementById('closeSidebar');
  const settingsBtn = document.getElementById('settingsBtn');
  const chatContainer = document.getElementById('chatContainer');
  
  // Event listeners
  sendBtn.addEventListener('click', sendMessage);
  closeBtn.addEventListener('click', closeSidebar);
  settingsBtn.addEventListener('click', openSettings);
  
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
});

// Open settings page
function openSettings() {
  window.open(chrome.runtime.getURL('ui/options.html'), '_blank');
}

// Send message to AI agent
async function sendMessage() {
  const chatInput = document.getElementById('chatInput');
  const message = chatInput.value.trim();
  
  if (!message) return;
  
  // Clear input
  chatInput.value = '';
  
  // Add user message to chat
  addMessage('user', message);
  
  // Show typing indicator
  showTypingIndicator();
  
  // Disable send button
  const sendBtn = document.getElementById('sendBtn');
  sendBtn.disabled = true;
  
  try {
    // Send message to background script - the background script will handle getting page data
    const response = await chrome.runtime.sendMessage({
      action: 'executeAgent',
      task: message
    });
    
    // Remove typing indicator
    removeTypingIndicator();
    
    if (response.success) {
      // Add agent response with proper formatting
      addMessage('agent', response.result); // response.result is already a structured object
    } else {
      addMessage('agent', `Error: ${response.error}`, true);
    }
  } catch (error) {
    removeTypingIndicator();
    console.error('Sidebar error:', error); // Add console logging for debugging
    // Check if it's a configuration error
    if (error.message.includes('API key') || error.message.includes('configured')) {
      addMessage('agent', `Configuration Issue: ${error.message}. Please check your settings using the gear icon.`, true);
    } else if (error.message.includes('Failed to get page information')) {
      addMessage('agent', `Communication Issue: Cannot access page information. This may happen on restricted pages like Chrome settings. Try on a regular website.`, true);
    } else if (error.message.includes('Extension context invalidated')) {
      addMessage('agent', `Connection Issue: Extension was recently updated. Please reload the page or reopen the sidebar.`, true);
    } else {
      addMessage('agent', `Error: ${error.message || 'Unknown error occurred'}. Please check your settings and backend status.`, true);
    }
  } finally {
    sendBtn.disabled = false;
  }
}

// Add message to chat
function addMessage(sender, text, isError = false) {
  const chatContainer = document.getElementById('chatContainer');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  if (isError) {
    contentDiv.classList.add('error-message');
  }
  
  // Better format the AI response
  let formattedText = escapeHtml(text);
  
  // Format for AI agent responses - try to parse as potential JSON response
  try {
    if (typeof text === 'string' && (text.includes('understanding') || text.includes('actions') || text.includes('result'))) {
      // Try to parse as JSON response from backend
      const response = JSON.parse(text);
      formattedText = formatAgentResponse(response);
    } else if (typeof text === 'object') {
      formattedText = formatAgentResponse(text);
    }
  } catch (e) {
    // If it's not JSON, just format the plain text
    formattedText = formatTextResponse(text);
  }
  
  contentDiv.innerHTML = formattedText;
  
  messageDiv.appendChild(contentDiv);
  
  const timeDiv = document.createElement('div');
  timeDiv.className = 'message-time';
  timeDiv.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  messageDiv.appendChild(timeDiv);
  
  chatContainer.appendChild(messageDiv);
  
  // Scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Format agent response object to show only the final result in a compact, user-friendly way
function formatAgentResponse(response) {
  // Show only the final result, which is the most important information for the user
  if (response.result) {
    return `<div class="simple-response">${escapeHtml(response.result)}</div>`;
  }
  
  // If no result but there's understanding, use that as the main response
  if (response.understanding) {
    return `<div class="simple-response">${escapeHtml(response.understanding)}</div>`;
  }
  
  // Fallback to showing the full response as JSON if no specific result is available
  return `<div class="simple-response">${escapeHtml(JSON.stringify(response, null, 2))}</div>`;
}

function formatTextResponse(text) {
  // Convert newlines to <br> and paragraphs
  return escapeHtml(text).replace(/\n\s*\n/g, '</p><p>').replace(/\n/g, '<br>');
}

// Show typing indicator
function showTypingIndicator() {
  const chatContainer = document.getElementById('chatContainer');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message agent';
  typingDiv.id = 'typingIndicator';
  
  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  indicator.innerHTML = '<span></span><span></span><span></span>';
  
  typingDiv.appendChild(indicator);
  chatContainer.appendChild(typingDiv);
  
  // Scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
  const typingIndicator = document.getElementById('typingIndicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Close sidebar
function closeSidebar() {
  window.parent.postMessage({ action: 'closeSidebar' }, '*');
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}