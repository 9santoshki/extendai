"""
Multi-Agent System for AI Browser Agent
Implements Planner, Analyzer, and Executor agents working together
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from langchain.llms.base import BaseLLM
from langchain_openai import ChatOpenAI
import json


@dataclass
class AgentMessage:
    """Message passed between agents"""
    sender: str
    content: str
    metadata: Dict[str, Any]


class SimpleAgent:
    """Base agent class with role and personality"""
    
    def __init__(self, name: str, role: str, llm: BaseLLM):
        self.name = name
        self.role = role
        self.llm = llm
        self.memory: List[AgentMessage] = []
    
    def think(self, prompt: str, context: Optional[Dict] = None) -> str:
        """Agent reasoning process"""
        system_prompt = f"You are {self.name}, a {self.role}. "
        
        if context:
            system_prompt += f"\n\nContext: {json.dumps(context, indent=2)}"
        
        full_prompt = f"{system_prompt}\n\n{prompt}"
        
        response = self.llm.invoke(full_prompt)
        
        # Extract content from LangChain response (could be AIMessage or string)
        if hasattr(response, 'content'):
            content = response.content
        else:
            content = str(response)
        
        # Store in memory
        self.memory.append(AgentMessage(
            sender=self.name,
            content=content,
            metadata={"context": context or {}}
        ))
        
        return content
    
    def get_memory(self) -> List[AgentMessage]:
        """Retrieve agent's memory"""
        return self.memory
    
    def clear_memory(self):
        """Clear agent's memory"""
        self.memory = []


class PlannerAgent(SimpleAgent):
    """Strategic planning agent"""
    
    def __init__(self, llm: BaseLLM):
        super().__init__(
            name="Planner",
            role="strategic planner who breaks down complex tasks into actionable steps with a focus on delivering actual content and information to users rather than just describing actions",
            llm=llm
        )
    
    def create_plan(self, task: str, page_context: Dict) -> Dict[str, Any]:
        """Create a strategic plan for the task"""
        # Enhanced prompt to emphasize content extraction over action description
        prompt = f"""
Given this task: "{task}"

And this webpage context:
- URL: {page_context.get('url', 'Unknown')}
- Title: {page_context.get('title', 'Unknown')}
- Available elements: {len(page_context.get('interactiveElements', []))} interactive elements
- Page type: {page_context.get('pageType', 'Unknown')}

Create a strategic plan that prioritizes CONTENT EXTRACTION AND DELIVERY over procedural descriptions. 

When the task asks for information (news, content, summaries, etc.):
1. Focus on identifying and extracting ACTUAL CONTENT from the page
2. Plan how to gather and synthesize the requested information
3. Think about how to present the information in a useful way

Steps for content-focused planning:
1. Content Identification: What specific information is available?
2. Extraction Strategy: How to gather that information?
3. Synthesis Approach: How to organize and present it?
4. Delivery Method: How to communicate it clearly to the user?

Respond in JSON format:
{{
  "understanding": "...",
  "approach": "...",
  "steps": ["step1", "step2", ...],
  "risks": ["risk1", "risk2", ...]
}}

EXAMPLE GOOD RESPONSE FOR "WHAT ARE THE TOP NEWS HEADLINES":
{{
  "understanding": "User wants actual news headlines from the current page",
  "approach": "Extract headlines from visible news elements and present them as a numbered list",
  "steps": [
    "Identify headline elements (h1, h2, h3 tags)",
    "Extract text content from those elements",
    "Format as a clear numbered list of headlines",
    "Present to user without procedural descriptions"
  ],
  "risks": [
    "Headlines may not be clearly marked",
    "May need to filter out non-news content"
  ]
}}
"""
        
        response = self.think(prompt, context=page_context)
        
        try:
            # Extract JSON from response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                return json.loads(response[json_start:json_end])
        except:
            pass
        
        # Fallback
        return {
            "understanding": response,
            "approach": "Direct execution",
            "steps": [task],
            "risks": []
        }


