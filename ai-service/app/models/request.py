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
    audience_type: Optional[Literal[
        "worker", "non-worker", "student", "university_student", "recent_graduate",
        "self-learner", "teacher", "team-lead", "mentor", "content-creator", "other"
    ]] = Field(
        default="worker",
        description="Who this roadmap is for (worker, student, university_student, etc.)"
    )
    
    # Audience-specific detail fields
    specific_job: Optional[str] = Field(
        default=None,
        description="Specific job title (for 'worker' audience type)"
    )
    class_level: Optional[str] = Field(
        default=None,
        description="Class level e.g. '10', '11', '12' (for 'student' audience type)"
    )
    major: Optional[str] = Field(
        default=None,
        description="Major/field of study (for 'university_student' or 'recent_graduate')"
    )
    study_year: Optional[int] = Field(
        default=None,
        ge=1,
        le=6,
        description="Year of study (for 'university_student' audience type)"
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


class FaceTouchAnalyzeRequest(BaseModel):
    """Request body for webcam frame analysis"""

    image: str = Field(
        ...,
        description="Base64 encoded frame image or data URL",
    )
    timestamp: int = Field(
        ...,
        ge=0,
        description="Client timestamp in milliseconds",
    )
    sample_rate_fps: int = Field(
        default=10,
        ge=1,
        le=30,
        description="Sampling rate used by the frontend",
    )
