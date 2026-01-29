"""
Response Models for API Endpoints
"""

from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from datetime import datetime


class LearningResources(BaseModel):
    """Learning resources for a node"""
    keywords: List[str] = Field(
        default=[],
        description="Keywords for searching learning materials"
    )
    suggested_type: Literal["video", "doc", "project"] = Field(
        default="video",
        description="Suggested resource type based on learning style"
    )


class RoadmapNodeData(BaseModel):
    """Data payload for a roadmap node"""
    label: str = Field(..., description="Display name of the topic")
    description: str = Field(..., description="Detailed description of what to learn")
    estimated_hours: int = Field(..., ge=1, description="Estimated hours to complete")
    difficulty: Literal["beginner", "intermediate", "advanced"] = Field(
        ...,
        description="Difficulty level of the topic"
    )
    learning_resources: LearningResources = Field(
        default_factory=LearningResources,
        description="Learning resource suggestions"
    )


class RoadmapNode(BaseModel):
    """A node in the roadmap graph"""
    id: str = Field(..., description="Unique node identifier")
    phase_id: str = Field(..., description="Phase this node belongs to")
    type: Literal["core", "optional", "project"] = Field(
        default="core",
        description="Node type: core (required), optional, or project"
    )
    data: RoadmapNodeData = Field(..., description="Node data payload")


class RoadmapEdge(BaseModel):
    """An edge connecting two nodes"""
    id: str = Field(..., description="Unique edge identifier")
    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")


class RoadmapPhase(BaseModel):
    """A phase/stage in the roadmap"""
    id: str = Field(..., description="Unique phase identifier")
    name: str = Field(..., description="Phase name")
    order: int = Field(..., ge=1, description="Phase order (1-based)")


class GeneratedRoadmap(BaseModel):
    """AI-generated learning roadmap"""
    roadmap_title: str = Field(..., description="Title of the roadmap")
    roadmap_description: str = Field(..., description="Brief description of the roadmap")
    total_estimated_hours: int = Field(..., description="Total hours to complete")
    phases: List[RoadmapPhase] = Field(..., description="Learning phases")
    nodes: List[RoadmapNode] = Field(..., description="All topic nodes")
    edges: List[RoadmapEdge] = Field(..., description="Connections between nodes")


class GenerationMetadata(BaseModel):
    """Metadata about the generation process"""
    model: str = Field(..., description="AI model used")
    input_tokens: int = Field(..., ge=0, description="Number of input tokens")
    output_tokens: int = Field(..., ge=0, description="Number of output tokens")
    latency_ms: int = Field(..., ge=0, description="Generation time in milliseconds")
    prompt_version: str = Field(..., description="Version of the prompt used")
    personalization_score: Optional[float] = Field(
        None,
        ge=0,
        le=1,
        description="Score indicating personalization quality"
    )
    generated_at: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat(),
        description="Timestamp of generation"
    )


class RoadmapResponse(BaseModel):
    """Response containing generated roadmap and metadata"""
    success: bool = Field(default=True)
    roadmap: GeneratedRoadmap = Field(..., description="The generated roadmap")
    metadata: GenerationMetadata = Field(..., description="Generation metadata")
    error: Optional[str] = Field(None, description="Error message if any")