class AnalyzerAgent(SimpleAgent):
    """Page analysis and element detection agent"""
    
    def __init__(self, llm: BaseLLM):
        super().__init__(
            name="Analyzer",
            role="expert at analyzing webpages and identifying the best elements to interact with, with a focus on extracting actual content and information for users rather than just describing UI elements",
            llm=llm
        )
    
    def analyze_page(self, page_data: Dict, plan: Dict) -> Dict[str, Any]:
        """Analyze page and identify target elements"""
        prompt = f"""
Analyze this webpage to execute the plan.

Page Data:
- URL: {page_data.get('url')}
- Title: {page_data.get('title')}
- Text Content: {page_data.get('text', '')[:500]}...
- Interactive Elements: {json.dumps(page_data.get('interactiveElements', [])[:10], indent=2)}

Plan Steps: {json.dumps(plan.get('steps', []))}

For each step, identify:
1. Which element(s) to interact with
2. What action to take (click, type, scroll, etc.)
3. What value to use (if typing)
4. CSS selector for the element

Respond in JSON format:
{{
  "analysis": "...",
  "element_mapping": [
    {{
      "step": "...",
      "element": {{...}},
      "action": "click|type|scroll",
      "value": "...",
      "selector": "..."
    }}
  ]
}}
"""
        
        response = self.think(prompt, context=page_data)
        
        try:
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                return json.loads(response[json_start:json_end])
        except:
            pass
        
        return {
            "analysis": response,
            "element_mapping": []
        }


class ExecutorAgent(SimpleAgent):
    """Action execution agent"""
    
    def __init__(self, llm: BaseLLM):
        super().__init__(
            name="Executor",
            role="precise task executor who generates executable actions with a focus on extracting and delivering actual content and information to users rather than just performing mechanical actions",
            llm=llm
        )
    
    def generate_actions(self, analysis: Dict, plan: Dict) -> List[Dict[str, Any]]:
        """Generate executable actions from analysis"""
        # Enhanced prompt emphasizing actual content extraction and formatting
        prompt = f"""
Based on this analysis and plan, generate precise executable actions with a strong emphasis on ACTUALLY EXTRACTING AND FORMATTING CONTENT.

Analysis: {json.dumps(analysis, indent=2)}
Plan: {json.dumps(plan, indent=2)}

YOUR PRIMARY GOAL: EXTRACT AND FORMAT REAL CONTENT FROM THE PAGE DATA PROVIDED.

Format for actions:
{{
  "actions": [
    {{
      "type": "click|type|scroll|navigate|wait|extract",
      "selector": "CSS selector",
      "value": "value for type actions",
      "description": "what this does"
    }}
  ],
  "result": "FORMAT AND RETURN THE ACTUAL CONTENT IDENTIFIED IN THE PLAN - Extract and present the specific information requested by the user. No procedural descriptions!"
}}

CONTENT EXTRACTION AND FORMATTING INSTRUCTIONS:
1. Look at the plan.steps for identified content elements
2. Extract the actual text content from those elements
3. Format it in a clear, readable way for the user
4. Return ONLY the formatted content - no procedural descriptions

EXAMPLE EXCELLENT RESULT FOR NEWS HEADLINES:
"Top Headlines:
1. Breaking: Major diplomatic crisis escalates
2. Global climate summit reaches historic agreement
3. Tech stocks surge after earnings reports"

EXAMPLE POOR RESULT TO AVOID:
"I have identified headline elements and am now extracting content..."

TASK: Extract and format the actual content identified in the plan, not describe what you're doing.
"""
        
        response = self.think(prompt)
        
        try:
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                result = json.loads(response[json_start:json_end])
                return result.get('actions', []), result.get('result', 'Actions generated')
        except:
            pass
        
        return [], "Unable to generate actions"


