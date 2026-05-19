"""
Groq Service - Handles communication with Groq API for Llama 3 models
"""

import json
import re
import time
from typing import Dict, Any, Tuple

from groq import AsyncGroq, RateLimitError, APIStatusError, APIConnectionError

from app.config import settings, get_model_info
from app.prompts import ROADMAP_SYSTEM_PROMPT


def get_groq_client() -> AsyncGroq:
    """
    Get or create Groq client with current API key from settings.
    This ensures we always use the latest API key if .env is updated.

    max_retries=0 — we handle 429 backoff in the application layer with a
    much shorter cooldown (20s) than the SDK's default (60s). Letting the
    SDK retry would block the whole pipeline for a full minute every time
    Groq returns 429.
    """
    return AsyncGroq(api_key=settings.GROQ_API_KEY, max_retries=0)


def get_groq_client_for_fill() -> AsyncGroq:
    """
    Client tuned for incremental fill calls. max_retries=0 so a transient
    429 fails immediately — the roadmap_generator's fill loop treats a
    failed round as non-fatal and either retries with a short cooldown or
    skips to the next round.
    """
    return AsyncGroq(api_key=settings.GROQ_API_KEY, max_retries=0)


class GroqAPIError(Exception):
    """Custom exception for Groq API errors with detailed info"""
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_type: str = "unknown",
        retry_after_s: float = 0.0,
    ):
        self.message = message
        self.status_code = status_code
        self.error_type = error_type
        # Optional cooldown hint propagated from Groq's 429 response. Callers
        # can use this to wait the exact amount Groq tells us instead of
        # picking an arbitrary fixed cooldown.
        self.retry_after_s = retry_after_s
        super().__init__(self.message)


_GROQ_RETRY_AFTER_RE = re.compile(r"try again in\s+([\d.]+)s", re.IGNORECASE)


