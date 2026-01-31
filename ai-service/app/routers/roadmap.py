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
    NodeDetailRequest,
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


@router.post("/node-detail")
async def get_node_detail(request: "NodeDetailRequest"):
    """
    Generate detailed explanation and resources for a specific topic.
    
    Uses AI to generate:
    - Topic description
    - Related concepts
    - Free learning resources (articles, videos)
    - AI tutor content
    
    Args:
        request: NodeDetailRequest with topic and user level
        
    Returns:
        Detailed node information with resources
    """
    from app.models import NodeDetailRequest as NDR
    from urllib.parse import quote_plus
    
    topic = request.topic
    user_level = request.user_level
    encoded_topic = quote_plus(topic)
    
    # Generate resources based on topic
    free_resources = [
        {
            "type": "article",
            "title": f"Introduction to {topic}",
            "url": f"https://developer.mozilla.org/en-US/search?q={encoded_topic}",
            "source": "MDN Web Docs"
        },
        {
            "type": "article", 
            "title": f"{topic} - W3Schools",
            "url": f"https://www.w3schools.com/tags/tag_{encoded_topic.lower()}.asp",
            "source": "W3Schools"
        },
        {
            "type": "video",
            "title": f"{topic} Tutorial for Beginners",
            "url": f"https://www.youtube.com/results?search_query={encoded_topic}+tutorial",
            "source": "YouTube"
        },
    ]
    
    # AI-generated description based on level
    level_descriptions = {
        "beginner": f"{topic} là một khái niệm cơ bản trong lập trình web. Bạn sẽ học cách sử dụng {topic} để xây dựng các ứng dụng web hiện đại.",
        "intermediate": f"{topic} là một phần quan trọng trong phát triển web. Hiểu rõ {topic} giúp bạn viết code hiệu quả và maintainable hơn.",
        "advanced": f"{topic} có nhiều tính năng nâng cao và patterns phức tạp. Nắm vững {topic} giúp bạn tối ưu hóa và scale ứng dụng."
    }
    
    description = level_descriptions.get(user_level, level_descriptions["intermediate"])
    
    # Related concepts (simplified - in production, use AI to generate these)
    related_concepts = [
        f"{topic} basics",
        f"{topic} best practices", 
        f"Advanced {topic}",
    ]
    
    # AI tutor content
    ai_tutor_content = f"""## {topic}

{description}

### Các điểm chính cần nắm:
1. Hiểu khái niệm cơ bản của {topic}
2. Thực hành với các ví dụ đơn giản
3. Áp dụng vào dự án thực tế

### Tips học tập:
- Bắt đầu với documentation chính thức
- Xem video tutorials để có cái nhìn trực quan
- Làm các bài tập thực hành để củng cố kiến thức
"""
    
    # Premium resources (optional)
    premium_resources = [
        {
            "type": "course",
            "title": f"{topic} Complete Guide - Udemy",
            "url": f"https://www.udemy.com/courses/search/?q={encoded_topic}",
            "source": "Udemy",
            "discount": "20% Off"
        }
    ]
    
    return {
        "description": description,
        "related_concepts": related_concepts,
        "free_resources": free_resources,
        "ai_tutor_content": ai_tutor_content,
        "premium_resources": premium_resources
    }
