"""
LangChain reasoning chains for enhanced analysis
"""

from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.llms.base import BaseLLM
from typing import Dict, Any


class ReasoningChains:
    """Collection of LangChain reasoning chains"""
    
    def __init__(self, llm: BaseLLM):
        self.llm = llm
        self._init_chains()
    
    def _init_chains(self):
        """Initialize all reasoning chains"""
        
        # Problem analysis chain
        self.problem_analysis_chain = LLMChain(
            llm=self.llm,
            prompt=PromptTemplate(
                input_variables=["problem", "context"],
                template="""Analyze this problem in detail:

Problem: {problem}

Context: {context}

Provide:
1. Key aspects of the problem
2. Potential challenges
3. Recommended approach
4. Success criteria

Analysis:"""
            )
        )
        
        # Element selection chain
        self.element_selection_chain = LLMChain(
            llm=self.llm,
            prompt=PromptTemplate(
                input_variables=["task", "elements"],
                template="""Given this task: {task}

And these available elements:
{elements}

Which element(s) should be used and why?
Provide the best match with reasoning.

Selection:"""
            )
        )
        
        # Action validation chain
        self.action_validation_chain = LLMChain(
            llm=self.llm,
            prompt=PromptTemplate(
                input_variables=["action", "context"],
                template="""Validate this proposed action:

Action: {action}

Context: {context}

Is this action:
1. Safe to execute?
2. Likely to succeed?
3. The best approach?

If not, suggest improvements.

Validation:"""
            )
        )
        
        # Context understanding chain
        self.context_understanding_chain = LLMChain(
            llm=self.llm,
            prompt=PromptTemplate(
                input_variables=["page_data"],
                template="""Understand this webpage:

{page_data}

Provide:
1. Page purpose and type
2. Main functionality
3. User interaction patterns
4. Key elements and their roles

Understanding:"""
            )
        )
    
    def analyze_problem(self, problem: str, context: Dict[str, Any]) -> str:
        """Analyze a problem with context"""
        return self.problem_analysis_chain.run(
            problem=problem,
            context=str(context)
        )
    
    def select_element(self, task: str, elements: list) -> str:
        """Select best element for task"""
        return self.element_selection_chain.run(
            task=task,
            elements=str(elements)
        )
    
    def validate_action(self, action: Dict[str, Any], context: Dict[str, Any]) -> str:
        """Validate an action before execution"""
        return self.action_validation_chain.run(
            action=str(action),
            context=str(context)
        )
    
    def understand_context(self, page_data: Dict[str, Any]) -> str:
        """Deep understanding of page context"""
        return self.context_understanding_chain.run(
            page_data=str(page_data)
        )
