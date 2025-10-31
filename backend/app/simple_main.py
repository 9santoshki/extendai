"""
Simple FastAPI backend for AI Agent Browser Extension
Focuses on content extraction and delivery
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import re

app = FastAPI(
    title="AI Agent Simple Backend",
    description="Lightweight backend for content extraction",
    version="1.0.0"
)

# CORS middleware - allow Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

class PageData(BaseModel):
    url: str
    title: str
    text: str
    interactiveElements: List[Dict[str, Any]]

class AgentConfig(BaseModel):
    api_key: str
    model: str
    base_url: Optional[str] = None
    personality: str

class TaskRequest(BaseModel):
    task: str
    page_data: PageData
    config: AgentConfig
    session_id: str

class TaskResponse(BaseModel):
    understanding: str
    actions: List[Dict[str, Any]]
    result: str
    agent_insights: Dict[str, Any]
    timestamp: str
    session_id: str

def extract_headlines(page_data: Dict) -> str:
    """Extract and format headlines from page data"""
    interactive_elements = page_data.get('interactiveElements', [])
    headlines = []
    
    # Extract headlines from h2 and h3 elements
    for element in interactive_elements:
        if element.get('type') in ['h2', 'h3'] and element.get('text'):
            text = element.get('text', '').strip()
            if text and len(text) > 10:  # Filter out very short texts
                headlines.append(text)
    
    # Format headlines if found
    if headlines:
        formatted = "Top Headlines:\n"
        for i, headline in enumerate(headlines[:5], 1):  # Limit to top 5
            formatted += f"{i}. {headline}\n"
        return formatted.strip()
    
    return "No headlines found on this page."

def extract_summary(page_data: Dict) -> str:
    """Extract a simple summary from page data"""
    title = page_data.get('title', '')
    text = page_data.get('text', '')
    
    # Take first 200 characters as summary
    summary_text = text[:200] + "..." if len(text) > 200 else text
    
    return f"This page is about: {title}\n\nSummary: {summary_text}"

def process_task_simple(task: str, page_data: Dict) -> Dict[str, Any]:
    """Process task with simple content extraction"""
    task_lower = task.lower()
    
    # Check if there's an error in the page data
    if 'error' in page_data:
        return {
            "understanding": "The content script could not access the page. This often happens on restricted pages like Chrome settings or extension pages.",
            "actions": [],
            "result": f"Content Access Error: {page_data.get('text', 'Could not retrieve page content')}. Try using the agent on a regular website instead of restricted Chrome pages.",
            "agent_insights": {
                "approach": "Error handling",
                "steps": ["Identify content access issue", "Provide helpful error message"],
                "risks": ["Content script unavailable on restricted pages"]
            }
        }
    
    if any(keyword in task_lower for keyword in ['headline', 'news', 'top story', 'breaking']):
        result = extract_headlines(page_data)
        understanding = "User wants to see the top headlines from this page"
    elif any(keyword in task_lower for keyword in ['summar', 'about', 'what is']):
        result = extract_summary(page_data)
        understanding = "User wants a summary of this page"
    else:
        # Check if we have meaningful page data
        if page_data.get('text', '').startswith('Page content could not be retrieved'):
            result = "I cannot access the content of this page. This typically happens on restricted pages like Chrome settings or extension pages. Try using the agent on a regular website."
            understanding = "User is on a restricted page where content access is limited"
        else:
            result = "I can help you with this page. Try asking for headlines or a summary."
            understanding = "User has a general question about the page"
    
    return {
        "understanding": understanding,
        "actions": [],
        "result": result,
        "agent_insights": {
            "approach": "Direct content extraction",
            "steps": ["Analyze page data", "Extract relevant content", "Format for user"],
            "risks": []
        }
    }

@app.get("/")
async def root():
    return {
        "service": "AI Agent Simple Backend",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "active_sessions": 0,
        "timestamp": "2025-10-30T16:30:00.000000"
    }

@app.post("/api/task", response_model=TaskResponse)
async def process_task(request: TaskRequest):
    """Process a task with simple content extraction"""
    try:
        # Process task with simple extraction
        result_data = process_task_simple(request.task, request.page_data.dict())
        
        return TaskResponse(
            understanding=result_data["understanding"],
            actions=result_data["actions"],
            result=result_data["result"],
            agent_insights=result_data["agent_insights"],
            timestamp="2025-10-30T16:30:00.000000",
            session_id=request.session_id
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)