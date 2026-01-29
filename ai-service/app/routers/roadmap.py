"""
Roadmap API Router - Endpoints for roadmap generation
"""

import json
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse

from app.models import (
    GenerateRoadmapRequest,
    RoadmapResponse,
    UserProfileRequest,
)
from app.services.roadmap_generator import generate_roadmap
from app.services.groq_service import generate_roadmap_stream, GroqAPIError
from app.prompts import build_user_prompt

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/api", tags=["roadmap"])


@router.post("/generate-roadmap", response_model=RoadmapResponse)
async def create_roadmap(request: GenerateRoadmapRequest):
    """
    Generate personalized learning roadmap based on user profile.
    
    - Uses Groq API with Llama 3 models (JSON mode)
    - Returns React Flow compatible nodes/edges
    - Target latency: < 15s for full response
    
    Args:
        request: GenerateRoadmapRequest containing user profile
        
    Returns:
        RoadmapResponse with generated roadmap and metadata
    """
    try:
        response = await generate_roadmap(request.profile)
        return response
    except GroqAPIError as e:
        logger.error(f"GroqAPIError: status_code={e.status_code}, error_type={e.error_type}, message={e.message}")
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except ValueError as e:
        logger.error(f"ValueError: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        logger.error(f"RuntimeError: {str(e)}")
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.post("/generate-roadmap/stream")
async def create_roadmap_stream(request: GenerateRoadmapRequest):
    """
    Generate roadmap with Server-Sent Events streaming.
    
    Provides better UX with partial updates.
    Target: < 5s for first token.
    
    Args:
        request: GenerateRoadmapRequest containing user profile
        
    Returns:
        EventSourceResponse with streamed content
    """
    profile = request.profile
    
    # Build the user prompt
    user_prompt = build_user_prompt(
        current_role=profile.current_role,
        target_role=profile.target_role,
        current_skills=profile.current_skills,
        skill_level=profile.skill_level,
        learning_style=profile.learning_style,
        hours_per_week=profile.hours_per_week,
        target_months=profile.target_months,
        preferred_language=profile.preferred_language,
        focus_areas=profile.focus_areas,
    )
    
    async def event_generator():
        collected_content = ""
        try:
            async for chunk in generate_roadmap_stream(user_prompt):
                collected_content += chunk
                yield {
                    "event": "chunk",
                    "data": json.dumps({"content": chunk}),
                }
            
            # Send final complete response
            yield {
                "event": "complete",
                "data": json.dumps({"content": collected_content}),
            }
        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)}),
            }
    
    return EventSourceResponse(event_generator())


@router.post("/validate-profile")
async def validate_profile(profile: UserProfileRequest):
    """
    Validate user profile without generating roadmap.
    Useful for form validation.
    
    Args:
        profile: User profile to validate
        
    Returns:
        Validation result with estimated output
    """
    total_hours = profile.hours_per_week * profile.target_months * 4
    
    # Estimate node count based on timeline
    if profile.target_months <= 3:
        estimated_nodes = "15-25"
    elif profile.target_months <= 6:
        estimated_nodes = "25-40"
    else:
        estimated_nodes = "40-60"
    
    return {
        "valid": True,
        "total_available_hours": total_hours,
        "estimated_nodes": estimated_nodes,
        "profile_summary": {
            "from": profile.current_role,
            "to": profile.target_role,
            "duration": f"{profile.target_months} months",
            "intensity": f"{profile.hours_per_week} hours/week",
        },
    }