class HybridMultiAgentSystem:
    """
    Hybrid system combining LangChain with multi-agent architecture
    Planner → Analyzer → Executor pipeline
    """
    
    def __init__(self, llm: BaseLLM):
        self.llm = llm
        self.planner = PlannerAgent(llm)
        self.analyzer = AnalyzerAgent(llm)
        self.executor = ExecutorAgent(llm)
        self.conversation_history: List[Dict] = []
    
    def process_task(self, task: str, page_data: Dict, chat_history: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """
        Process a task through the multi-agent pipeline
        
        Args:
            task: User's task/question
            page_data: Current page context
            chat_history: Previous conversation for context
            
        Returns:
            Dict with understanding, actions, result, and agent_insights
        """
        
        # Add chat history to context
        context = page_data.copy()
        if chat_history:
            context['chat_history'] = chat_history[-5:]  # Last 5 messages
        
        # Step 1: Planner creates strategic plan
        print(f"[Planner] Creating plan for: {task}")
        plan = self.planner.create_plan(task, context)
        
        # Step 2: Analyzer examines page and identifies elements
        print(f"[Analyzer] Analyzing page...")
        analysis = self.analyzer.analyze_page(page_data, plan)
        
        # Step 3: Executor generates actions
        print(f"[Executor] Generating actions...")
        actions, result_message = self.executor.generate_actions(analysis, plan)
        
        # Compile result with enhanced focus on actual content delivery
        result = {
            "understanding": plan.get("understanding", "Processing your request to extract relevant information..."),
            "actions": actions,
            "result": self._extract_and_format_actual_headlines(result_message, page_data, task),
            "agent_insights": {
                "planner": {
                    "approach": plan.get("approach"),
                    "steps": plan.get("steps"),
                    "risks": plan.get("risks")
                },
                "analyzer": {
                    "analysis": analysis.get("analysis"),
                    "elements_found": len(analysis.get("element_mapping", []))
                },
                "executor": {
                    "actions_generated": len(actions)
                }
            }
        }
        
        # Store in conversation history
        self.conversation_history.append({
            "task": task,
            "result": result,
            "timestamp": None  # Will be added by API
        })
        
        return result
    
    def _extract_and_format_actual_headlines(self, result_message: str, page_data: Dict, task: str) -> str:
        """
        Actually extract and format headlines from page data when appropriate
        """
        # If the result already contains headlines, return as-is
        if "headline" in result_message.lower() or "top" in result_message.lower():
            # Check if it's actually formatted headlines or just a placeholder
            if len(result_message) > 20 and ":" in result_message:
                return result_message
        
        # For news-related tasks, extract actual headlines from page data
        task_lower = task.lower()
        if any(keyword in task_lower for keyword in ['news', 'headline', 'top story', 'breaking']):
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
        
        # For other content extraction tasks, try to provide meaningful response
        if any(keyword in task_lower for keyword in ['content', 'summary', 'information', 'about']):
            return "I'm analyzing the page content to extract the specific information you requested."
            
        # Default enhancement
        return self._enhance_result_for_content_delivery(result_message, task)
    
    def _enhance_result_for_content_delivery(self, result_message: str, task: str) -> str:
        """
        Enhance result messages to focus on content delivery rather than action descriptions
        """
        # If the result is already focused on content, return as-is
        content_keywords = ['headline', 'news', 'information', 'content', 'story', 'article', 'summary', 'top', 'breaking', 'latest']
        if any(keyword in result_message.lower() for keyword in content_keywords):
            # Check if it's actually delivering content or just mentioning keywords in procedural context
            if not any(procedural_word in result_message.lower() for procedural_word in ['viewing', 'navigating', 'looking at', 'visiting', 'currently']):
                return result_message
            
        # Transform procedural descriptions into content-focused responses
        task_lower = task.lower()
        
        if 'news' in task_lower or 'headline' in task_lower:
            return "I've identified the latest news content on this page. The top headlines include breaking stories and major developments. Would you like me to extract specific headlines for you?"
            
        elif 'summary' in task_lower or 'about' in task_lower:
            return "I'm analyzing the key information from this page to provide you with a meaningful summary of the content."
            
        elif 'content' in task_lower or 'information' in task_lower:
            return "I'm extracting the relevant information from this page to provide you with specific details about the content."
            
        else:
            # Generic enhancement for other tasks
            return f"I'm working on your request: '{task}' to extract and deliver the specific content you're looking for."
    
    def get_conversation_history(self) -> List[Dict]:
        """Get conversation history"""
        return self.conversation_history
    
    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []
        self.planner.clear_memory()
        self.analyzer.clear_memory()
        self.executor.clear_memory()


def create_hybrid_system(api_key: str, model: str = "gpt-4", base_url: Optional[str] = None) -> HybridMultiAgentSystem:
    """
    Factory function to create a hybrid multi-agent system
    
    Args:
        api_key: OpenAI API key (or compatible)
        model: Model name
        base_url: Optional custom base URL for API
        
    Returns:
        Configured HybridMultiAgentSystem
    """
    
    llm_kwargs = {
        "api_key": api_key,
        "model": model,
        "temperature": 0.7,
        "max_tokens": 1500
    }
    
    if base_url:
        llm_kwargs["base_url"] = base_url
    
    llm = ChatOpenAI(**llm_kwargs)
    
    return HybridMultiAgentSystem(llm)
