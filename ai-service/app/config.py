"""
Application Configuration
"""

from pydantic_settings import BaseSettings
from typing import List, Dict
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Groq Configuration (Llama 3 models)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"  # Default: best Vietnamese support (llama-3.1-70b-versatile is decommissioned)
    GROQ_MAX_TOKENS: int = 8000  # Increased from 4000 to support detailed roadmaps (80-150 nodes)
    GROQ_TEMPERATURE: float = 0.7
    
    # Available model aliases for easy switching via .env
    # Set GROQ_MODEL to one of these values:
    # - llama-3.3-70b-versatile (best for Vietnamese + complex JSON)
    # - llama-3.1-70b-versatile (stable, good for production)
    # - llama-3.1-8b-instant (fastest, lower quality)
    
    # Supabase Configuration (optional - for direct access)
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Application Settings
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # Prompt Configuration
    PROMPT_VERSION: str = "2.0.0"  # Updated for roadmap.sh-style detailed prompts with sections
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


# Create settings instance
settings = Settings()


# Model information for documentation
MODEL_INFO: Dict[str, Dict[str, str]] = {
    "llama-3.3-70b-versatile": {
        "description": "Newest Llama 3.3, best for Vietnamese and complex JSON",
        "speed": "medium",
        "quality": "best"
    },
    "llama-3.1-70b-versatile": {
        "description": "Stable Llama 3.1 70B, good for production",
        "speed": "medium",
        "quality": "high"
    },
    "llama-3.1-8b-instant": {
        "description": "Fast Llama 3.1 8B, may struggle with complex prompts",
        "speed": "fast",
        "quality": "medium"
    }
}


def validate_settings():
    """Validate required settings"""
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is required. Get your free API key at https://console.groq.com/")
    
    # Validate model is one of supported models
    supported_models = list(MODEL_INFO.keys())
    if settings.GROQ_MODEL not in supported_models:
        print(f"Warning: GROQ_MODEL '{settings.GROQ_MODEL}' is not in known models: {supported_models}")
    
    return True


def get_model_info(model_name: str = None) -> Dict[str, str]:
    """Get information about a model"""
    model = model_name or settings.GROQ_MODEL
    return MODEL_INFO.get(model, {"description": "Unknown model", "speed": "unknown", "quality": "unknown"})
