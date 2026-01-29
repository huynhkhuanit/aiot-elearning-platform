"""
Roadmap Generator Service - Main business logic
"""

from datetime import datetime
from typing import Optional

from app.models import (
    UserProfileRequest,
    GeneratedRoadmap,
    GenerationMetadata,
    RoadmapResponse,
    RoadmapPhase,
    RoadmapNode,
    RoadmapNodeData,
    RoadmapEdge,
    LearningResources,
)
from app.prompts import build_user_prompt
from app.services.groq_service import generate_roadmap_json
from app.config import settings


def calculate_personalization_score(
    profile: UserProfileRequest,
    roadmap: GeneratedRoadmap,
) -> float:
    """
    Calculate a personalization score based on how well the roadmap
    matches the user's profile.
    
    Score components:
    - Skills coverage: Are user's existing skills skipped?
    - Time fit: Is total hours close to available hours?
    - Difficulty progression: Does it start at user's level?
    
    Returns a score between 0 and 1.
    """
    score = 0.0
    weights = {
        "time_fit": 0.4,
        "difficulty_match": 0.3,
        "structure": 0.3,
    }
    
    # Time fit score
    available_hours = profile.hours_per_week * profile.target_months * 4
    time_ratio = roadmap.total_estimated_hours / available_hours if available_hours > 0 else 0
    time_fit_score = max(0, 1 - abs(1 - time_ratio))  # Closer to 1 is better
    score += time_fit_score * weights["time_fit"]
    
    # Difficulty match score
    difficulty_levels = {"beginner": 1, "intermediate": 2, "advanced": 3}
    user_level = difficulty_levels.get(profile.skill_level, 1)
    
    if roadmap.nodes:
        first_phase_nodes = [n for n in roadmap.nodes if n.phase_id == "phase-1"]
        if first_phase_nodes:
            avg_difficulty = sum(
                difficulty_levels.get(n.data.difficulty, 1) for n in first_phase_nodes
            ) / len(first_phase_nodes)
            # Score is higher if starting difficulty matches user level
            difficulty_match = max(0, 1 - abs(avg_difficulty - user_level) / 3)
            score += difficulty_match * weights["difficulty_match"]
    
    # Structure score (phases, edges, node types variety)
    structure_score = 0.0
    if len(roadmap.phases) >= 2:
        structure_score += 0.4
    if len(roadmap.edges) >= len(roadmap.nodes) * 0.8:  # Good connectivity
        structure_score += 0.3
    node_types = set(n.type for n in roadmap.nodes)
    if len(node_types) >= 2:  # Has variety (core + optional or project)
        structure_score += 0.3
    score += structure_score * weights["structure"]
    
    return round(min(1.0, max(0.0, score)), 2)


