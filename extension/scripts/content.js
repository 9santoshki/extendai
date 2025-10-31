// Content script for AI Agent Browser Extension
// This script runs on every webpage and enables the AI to interact with page elements

let sidebarIframe = null;
let isAgentActive = false;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageInfo') {
    getPageInfo(request.settings)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'executeAction') {
    executeAction(request.actionData, request.settings)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'toggleSidebar') {
    toggleSidebar();
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === 'highlightElement') {
    highlightElement(request.selector);
    sendResponse({ success: true });
    return true;
  }
});

// Get comprehensive page information
async function getPageInfo(settings) {
  try {
    const maxElements = settings ? settings.maxElements : 50;
    const maxTextLength = settings ? settings.maxTextLength : 5000;
    
    // Check if we're on a restricted page where content scripts might not work
    if (window.location.protocol === 'chrome:' || 
        window.location.protocol === 'chrome-extension:' ||
        window.location.hostname === 'chrome.google.com') {
      throw new Error('Content scripts are not allowed on Chrome internal pages');
    }
    
    const pageData = {
      url: window.location.href,
      title: document.title,
      text: getPageText(maxTextLength),
      interactiveElements: getInteractiveElements(maxElements),
      forms: getForms(),
      links: getLinks(),
      images: getImages(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollY: window.scrollY
      }
    };
    
    return pageData;
  } catch (error) {
    console.error('Content script getPageInfo failed:', error);
    throw new Error(`Failed to extract page information: ${error.message}`);
  }
}

// Extract readable text from page
function getPageText(maxLength = 5000) {
  // Remove script and style elements
  const clone = document.body.cloneNode(true);
  const scripts = clone.querySelectorAll('script, style, noscript');
  scripts.forEach(el => el.remove());
  
  return clone.innerText.trim().substring(0, maxLength);
}

// Get all interactive elements
function getInteractiveElements(maxElements = 50) {
  const elements = [];
  const selectors = [
    'button',
    'a[href]',
    'input',
    'textarea',
    'select',
    '[role="button"]',
    '[onclick]',
    '[contenteditable="true"]'
  ];
  
  document.querySelectorAll(selectors.join(',')).forEach((el, index) => {
    if (isVisible(el)) {
      elements.push({
        type: el.tagName.toLowerCase(),
        selector: generateSelector(el),
        text: el.innerText?.trim().substring(0, 100) || '',
        attributes: {
          id: el.id || '',
          class: el.className || '',
          name: el.name || '',
          type: el.type || '',
          placeholder: el.placeholder || '',
          href: el.href || '',
          value: el.value || ''
        },
        position: el.getBoundingClientRect()
      });
    }
  });
  
  return elements.slice(0, maxElements);
}

// Get all forms on the page
function getForms() {
  const forms = [];
  document.querySelectorAll('form').forEach(form => {
    const fields = [];
    form.querySelectorAll('input, textarea, select').forEach(field => {
      fields.push({
        type: field.type || field.tagName.toLowerCase(),
        name: field.name || '',
        id: field.id || '',
        placeholder: field.placeholder || '',
        required: field.required || false
      });
    });
    
    forms.push({
      action: form.action || '',
      method: form.method || 'get',
      fields: fields,
      selector: generateSelector(form)
    });
  });
  
  return forms;
}

// Get links
function getLinks() {
  const links = [];
  document.querySelectorAll('a[href]').forEach((link, index) => {
    if (isVisible(link) && links.length < 30) {
      links.push({
        text: link.innerText?.trim().substring(0, 100) || '',
        href: link.href,
        selector: generateSelector(link)
      });
    }
  });
  
  return links;
}

// Get images
function getImages() {
  const images = [];
  document.querySelectorAll('img').forEach((img, index) => {
    if (isVisible(img) && images.length < 20) {
      images.push({
        src: img.src,
        alt: img.alt || '',
        selector: generateSelector(img)
      });
    }
  });
  
  return images;
}

// Check if element is visible
function isVisible(el) {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0' &&
         el.offsetParent !== null;
}

// Generate a unique CSS selector for an element
function generateSelector(el) {
  if (el.id) {
    return `#${el.id}`;
  }
  
  if (el.className && typeof el.className === 'string') {
    const classes = el.className.trim().split(/\s+/).filter(c => c);
    if (classes.length > 0) {
      const selector = `${el.tagName.toLowerCase()}.${classes.join('.')}`;
      if (document.querySelectorAll(selector).length === 1) {
        return selector;
      }
    }
  }
  
  if (el.name) {
    const selector = `${el.tagName.toLowerCase()}[name="${el.name}"]`;
    if (document.querySelectorAll(selector).length === 1) {
      return selector;
    }
  }
  
  // Use nth-child as fallback
  let path = [];
  let current = el;
  while (current && current.tagName) {
    let selector = current.tagName.toLowerCase();
    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children);
      const index = siblings.indexOf(current) + 1;
      selector += `:nth-child(${index})`;
    }
    path.unshift(selector);
    current = current.parentElement;
    if (path.length > 5) break; // Limit depth
  }
  
  return path.join(' > ');
}

