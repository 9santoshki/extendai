"""
FastAPI Backend for AI Agent Browser Extension
Hybrid LangChain + Multi-Agent System
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.multi_agent import create_hybrid_system, HybridMultiAgentSystem
from chains.reasoning_chains import ReasoningChains
from langchain_openai import ChatOpenAI

# Initialize FastAPI app
app = FastAPI(
    title="AI Agent Backend",
    description="Hybrid LangChain + Multi-Agent system for browser automation",
    version="2.0.0"
)

# CORS middleware - allow Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your extension ID
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state - in production, use proper session management
agent_systems: Dict[str, HybridMultiAgentSystem] = {}
reasoning_chains: Dict[str, ReasoningChains] = {}


# ============ Pydantic Models ============

class AgentConfig(BaseModel):
    """Configuration for the agent system"""
    api_key: str = Field(..., description="API key for LLM")
    chat_model: str = Field(default="gpt-4", description="Model name for chat interactions")
    reasoning_model: str = Field(default="gpt-4", description="Model name for reasoning tasks")
    base_url: Optional[str] = Field(None, description="Custom API base URL")
    personality: str = Field(
        default="a helpful and friendly AI browsing assistant",
        description="Agent personality"
    )


class PageData(BaseModel):
    """Webpage context data"""
    url: str
    title: str
    text: str
    interactiveElements: List[Dict[str, Any]]
    forms: Optional[List[Dict[str, Any]]] = []
    links: Optional[List[Dict[str, Any]]] = []


class ChatMessage(BaseModel):
    """Chat message"""
    role: str  # "user" or "agent"
    content: str
    timestamp: Optional[str] = None


class TaskRequest(BaseModel):
    """Request to process a task"""
    task: str = Field(..., description="User's task or question")
    page_data: PageData = Field(..., description="Current page context")
    chat_history: Optional[List[ChatMessage]] = Field(default=[], description="Previous conversation")
    session_id: str = Field(default="default", description="Session ID for multi-tab support")
    config: AgentConfig = Field(..., description="Agent configuration")


class TaskResponse(BaseModel):
    """Response from task processing"""
    understanding: str
    actions: List[Dict[str, Any]]
    result: str
    agent_insights: Dict[str, Any]
    timestamp: str
    session_id: str


class AnalyzeRequest(BaseModel):
    """Request to analyze a problem"""
    problem: str
    context: Dict[str, Any]
    config: AgentConfig


class AnalyzeResponse(BaseModel):
    """Response from problem analysis"""
    analysis: str
    timestamp: str


# ============ Helper Functions ============

def get_or_create_agent_system(session_id: str, config: AgentConfig) -> HybridMultiAgentSystem:
    """Get existing or create new agent system for session"""
    if session_id not in agent_systems:
        agent_systems[session_id] = create_hybrid_system(
            api_key=config.api_key,
            model=config.chat_model,  # Use chat model for the agent system
            base_url=config.base_url
        )
    return agent_systems[session_id]


def get_or_create_reasoning_chains(session_id: str, config: AgentConfig) -> ReasoningChains:
    """Get existing or create new reasoning chains for session"""
    if session_id not in reasoning_chains:
        llm_kwargs = {
            "api_key": config.api_key,
            "model": config.reasoning_model,  # Use reasoning model for reasoning chains
            "temperature": 0.7
        }
        if config.base_url:
            llm_kwargs["base_url"] = config.base_url
        
        llm = ChatOpenAI(**llm_kwargs)
        reasoning_chains[session_id] = ReasoningChains(llm)
    return reasoning_chains[session_id]


# ============ API Endpoints ============

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AI Agent Backend",
        "version": "2.0.0",
        "status": "running",
        "features": [
            "Hybrid LangChain + Multi-Agent System",
            "Multi-tab session support",
            "Persistent chat history",
            "Advanced reasoning chains"
        ]
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "active_sessions": len(agent_systems),
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/task", response_model=TaskResponse)
async def process_task(request: TaskRequest):
    """
    Process a task using the hybrid multi-agent system
    
    This endpoint:
    1. Creates/retrieves agent system for the session
    2. Processes task through Planner → Analyzer → Executor pipeline
    3. Returns actions and insights
    """
    try:
        # Get or create agent system for this session
        agent_system = get_or_create_agent_system(request.session_id, request.config)
        
        # Convert page data to dict
        page_data_dict = request.page_data.model_dump()
        
        # Convert chat history to dict
        chat_history = [msg.model_dump() for msg in request.chat_history]
        
        # Process task through multi-agent system
        result = agent_system.process_task(
            task=request.task,
            page_data=page_data_dict,
            chat_history=chat_history
        )
        
        # Return response
        return TaskResponse(
            understanding=result["understanding"],
            actions=result["actions"],
            result=result["result"],
            agent_insights=result["agent_insights"],
            timestamp=datetime.now().isoformat(),
            session_id=request.session_id
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task processing failed: {str(e)}")


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_problem(request: AnalyzeRequest):
    """
    Analyze a problem using LangChain reasoning chains
    
    Provides deep analysis without generating actions
    """
    try:
        # Get or create reasoning chains
        chains = get_or_create_reasoning_chains("analysis", request.config)
        
        # Analyze problem
        analysis = chains.analyze_problem(request.problem, request.context)
        
        return AnalyzeResponse(
            analysis=analysis,
            timestamp=datetime.now().isoformat()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/api/history/{session_id}")
async def get_conversation_history(session_id: str):
    """Get conversation history for a session"""
    if session_id not in agent_systems:
        return {"history": [], "session_id": session_id}
    
    history = agent_systems[session_id].get_conversation_history()
    return {
        "history": history,
        "session_id": session_id,
        "message_count": len(history)
    }


@app.delete("/api/history/{session_id}")
async def clear_conversation_history(session_id: str):
    """Clear conversation history for a session"""
    if session_id in agent_systems:
        agent_systems[session_id].clear_history()
    
    return {
        "message": "History cleared",
        "session_id": session_id
    }


@app.delete("/api/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a session and its agent system"""
    if session_id in agent_systems:
        del agent_systems[session_id]
    if session_id in reasoning_chains:
        del reasoning_chains[session_id]
    
    return {
        "message": "Session deleted",
        "session_id": session_id
    }


@app.get("/api/sessions")
async def list_sessions():
    """List all active sessions"""
    return {
        "sessions": list(agent_systems.keys()),
        "count": len(agent_systems)
    }


# ============ Development Endpoints ============

@app.post("/api/test/agents")
async def test_multi_agent_system(config: AgentConfig):
    """Test the multi-agent system with a sample task"""
    try:
        agent_system = create_hybrid_system(
            api_key=config.api_key,
            model=config.chat_model,  # Use chat model for the agent system
            base_url=config.base_url
        )
        
        # Sample task
        sample_page = {
            "url": "https://example.com",
            "title": "Example Page",
            "text": "This is a sample page with a search form.",
            "interactiveElements": [
                {"type": "input", "name": "search", "id": "search-box"},
                {"type": "button", "text": "Search", "id": "search-btn"}
            ]
        }
        
        result = agent_system.process_task(
            task="Search for 'AI agents'",
            page_data=sample_page
        )
        
        return {
            "status": "success",
            "result": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
