"""
Ollama Transparent Proxy Router
Mirrors Ollama API endpoints (/api/generate, /api/chat, /api/tags)
so the Next.js client (ollama.ts) can call FastAPI with the same paths.

Architecture: Vercel (Next.js) -> FastAPI (VPS) -> Ollama (VPS localhost)
"""

import json
import logging
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, JSONResponse
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["ollama-proxy"])

# Ollama runs on the same VPS as FastAPI, so always localhost
OLLAMA_INTERNAL_URL = getattr(settings, "OLLAMA_INTERNAL_URL", "http://localhost:11434")

TIMEOUT_GENERATE = 120.0
TIMEOUT_CHAT = 300.0
TIMEOUT_HEALTH = 10.0


@router.get("/api/tags")
async def proxy_tags():
    """Proxy GET /api/tags -> Ollama /api/tags"""
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_HEALTH) as client:
            response = await client.get(f"{OLLAMA_INTERNAL_URL}/api/tags")
            response.raise_for_status()
            return JSONResponse(content=response.json(), status_code=200)
    except httpx.ConnectError:
        return JSONResponse(
            content={"models": [], "error": "Ollama not reachable"},
            status_code=503,
        )
    except Exception as e:
        logger.error(f"Proxy /api/tags error: {e}")
        return JSONResponse(
            content={"models": [], "error": str(e)},
            status_code=500,
        )


@router.post("/api/generate")
async def proxy_generate(request: Request):
    """
    Proxy POST /api/generate -> Ollama /api/generate
    Supports both streaming and non-streaming modes.
    """
    body = await request.json()
    is_stream = body.get("stream", False)

    try:
        if is_stream:
            return await _stream_proxy(f"{OLLAMA_INTERNAL_URL}/api/generate", body)

        async with httpx.AsyncClient(timeout=TIMEOUT_GENERATE) as client:
            response = await client.post(
                f"{OLLAMA_INTERNAL_URL}/api/generate",
                json=body,
            )
            response.raise_for_status()
            return JSONResponse(content=response.json(), status_code=200)
    except httpx.ConnectError:
        return JSONResponse(
            content={"error": "Ollama server not reachable on VPS"},
            status_code=503,
        )
    except httpx.TimeoutException:
        return JSONResponse(
            content={"error": f"Ollama generate timed out after {TIMEOUT_GENERATE}s"},
            status_code=504,
        )
    except Exception as e:
        logger.error(f"Proxy /api/generate error: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)


@router.post("/api/chat")
async def proxy_chat(request: Request):
    """
    Proxy POST /api/chat -> Ollama /api/chat
    Supports both streaming (NDJSON passthrough) and non-streaming modes.
    """
    body = await request.json()
    is_stream = body.get("stream", False)

    try:
        if is_stream:
            return await _stream_proxy(f"{OLLAMA_INTERNAL_URL}/api/chat", body)

        async with httpx.AsyncClient(timeout=TIMEOUT_CHAT) as client:
            response = await client.post(
                f"{OLLAMA_INTERNAL_URL}/api/chat",
                json=body,
            )
            response.raise_for_status()
            return JSONResponse(content=response.json(), status_code=200)
    except httpx.ConnectError:
        return JSONResponse(
            content={"error": "Ollama server not reachable on VPS"},
            status_code=503,
        )
    except httpx.TimeoutException:
        return JSONResponse(
            content={"error": f"Ollama chat timed out after {TIMEOUT_CHAT}s"},
            status_code=504,
        )
    except Exception as e:
        logger.error(f"Proxy /api/chat error: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)


async def _stream_proxy(url: str, body: dict) -> StreamingResponse:
    """
    Stream proxy: forward Ollama NDJSON stream as-is to the client.
    Uses chunked transfer encoding for real-time streaming.
    """
    async def stream_generator():
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(
                connect=10.0,
                read=300.0,
                write=10.0,
                pool=10.0,
            )) as client:
                async with client.stream("POST", url, json=body) as response:
                    response.raise_for_status()
                    async for chunk in response.aiter_bytes():
                        yield chunk
        except httpx.ConnectError:
            error_line = json.dumps({"error": "Ollama not reachable"}) + "\n"
            yield error_line.encode()
        except httpx.TimeoutException:
            error_line = json.dumps({"error": "Ollama stream timed out"}) + "\n"
            yield error_line.encode()
        except Exception as e:
            logger.error(f"Stream proxy error: {e}")
            error_line = json.dumps({"error": str(e)}) + "\n"
            yield error_line.encode()

    return StreamingResponse(
        stream_generator(),
        media_type="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