// Execute an action on the page
async function executeAction(actionData, settings) {
  const { type, selector, value, description } = actionData;
  
  const shouldHighlight = settings ? settings.highlightElements : true;
  const shouldScroll = settings ? settings.autoScroll : true;
  const verboseLogging = settings ? settings.verboseLogging : false;
  
  if (verboseLogging) {
    console.log(`AI Agent - Executing action: ${type} - ${description}`);
  }
  
  if (shouldHighlight) {
    highlightElement(selector);
  }
  
  switch (type) {
    case 'click':
      return await clickElement(selector, shouldScroll);
      
    case 'type':
      return await typeInElement(selector, value, shouldScroll);
      
    case 'scroll':
      return await scrollPage(value);
      
    case 'navigate':
      window.location.href = value;
      return { success: true, message: `Navigating to ${value}` };
      
    case 'wait':
      await new Promise(resolve => setTimeout(resolve, value || 1000));
      return { success: true, message: `Waited ${value}ms` };
      
    case 'extract':
      return await extractData(selector);
      
    default:
      throw new Error(`Unknown action type: ${type}`);
  }
}

// Click an element
async function clickElement(selector, shouldScroll = true) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  
  if (shouldScroll) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  element.click();
  return { success: true, message: `Clicked ${selector}` };
}

// Type in an element
async function typeInElement(selector, value, shouldScroll = true) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  
  if (shouldScroll) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  element.focus();
  element.value = value;
  
  // Trigger input events
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  
  return { success: true, message: `Typed "${value}" in ${selector}` };
}

// Scroll the page
async function scrollPage(direction) {
  const scrollAmount = window.innerHeight * 0.8;
  
  if (direction === 'down') {
    window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
  } else if (direction === 'up') {
    window.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
  } else if (direction === 'top') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (direction === 'bottom') {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
  
  return { success: true, message: `Scrolled ${direction}` };
}

// Extract data from element
async function extractData(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  
  return {
    success: true,
    data: {
      text: element.innerText,
      html: element.innerHTML,
      attributes: Array.from(element.attributes).reduce((acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {})
    }
  };
}

// Highlight an element temporarily
function highlightElement(selector) {
  if (!selector) return;
  
  const element = document.querySelector(selector);
  if (!element) return;
  
  const originalOutline = element.style.outline;
  const originalBackground = element.style.backgroundColor;
  
  element.style.outline = '3px solid #ff6b6b';
  element.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
  
  setTimeout(() => {
    element.style.outline = originalOutline;
    element.style.backgroundColor = originalBackground;
  }, 2000);
}

// Listen for messages from sidebar
window.addEventListener('message', (event) => {
  if (event.source !== window) return; // Only process messages from our sidebar
  
  if (event.data && event.data.action === 'closeSidebar') {
    closeSidebar();
  }
});

// Toggle sidebar
function toggleSidebar() {
  if (sidebarIframe) {
    closeSidebar();
  } else {
    createSidebar();
  }
}

// Close sidebar
function closeSidebar() {
  if (sidebarIframe) {
    sidebarIframe.remove();
    sidebarIframe = null;
    
    // Remove resize handle if it exists
    const resizeHandle = document.getElementById('sidebar-resize-handle');
    if (resizeHandle) {
      resizeHandle.remove();
    }
  }
}

// Create sidebar iframe
function createSidebar() {
  sidebarIframe = document.createElement('iframe');
  sidebarIframe.id = 'ai-agent-sidebar';
  sidebarIframe.src = chrome.runtime.getURL('ui/sidebar.html');
  sidebarIframe.style.cssText = `
    position: fixed;
    top: 0;
    right: 20px;  /* Move sidebar slightly left from the edge */
    width: 400px;  /* Further reduced width to leave more space for scrollbar */
    height: 100vh;
    min-width: 280px;  /* Minimum width */
    max-width: 70%;   /* Further reduced maximum width to leave more space for scrollbar */
    border: none;
    border-left: 2px solid #e0e0e0;
    z-index: 2147483647;
    background: white;
    box-shadow: -2px 0 10px rgba(0,0,0,0.1);
    overflow: hidden;  /* Scroll is handled by the content, not iframe itself */
  `;
  
  // Add resize handle for better UX
  const resizeHandle = document.createElement('div');
  resizeHandle.id = 'sidebar-resize-handle';
  resizeHandle.style.cssText = `
    position: absolute;
    top: 0;
    left: -5px;
    width: 5px;
    height: 100vh;
    cursor: col-resize;
    background: transparent;
    z-index: 2147483646;
  `;

  document.body.appendChild(sidebarIframe);
  document.body.appendChild(resizeHandle);

  // Add event listeners for resizing
  let isResizing = false;
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    e.preventDefault();
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    const newWidth = window.innerWidth - e.clientX;
    const minWidth = 280;
    const maxWidth = window.innerWidth * 0.65;  // Further reduced max width to leave more space for scrollbar
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      sidebarIframe.style.width = newWidth + 'px';
    }
  });

  document.addEventListener('mouseup', () => {
    isResizing = false;
    document.body.style.userSelect = '';
  });
}

console.log('AI Agent Browser Extension content script loaded');
