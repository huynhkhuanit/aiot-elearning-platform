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
    GROQ_MAX_TOKENS: int = 12000  # Increased from 8000 to support tree structure roadmaps (150-200 nodes with branching)
    GROQ_TEMPERATURE: float = 0.7
    
    # Ollama Local Configuration (backup for Colab)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_CHAT_MODEL: str = "qwen2.5-coder:7b-instruct"
    OLLAMA_COMPLETION_MODEL: str = "deepseek-coder:1.3b"
    
    # Internal Ollama URL (used by transparent proxy - Ollama on same VPS)
    OLLAMA_INTERNAL_URL: str = "http://localhost:11434"
    
    # Available model aliases for easy switching via .env
    # Set GROQ_MODEL to one of these values:
    # - llama-3.3-70b-versatile (best for Vietnamese + complex JSON)
    # - llama-3.1-70b-versatile (stable, good for production)
    # - llama-3.1-8b-instant (fastest, lower quality)
    
    # Supabase Configuration (optional - for direct access)
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://13.214.189.155:3000",
    ]
    CORS_ORIGIN_REGEX: str = r"https://.*\.vercel\.app"
    
    # Application Settings
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # Prompt Configuration
    PROMPT_VERSION: str = "2.0.0"  # Updated for roadmap.sh-style detailed prompts with sections

    # Face touch detection configuration
    FACE_TOUCH_MAX_IMAGE_BYTES: int = 4_000_000
    FACE_TOUCH_DEFAULT_WIDTH: int = 640
    FACE_TOUCH_DEFAULT_HEIGHT: int = 480
    FACE_TOUCH_PROCESS_WIDTH: int = 640  # Giữ nguyên độ phân giải để MediaPipe detect tay tốt hơn
    FACE_TOUCH_FACE_MARGIN_RATIO: float = 0.18
    FACE_TOUCH_NEAR_THRESHOLD: float = 0.30
    FACE_TOUCH_TOUCH_THRESHOLD: float = 0.58
    FACE_TOUCH_REGION_TOUCH_THRESHOLD: float = 0.25
    FACE_TOUCH_REGION_NEAR_THRESHOLD: float = 0.10
    FACE_TOUCH_FINGERTIP_NEAR_RATIO: float = 0.18
    FACE_TOUCH_HAND_FACE_RATIO_SOFT_MAX: float = 1.15
    FACE_TOUCH_HAND_FACE_RATIO_HARD_MAX: float = 1.85
    FACE_TOUCH_OCCLUSION_LOW: float = 0.20
    FACE_TOUCH_OCCLUSION_HIGH: float = 0.50
    FACE_TOUCH_CONTACT_RATIO: float = 0.11
    FACE_TOUCH_CONTACT_SOFT_MULT: float = 3.0
    FACE_TOUCH_ENABLE_MEDIAPIPE: bool = True
    # MediaPipe confidence (video streaming mode)
    FACE_TOUCH_FACE_DETECT_CONFIDENCE: float = 0.6
    FACE_TOUCH_FACE_TRACK_CONFIDENCE: float = 0.5
    FACE_TOUCH_HAND_DETECT_CONFIDENCE: float = 0.3
    FACE_TOUCH_HAND_TRACK_CONFIDENCE: float = 0.2
    
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