def _extract_retry_after_seconds(message: str, fallback: float = 0.0) -> float:
    """
    Pull the "try again in X.Ys" hint out of a Groq 429 error message.
    Returns the float seconds, or fallback when not found.
    """
    if not message:
        return fallback
    match = _GROQ_RETRY_AFTER_RE.search(message)
    if not match:
        return fallback
    try:
        return float(match.group(1))
    except (TypeError, ValueError):
        return fallback


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
        
        # Groq free tier enforces a TPM (tokens-per-minute) limit and counts
        # (prompt_tokens + max_tokens) AT REQUEST TIME. If we hit HTTP 413
        # "Request too large", retry once with a much smaller max_tokens so
        # the request fits inside the per-minute budget.
        attempted_max_tokens = settings.GROQ_MAX_TOKENS
        try:
            response = await client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": ROADMAP_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=settings.GROQ_TEMPERATURE,
                max_tokens=attempted_max_tokens,
            )
        except APIStatusError as e_retryable:
            status_code = getattr(e_retryable, "status_code", None)
            err_msg = str(getattr(e_retryable, "message", "")) or str(e_retryable)
            if status_code == 413 and attempted_max_tokens > 4000:
                # Halve max_tokens (floor 4000) and try again exactly once.
                fallback_max_tokens = max(4000, attempted_max_tokens // 2)
                logger.warning(
                    "Groq 413 (request too large). Retrying with max_tokens=%d (was %d). Detail: %s",
                    fallback_max_tokens, attempted_max_tokens, err_msg,
                )
                response = await client.chat.completions.create(
                    model=settings.GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": ROADMAP_SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=settings.GROQ_TEMPERATURE,
                    max_tokens=fallback_max_tokens,
                )
                attempted_max_tokens = fallback_max_tokens
            else:
                raise
        
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
        # We disabled SDK retries (max_retries=0) so we own the backoff.
        # Wait a short, deterministic period and retry once. This is much
        # better than the SDK's default 60s wait because the per-minute TPM
        # window often opens up within 15-25s once the previous big call
        # finishes.
        import logging as _logging
        _logger = _logging.getLogger(__name__)
        _logger.warning(
            "Groq 429 on main call — sleeping 20s before single retry."
        )
        import asyncio as _asyncio
        await _asyncio.sleep(20)
        try:
            response = await client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": ROADMAP_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=settings.GROQ_TEMPERATURE,
                max_tokens=attempted_max_tokens,
            )
            end_time = time.time()
            latency_ms = int((end_time - start_time) * 1000)
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from Groq API")
            roadmap_data = json.loads(content)
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
        except RateLimitError:
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
        elif e.status_code == 413:
            # Groq returns 413 when (prompt_tokens + max_tokens) exceeds the
            # per-minute TPM budget for the current model/tier. We already
            # auto-retry once at half max_tokens above, so reaching here means
            # even the fallback was too large (or the prompt itself is huge).
            raise GroqAPIError(
                message=(
                    "Yêu cầu quá lớn so với hạn mức tokens/phút của Groq "
                    "(model: " + settings.GROQ_MODEL + "). Vui lòng giảm "
                    "GROQ_MAX_TOKENS trong ai-service/.env (gợi ý: 6000), "
                    "đợi 60 giây cho TPM được reset, hoặc nâng cấp Dev tier: "
                    "https://console.groq.com/settings/billing"
                ),
                status_code=413,
                error_type="request_too_large"
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


# --- Incremental fill helper -------------------------------------------------

FILL_NODES_SYSTEM_PROMPT = """You are a curriculum architect generating ADDITIONAL learning nodes that fit an EXISTING roadmap structure.

Return ONLY one valid JSON object with this exact shape:
{
  "nodes": [ ... ],
  "edges": [ ... ]
}

Each node MUST include:
  - "id" (unique, prefer prefix "fill-")
  - "section_id" (must equal one of the section_ids the user provides)
  - "subsection_id" (must equal one of the subsection_ids the user provides)
  - "type": "core" (default) or "project" (rare)
  - "is_hub": false
  - "data": {
      "label",
      "description",
      "estimated_hours",
      "difficulty" (one of "beginner"|"intermediate"|"advanced"),
      "prerequisites" (array of strings),
      "learning_outcomes" (array of strings),
      "learning_resources": { "keywords": [...], "suggested_type": "doc"|"video"|"project" }
    }

Each edge MUST include "id", "source", "target". Connect new nodes to existing nodes by id when sensible.

CRITICAL RULES:
- Do NOT output "sections", "subsections", "roadmap_title", or any other root field.
- Do NOT invent new section_ids or subsection_ids — reuse exactly what the user provides.
- Do NOT repeat node ids that already exist in the roadmap.
- Each requested subsection must receive the requested number of lesson nodes.
- Output JSON only, no prose.
"""


async def generate_fill_nodes_json(
    fill_user_prompt: str,
    max_tokens_override: int = 4000,
) -> Dict[str, Any]:
    """
    Generate ADDITIONAL nodes/edges to backfill empty subsections.

    Uses settings.GROQ_FILL_MODEL (a cheaper / smaller model with its own TPM
    bucket) and a smaller max_tokens budget so each fill round stays well
    below Groq's per-minute TPM cap and does not contend with the main 70B
    generation. Returns the parsed JSON object, expected to look like
    {"nodes": [...], "edges": [...]}.

    Args:
        fill_user_prompt: Already-built user prompt enumerating which
            section_id / subsection_id need additional nodes.
        max_tokens_override: Output budget. 4000 fits ~20-30 nodes which is
            plenty for one chunk of 5-7 subsections.

    Raises:
        GroqAPIError: When Groq returns an error.
        ValueError: When the response is not valid JSON.
    """
    if not settings.GROQ_API_KEY:
        raise GroqAPIError(
            message="GROQ_API_KEY chưa được cấu hình.",
            status_code=500,
            error_type="missing_api_key",
        )

    # Use a low-retry client for fill calls so a transient 429 doesn't trigger
    # a 60s wait inside the SDK. The caller (roadmap_generator) treats a
    # failed fill round as non-fatal and moves on, which is much better UX
    # than blocking the whole roadmap pipeline for a minute.
    client = get_groq_client_for_fill()
    fill_model = settings.GROQ_FILL_MODEL or settings.GROQ_MODEL
    if "json" not in fill_user_prompt.lower():
        fill_user_prompt = fill_user_prompt + "\n\nReturn JSON only."

    try:
        response = await client.chat.completions.create(
            model=fill_model,
            messages=[
                {"role": "system", "content": FILL_NODES_SYSTEM_PROMPT},
                {"role": "user", "content": fill_user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=settings.GROQ_TEMPERATURE,
            max_tokens=max_tokens_override,
        )
    except APIStatusError as e:
        # Mirror the same retry-on-413 pattern as generate_roadmap_json so a
        # single fill chunk never breaks the whole pipeline.
        status_code = getattr(e, "status_code", None)
        if status_code == 413 and max_tokens_override > 2000:
            fallback = max(2000, max_tokens_override // 2)
            response = await client.chat.completions.create(
                model=fill_model,
                messages=[
                    {"role": "system", "content": FILL_NODES_SYSTEM_PROMPT},
                    {"role": "user", "content": fill_user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=settings.GROQ_TEMPERATURE,
                max_tokens=fallback,
            )
        elif status_code == 429:
            err_text = str(getattr(e, "message", "")) or str(e)
            retry_after = _extract_retry_after_seconds(err_text, fallback=15.0)
            raise GroqAPIError(
                message="Groq rate limit during incremental fill.",
                status_code=429,
                error_type="rate_limit",
                retry_after_s=retry_after,
            )
        else:
            raise GroqAPIError(
                message=f"Groq API error during fill ({status_code}): {e}",
                status_code=status_code or 500,
                error_type="api_error",
            )
    except RateLimitError as e:
        err_text = str(getattr(e, "message", "")) or str(e)
        retry_after = _extract_retry_after_seconds(err_text, fallback=15.0)
        raise GroqAPIError(
            message="Groq rate limit during incremental fill.",
            status_code=429,
            error_type="rate_limit",
            retry_after_s=retry_after,
        )
    except APIConnectionError:
        raise GroqAPIError(
            message="Cannot connect to Groq API during fill.",
            status_code=503,
            error_type="connection_error",
        )

    content = response.choices[0].message.content
    if not content:
        raise ValueError("Empty fill response from Groq")

    return json.loads(content)
