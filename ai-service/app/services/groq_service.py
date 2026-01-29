"""
Groq Service - Handles communication with Groq API for Llama 3 models
"""

import json
import time
from typing import Dict, Any, Tuple

from groq import AsyncGroq, RateLimitError, APIStatusError, APIConnectionError

from app.config import settings, get_model_info
from app.prompts import ROADMAP_SYSTEM_PROMPT


def get_groq_client() -> AsyncGroq:
    """
    Get or create Groq client with current API key from settings.
    This ensures we always use the latest API key if .env is updated.
    """
    return AsyncGroq(api_key=settings.GROQ_API_KEY)


class GroqAPIError(Exception):
    """Custom exception for Groq API errors with detailed info"""
    def __init__(self, message: str, status_code: int = 500, error_type: str = "unknown"):
        self.message = message
        self.status_code = status_code
        self.error_type = error_type
        super().__init__(self.message)


async def generate_roadmap_json(user_prompt: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Generate roadmap JSON using Groq API with Llama 3 model.
    
    Args:
        user_prompt: The user prompt containing profile information
        
    Returns:
        Tuple of (roadmap_data, metadata)
        
    Raises:
        GroqAPIError: When Groq API returns an error
        ValueError: When response cannot be parsed as JSON
    """
    start_time = time.time()
    model_info = get_model_info()
    
    # Get fresh client to ensure we use latest API key
    client = get_groq_client()
    
    # Debug: Log API key status (first 10 chars only for security)
    api_key_preview = settings.GROQ_API_KEY[:10] + "..." if settings.GROQ_API_KEY and len(settings.GROQ_API_KEY) > 10 else "NOT SET"
    if not settings.GROQ_API_KEY:
        raise GroqAPIError(
            message="GROQ_API_KEY chưa được cấu hình. Vui lòng kiểm tra ai-service/.env",
            status_code=500,
            error_type="missing_api_key"
        )
    
    # Log request details for debugging
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Making Groq API call: model={settings.GROQ_MODEL}, api_key_preview={api_key_preview}, max_tokens={settings.GROQ_MAX_TOKENS}")
    
    try:
        # Ensure user_prompt contains "json" for Groq JSON mode requirement
        if "json" not in user_prompt.lower():
            user_prompt = user_prompt + "\n\nHãy trả về kết quả dưới dạng JSON."
        
        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": ROADMAP_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=settings.GROQ_TEMPERATURE,
            max_tokens=settings.GROQ_MAX_TOKENS,
        )
        
        end_time = time.time()
        latency_ms = int((end_time - start_time) * 1000)
        
        # Parse the response
        content = response.choices[0].message.content
        
        if not content:
            raise ValueError("Empty response from Groq API")
            
        roadmap_data = json.loads(content)
        
        # Extract usage metadata
        metadata = {
            "model": settings.GROQ_MODEL,
            "model_quality": model_info.get("quality", "unknown"),
            "input_tokens": response.usage.prompt_tokens if response.usage else 0,
            "output_tokens": response.usage.completion_tokens if response.usage else 0,
            "total_tokens": response.usage.total_tokens if response.usage else 0,
            "latency_ms": latency_ms,
            "prompt_version": settings.PROMPT_VERSION,
            "provider": "groq",
        }
        
        return roadmap_data, metadata
    
    except RateLimitError as e:
        # Groq free tier: 30 requests/min, 6000 tokens/min
        raise GroqAPIError(
            message="Groq API rate limit exceeded. Vui lòng đợi 1 phút và thử lại. (Free tier: 30 requests/phút)",
            status_code=429,
            error_type="rate_limit"
        )
    
    except APIStatusError as e:
        error_message = str(e.message) if hasattr(e, 'message') else str(e)
        status_code = e.status_code if hasattr(e, 'status_code') else 500
        
        # Log detailed error for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Groq APIStatusError: status_code={status_code}, message={error_message}, type={type(e).__name__}")
        
        # Handle specific status codes
        if status_code == 401:
            # Check if it's actually an API key issue or something else
            if "api" in error_message.lower() and "key" in error_message.lower():
                raise GroqAPIError(
                    message=f"Groq API key không hợp lệ: {error_message}. Vui lòng kiểm tra GROQ_API_KEY trong ai-service/.env",
                    status_code=401,
                    error_type="invalid_api_key"
                )
            else:
                # Might be a different 401 error (e.g., model access, permissions)
                raise GroqAPIError(
                    message=f"Groq API error (401): {error_message}",
                    status_code=401,
                    error_type="api_error"
                )
        elif e.status_code == 400:
            raise GroqAPIError(
                message=f"Invalid request to Groq API: {error_message}",
                status_code=400,
                error_type="bad_request"
            )
        else:
            raise GroqAPIError(
                message=f"Groq API error ({e.status_code}): {error_message}",
                status_code=e.status_code,
                error_type="api_error"
            )
    
    except APIConnectionError as e:
        raise GroqAPIError(
            message="Không thể kết nối đến Groq API. Vui lòng kiểm tra kết nối internet.",
            status_code=503,
            error_type="connection_error"
        )
        
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse AI response as JSON: {str(e)}")
    
    except Exception as e:
        # Catch-all for unexpected errors
        raise GroqAPIError(
            message=f"Groq API unexpected error: {str(e)}",
            status_code=500,
            error_type="unknown"
        )


async def generate_roadmap_stream(user_prompt: str):
    """
    Generate roadmap with streaming for better UX.
    Yields chunks of the response.
    
    Args:
        user_prompt: The user prompt containing profile information
        
    Yields:
        Chunks of the response text
        
    Raises:
        GroqAPIError: When Groq API returns an error
    """
    # Get fresh client to ensure we use latest API key
    client = get_groq_client()
    
    # Ensure user_prompt contains "json" for Groq JSON mode requirement
    if "json" not in user_prompt.lower():
        user_prompt = user_prompt + "\n\nHãy trả về kết quả dưới dạng JSON."
    
    try:
        stream = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": ROADMAP_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=settings.GROQ_TEMPERATURE,
            max_tokens=settings.GROQ_MAX_TOKENS,
            stream=True,
        )
        
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    
    except RateLimitError as e:
        raise GroqAPIError(
            message="Groq API rate limit exceeded. Please wait and try again.",
            status_code=429,
            error_type="rate_limit"
        )
    
    except APIStatusError as e:
        raise GroqAPIError(
            message=f"Groq API error: {str(e)}",
            status_code=e.status_code if hasattr(e, 'status_code') else 500,
            error_type="api_error"
        )
    
    except APIConnectionError as e:
        raise GroqAPIError(
            message="Cannot connect to Groq API",
            status_code=503,
            error_type="connection_error"
        )
                
    except Exception as e:
        raise GroqAPIError(
            message=f"Groq streaming error: {str(e)}",
            status_code=500,
            error_type="unknown"
        )


# Alias for backward compatibility
generate_roadmap_json_groq = generate_roadmap_json
generate_roadmap_stream_groq = generate_roadmap_stream
