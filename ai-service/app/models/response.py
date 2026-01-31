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
    """Enhanced data payload for a roadmap node (roadmap.sh style)"""
    label: str = Field(..., description="Display name of the topic")
    description: str = Field(..., description="Detailed description of what to learn and why it's important")
    estimated_hours: int = Field(..., ge=1, description="Estimated hours to complete")
    difficulty: Literal["beginner", "intermediate", "advanced"] = Field(
        ...,
        description="Difficulty level of the topic"
    )
    prerequisites: List[str] = Field(
        default_factory=list,
        description="List of prerequisite topics (human-readable names, not node IDs)"
    )
    learning_outcomes: List[str] = Field(
        default_factory=list,
        description="Specific learning outcomes - what you'll be able to do after completing this topic"
    )
    learning_resources: LearningResources = Field(
        default_factory=LearningResources,
        description="Learning resource suggestions"
    )


class RoadmapNode(BaseModel):
    """A node in the roadmap graph"""
    id: str = Field(..., description="Unique node identifier")
    # Support both old phase_id and new section_id for backward compatibility
    phase_id: Optional[str] = Field(None, description="[DEPRECATED] Phase this node belongs to - use section_id instead")
    section_id: str = Field(..., description="Section this node belongs to")
    subsection_id: Optional[str] = Field(None, description="Subsection this node belongs to (optional)")
    type: Literal["core", "optional", "project", "alternative"] = Field(
        default="core",
        description="Node type: core (required), optional, project, or alternative (alternative option)"
    )
    is_hub: bool = Field(
        default=False,
        description="True if this is a hub node that branches to multiple children. Hub nodes are central concepts that split into detailed subtopics."
    )
    data: RoadmapNodeData = Field(..., description="Node data payload")


class RoadmapEdge(BaseModel):
    """An edge connecting two nodes"""
    id: str = Field(..., description="Unique edge identifier")
    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")


class RoadmapSubsection(BaseModel):
    """A subsection within a section (roadmap.sh style)"""
    id: str = Field(..., description="Unique subsection identifier (e.g., 'subsec-1-1')")
    name: str = Field(..., description="Subsection name")
    order: int = Field(..., ge=1, description="Order within parent section")
    description: Optional[str] = Field(None, description="Brief description of subsection")


class RoadmapSection(BaseModel):
    """A major section in the roadmap (roadmap.sh style - replaces phases)"""
    id: str = Field(..., description="Unique section identifier (e.g., 'section-1')")
    name: str = Field(..., description="Section name (e.g., 'Internet & Web Fundamentals')")
    order: int = Field(..., ge=1, description="Display order")
    description: Optional[str] = Field(None, description="Brief description of section")
    subsections: List[RoadmapSubsection] = Field(
        default_factory=list,
        description="Subsections within this section"
    )


class RoadmapPhase(BaseModel):
    """[DEPRECATED] A phase/stage in the roadmap - use RoadmapSection instead"""
    id: str = Field(..., description="Unique phase identifier")
    name: str = Field(..., description="Phase name")
    order: int = Field(..., ge=1, description="Phase order (1-based)")


class GeneratedRoadmap(BaseModel):
    """AI-generated learning roadmap (roadmap.sh style with sections)"""
    roadmap_title: str = Field(..., description="Title of the roadmap")
    roadmap_description: str = Field(..., description="Brief description of the roadmap")
    total_estimated_hours: int = Field(..., description="Total hours to complete")
    
    # New structure (roadmap.sh style)
    sections: List[RoadmapSection] = Field(
        default_factory=list,
        description="Major sections with subsections (roadmap.sh style)"
    )
    
    # Backward compatibility - keep phases for old clients
    phases: List[RoadmapPhase] = Field(
        default_factory=list,
        description="[DEPRECATED] Learning phases - use sections instead"
    )
    
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
