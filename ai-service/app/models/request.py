"""
Request Models for API Endpoints
"""

from pydantic import BaseModel, Field
from typing import List, Literal, Optional


class UserProfileRequest(BaseModel):
    """User profile for generating personalized roadmap"""
    
    # Basic info
    current_role: str = Field(
        ...,
        description="Current role/status of the user",
        examples=["Sinh viên năm 3", "Developer 1 năm kinh nghiệm"]
    )
    target_role: str = Field(
        ...,
        description="Target career role",
        examples=["Frontend Developer", "AI Engineer"]
    )
    
    # Skills
    current_skills: List[str] = Field(
        default=[],
        description="List of current skills",
        examples=[["HTML/CSS", "JavaScript", "React"]]
    )
    skill_level: Literal["beginner", "intermediate", "advanced"] = Field(
        default="beginner",
        description="Overall skill level"
    )
    
    # Learning preferences
    learning_style: List[Literal["documentation", "video", "project", "interactive"]] = Field(
        default=["video"],
        description="Preferred learning styles"
    )
    
    # Time commitment
    hours_per_week: int = Field(
        default=10,
        ge=1,
        le=60,
        description="Hours available per week for learning"
    )
    target_months: int = Field(
        default=6,
        ge=1,
        le=24,
        description="Target timeline in months"
    )
    
    # Optional preferences
    preferred_language: Literal["vi", "en"] = Field(
        default="vi",
        description="Preferred language for roadmap content"
    )
    focus_areas: Optional[List[str]] = Field(
        default=None,
        description="Specific areas to focus on"
    )


class GenerateRoadmapRequest(BaseModel):
    """Request body for generating roadmap"""
    
    profile: UserProfileRequest = Field(
        ...,
        description="User profile for personalization"
    )


class NodeDetailRequest(BaseModel):
    """Request body for getting node detail with AI explanation"""
    
    topic: str = Field(
        ...,
        description="The topic/node title to get details for"
    )
    context: Optional[str] = Field(
        default=None,
        description="Parent topic or roadmap context"
    )
    user_level: Literal["beginner", "intermediate", "advanced"] = Field(
        default="intermediate",
        description="User's skill level for tailored explanations"
    )