def validate_and_parse_roadmap(raw_data: dict) -> GeneratedRoadmap:
    """
    Validate and parse raw AI response into structured roadmap.
    """
    try:
        # Parse phases
        phases = [
            RoadmapPhase(
                id=p.get("id", f"phase-{i+1}"),
                name=p.get("name", f"Phase {i+1}"),
                order=p.get("order", i+1),
            )
            for i, p in enumerate(raw_data.get("phases", []))
        ]
        
        # Parse nodes
        nodes = []
        
        # Normalize suggested_type values from AI to valid enum values
        def normalize_suggested_type(value: str) -> str:
            """Normalize AI response to valid suggested_type values"""
            if not value:
                return "video"
            value_lower = value.lower().strip()
            # Map common variations to valid values
            type_mapping = {
                "video": "video",
                "videos": "video",
                "doc": "doc",
                "docs": "doc",
                "documentation": "doc",
                "document": "doc",
                "reading": "doc",
                "article": "doc",
                "project": "project",
                "projects": "project",
                "practice": "project",
                "hands-on": "project",
            }
            return type_mapping.get(value_lower, "video")  # Default to "video"
        
        # Normalize difficulty values
        def normalize_difficulty(value: str) -> str:
            """Normalize AI response to valid difficulty values"""
            if not value:
                return "beginner"
            value_lower = value.lower().strip()
            difficulty_mapping = {
                "beginner": "beginner",
                "basic": "beginner",
                "easy": "beginner",
                "intermediate": "intermediate",
                "medium": "intermediate",
                "advanced": "advanced",
                "expert": "advanced",
                "hard": "advanced",
            }
            return difficulty_mapping.get(value_lower, "beginner")
        
        # Normalize node type values
        def normalize_node_type(value: str) -> str:
            """Normalize AI response to valid node type values"""
            if not value:
                return "core"
            value_lower = value.lower().strip()
            type_mapping = {
                "core": "core",
                "required": "core",
                "essential": "core",
                "optional": "optional",
                "elective": "optional",
                "project": "project",
                "practice": "project",
            }
            return type_mapping.get(value_lower, "core")
        
        for n in raw_data.get("nodes", []):
            node_data = n.get("data", {})
            learning_res = node_data.get("learning_resources", {})
            
            # Normalize values
            raw_suggested_type = learning_res.get("suggested_type", "video")
            normalized_type = normalize_suggested_type(raw_suggested_type)
            
            raw_difficulty = node_data.get("difficulty", "beginner")
            normalized_difficulty = normalize_difficulty(raw_difficulty)
            
            raw_node_type = n.get("type", "core")
            normalized_node_type = normalize_node_type(raw_node_type)
            
            nodes.append(RoadmapNode(
                id=n.get("id", ""),
                phase_id=n.get("phase_id", "phase-1"),
                type=normalized_node_type,
                data=RoadmapNodeData(
                    label=node_data.get("label", "Unknown Topic"),
                    description=node_data.get("description", ""),
                    estimated_hours=node_data.get("estimated_hours", 5),
                    difficulty=normalized_difficulty,
                    learning_resources=LearningResources(
                        keywords=learning_res.get("keywords", []),
                        suggested_type=normalized_type,
                    ),
                ),
            ))
        
        # Parse edges
        edges = [
            RoadmapEdge(
                id=e.get("id", f"e{i}"),
                source=e.get("source", ""),
                target=e.get("target", ""),
            )
            for i, e in enumerate(raw_data.get("edges", []))
        ]
        
        return GeneratedRoadmap(
            roadmap_title=raw_data.get("roadmap_title", "Learning Roadmap"),
            roadmap_description=raw_data.get("roadmap_description", ""),
            total_estimated_hours=raw_data.get("total_estimated_hours", 0),
            phases=phases,
            nodes=nodes,
            edges=edges,
        )
        
    except Exception as e:
        raise ValueError(f"Failed to parse roadmap data: {str(e)}")


async def generate_roadmap(profile: UserProfileRequest) -> RoadmapResponse:
    """
    Generate a personalized learning roadmap based on user profile.
    
    Args:
        profile: User profile with learning preferences
        
    Returns:
        RoadmapResponse with generated roadmap and metadata
    """
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
    
    # Generate roadmap using Groq (Llama 3)
    raw_roadmap, raw_metadata = await generate_roadmap_json(user_prompt)
    
    # Validate and parse the response
    roadmap = validate_and_parse_roadmap(raw_roadmap)
    
    # Calculate personalization score
    personalization_score = calculate_personalization_score(profile, roadmap)
    
    # Build metadata
    metadata = GenerationMetadata(
        model=raw_metadata["model"],
        input_tokens=raw_metadata["input_tokens"],
        output_tokens=raw_metadata["output_tokens"],
        latency_ms=raw_metadata["latency_ms"],
        prompt_version=raw_metadata["prompt_version"],
        personalization_score=personalization_score,
        generated_at=datetime.utcnow().isoformat(),
    )
    
    return RoadmapResponse(
        success=True,
        roadmap=roadmap,
        metadata=metadata,
    )
