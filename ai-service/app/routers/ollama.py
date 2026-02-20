"""
Ollama API Router - Endpoints for local AI model interaction
Provides health check, chat, streaming, and model listing via Ollama.
"""

import json
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel, Field
from typing import Optional

from app.services.ollama_service import (
    check_ollama_health,
    ollama_chat,
    ollama_chat_stream,
    ollama_generate,
    list_models,
    OllamaServiceError,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ollama", tags=["ollama"])


class ChatMessage(BaseModel):
    role: str = Field(..., description="Message role: system, user, or assistant")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    model: Optional[str] = None
    temperature: float = 0.3
    max_tokens: int = 2048
    stream: bool = False


class GenerateRequest(BaseModel):
    prompt: str
    model: Optional[str] = None
    temperature: float = 0.2
    max_tokens: int = 256


@router.get("/health")
async def ollama_health():
    """Check Ollama server status and available models."""
    health = await check_ollama_health()
    if health["status"] == "disconnected":
        raise HTTPException(
            status_code=503,
            detail={
                "status": "disconnected",
                "error": health.get("error", "Ollama server not running"),
                "hint": "Start Ollama with: ollama serve",
            },
        )
    return health


@router.get("/models")
async def get_models():
    """List all available Ollama models."""
    models = await list_models()
    return {
        "models": models,
        "count": len(models),
    }


@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Chat completion using local Ollama.
    Supports both streaming and non-streaming modes.
    """
    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    if request.stream:
        async def event_generator():
            collected = ""
            try:
                async for chunk in ollama_chat_stream(
                    messages=messages,
                    model=request.model,
                    temperature=request.temperature,
                    max_tokens=request.max_tokens,
                ):
                    collected += chunk
                    yield {
                        "event": "chunk",
                        "data": json.dumps({"content": chunk}),
                    }
                yield {
                    "event": "complete",
                    "data": json.dumps({"content": collected}),
                }
            except OllamaServiceError as e:
                yield {
                    "event": "error",
                    "data": json.dumps({"error": e.message}),
                }
            except Exception as e:
                yield {
                    "event": "error",
                    "data": json.dumps({"error": str(e)}),
                }

        return EventSourceResponse(event_generator())

    try:
        result = await ollama_chat(
            messages=messages,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )
        return result
    except OllamaServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate")
async def generate(request: GenerateRequest):
    """
    Text/code generation using local Ollama (non-chat, FIM-compatible).
    """
    try:
        result = await ollama_generate(
            prompt=request.prompt,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )
        return result
    except OllamaServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
