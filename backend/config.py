"""
Configuration module for AI Agent Backend
"""
import os
from typing import Optional

class Config:
    """Configuration class with environment variables"""
    
    # API Configuration
    API_KEY: str = os.getenv('OPENAI_API_KEY', 'ollama')
    
    # Model Configuration
    CHAT_MODEL: str = os.getenv('CHAT_MODEL', 'qwen2.5:0.5b')
    REASONING_MODEL: str = os.getenv('REASONING_MODEL', 'qwen2.5:7b')
    
    # Base URL for API (for local models like Ollama)
    BASE_URL: Optional[str] = os.getenv('BASE_URL', 'http://localhost:11434/v1')
    
    # Server Configuration
    HOST: str = os.getenv('HOST', '0.0.0.0')
    PORT: int = int(os.getenv('PORT', '8001'))
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    
    @staticmethod
    def get_default_config():
        """Get default configuration as a dictionary"""
        return {
            'api_key': Config.API_KEY,
            'chat_model': Config.CHAT_MODEL,
            'reasoning_model': Config.REASONING_MODEL,
            'base_url': Config.BASE_URL
        }