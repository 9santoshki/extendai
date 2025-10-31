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