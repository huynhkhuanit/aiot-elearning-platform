"""
Ollama Service - Local AI Model Integration
Connects to Ollama running on localhost for code completion, chat, and generation.
Serves as backup for Groq API / Google Colab.
"""

import logging
import httpx
from typing import AsyncGenerator, Optional
from app.config import settings

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_CHAT_MODEL = getattr(settings, "OLLAMA_CHAT_MODEL", "qwen2.5-coder:7b-instruct")
OLLAMA_COMPLETION_MODEL = getattr(settings, "OLLAMA_COMPLETION_MODEL", "deepseek-coder:1.3b")

TIMEOUT_CHAT = 300.0
TIMEOUT_COMPLETION = 120.0
TIMEOUT_HEALTH = 10.0


class OllamaServiceError(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


async def check_ollama_health() -> dict:
    """Check if Ollama server is running and list available models."""
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_HEALTH) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            response.raise_for_status()
            data = response.json()
            models = [m["name"] for m in data.get("models", [])]
            return {
                "status": "connected",
                "base_url": OLLAMA_BASE_URL,
                "models": models,
                "model_count": len(models),
            }
    except httpx.ConnectError:
        return {
            "status": "disconnected",
            "base_url": OLLAMA_BASE_URL,
            "models": [],
            "error": "Cannot connect to Ollama server. Is it running?"
        }
    except Exception as e:
        return {
            "status": "error",
            "base_url": OLLAMA_BASE_URL,
            "models": [],
            "error": str(e)
        }


async def ollama_chat(
    messages: list[dict],
    model: Optional[str] = None,
    temperature: float = 0.3,
    max_tokens: int = 2048,
    stream: bool = False,
) -> dict:
    """
    Send chat completion request to local Ollama.

    Args:
        messages: List of {role, content} message dicts
        model: Model name (defaults to OLLAMA_CHAT_MODEL)
        temperature: Sampling temperature
        max_tokens: Maximum tokens to generate
        stream: Whether to stream responses

    Returns:
        dict with 'content' and 'model' keys
    """
    model = model or OLLAMA_CHAT_MODEL
    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens,
            "top_p": 0.9,
            "num_ctx": 4096,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_CHAT) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

            return {
                "content": data.get("message", {}).get("content", ""),
                "model": data.get("model", model),
                "total_duration": data.get("total_duration", 0),
                "eval_count": data.get("eval_count", 0),
            }
    except httpx.ConnectError:
        raise OllamaServiceError(
            "Cannot connect to Ollama. Start it with: ollama serve",
            status_code=503,
        )
    except httpx.TimeoutException:
        raise OllamaServiceError(
            f"Ollama request timed out after {TIMEOUT_CHAT}s",
            status_code=504,
        )
    except Exception as e:
        raise OllamaServiceError(f"Ollama error: {str(e)}")


async def ollama_chat_stream(
    messages: list[dict],
    model: Optional[str] = None,
    temperature: float = 0.3,
    max_tokens: int = 2048,
) -> AsyncGenerator[str, None]:
    """
    Stream chat completion from local Ollama.
    Yields text chunks as they arrive.
    """
    model = model or OLLAMA_CHAT_MODEL
    payload = {
        "model": model,
        "messages": messages,
        "stream": True,
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens,
            "top_p": 0.9,
            "num_ctx": 4096,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_CHAT) as client:
            async with client.stream(
                "POST",
                f"{OLLAMA_BASE_URL}/api/chat",
                json=payload,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    try:
                        import json
                        data = json.loads(line)
                        content = data.get("message", {}).get("content", "")
                        if content:
                            yield content
                        if data.get("done", False):
                            return
                    except json.JSONDecodeError:
                        continue
    except httpx.ConnectError:
        raise OllamaServiceError(
            "Cannot connect to Ollama. Start it with: ollama serve",
            status_code=503,
        )


async def ollama_generate(
    prompt: str,
    model: Optional[str] = None,
    temperature: float = 0.2,
    max_tokens: int = 256,
) -> dict:
    """
    Generate text completion (non-chat, useful for FIM/code completion).
    """
    model = model or OLLAMA_COMPLETION_MODEL
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens,
            "top_p": 0.9,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_COMPLETION) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

            return {
                "response": data.get("response", ""),
                "model": data.get("model", model),
                "total_duration": data.get("total_duration", 0),
            }
    except httpx.ConnectError:
        raise OllamaServiceError(
            "Cannot connect to Ollama. Start it with: ollama serve",
            status_code=503,
        )
    except Exception as e:
        raise OllamaServiceError(f"Ollama generate error: {str(e)}")


async def list_models() -> list[dict]:
    """List all models available in local Ollama."""
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_HEALTH) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            response.raise_for_status()
            data = response.json()
            return data.get("models", [])
    except Exception:
        return []
