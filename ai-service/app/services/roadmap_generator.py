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
    RoadmapSection,
    RoadmapSubsection,
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
        # Get first section/phase nodes
        first_nodes = []
        if roadmap.sections:
            first_section_id = roadmap.sections[0].id if roadmap.sections else None
            first_nodes = [n for n in roadmap.nodes if n.section_id == first_section_id]
        elif roadmap.phases:
            first_phase_id = roadmap.phases[0].id if roadmap.phases else "phase-1"
            first_nodes = [n for n in roadmap.nodes if n.phase_id == first_phase_id]
        
        if first_nodes:
            avg_difficulty = sum(
                difficulty_levels.get(n.data.difficulty, 1) for n in first_nodes
            ) / len(first_nodes)
            # Score is higher if starting difficulty matches user level
            difficulty_match = max(0, 1 - abs(avg_difficulty - user_level) / 3)
            score += difficulty_match * weights["difficulty_match"]
    
    # Structure score (sections/phases, edges, node types variety)
    structure_score = 0.0
    # Check sections first, fall back to phases
    section_count = len(roadmap.sections) if roadmap.sections else len(roadmap.phases)
    if section_count >= 3:  # Good structure with multiple sections
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
    Supports both new sections structure and legacy phases for backward compatibility.
    """
    try:
        # Parse sections (new roadmap.sh-style structure)
        sections = []
        for section_data in raw_data.get("sections", []):
            subsections = [
                RoadmapSubsection(
                    id=subsec.get("id", ""),
                    name=subsec.get("name", ""),
                    order=subsec.get("order", idx + 1),
                    description=subsec.get("description")
                )
                for idx, subsec in enumerate(section_data.get("subsections", []))
            ]
            
            sections.append(
                RoadmapSection(
                    id=section_data.get("id", f"section-{len(sections) + 1}"),
                    name=section_data.get("name", ""),
                    order=section_data.get("order", len(sections) + 1),
                    description=section_data.get("description"),
                    subsections=subsections
                )
            )
        
        # Parse phases (backward compatibility - convert from sections if needed)
        phases_data = raw_data.get("phases", [])
        if not phases_data and sections:
            # Convert sections to phases for backward compatibility
            phases_data = [
                {"id": s.id, "name": s.name, "order": s.order}
                for s in sections
            ]
        
        phases = [
            RoadmapPhase(
                id=p.get("id", f"phase-{i+1}"),
                name=p.get("name", f"Phase {i+1}"),
                order=p.get("order", i+1),
            )
            for i, p in enumerate(phases_data)
        ]
        
        # Normalize suggested_type values from AI to valid enum values
        def normalize_suggested_type(value: str) -> str:
            """Normalize AI response to valid suggested_type values"""
            if not value:
                return "video"
            value_lower = value.lower().strip()
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
            return type_mapping.get(value_lower, "video")
        
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
                "alternative": "alternative",  # NEW: alternative options
                "alt": "alternative",
            }
            return type_mapping.get(value_lower, "core")
        
        # Parse nodes
        nodes = []
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
            
            # Get section_id and subsection_id (new structure)
            section_id = n.get("section_id", n.get("phase_id", "section-1"))
            subsection_id = n.get("subsection_id")
            
            # For backward compatibility, also keep phase_id
            phase_id = n.get("phase_id", section_id)
            
            nodes.append(RoadmapNode(
                id=n.get("id", ""),
                phase_id=phase_id,  # Backward compatibility
                section_id=section_id,  # New field
                subsection_id=subsection_id,  # New field
                type=normalized_node_type,
                is_hub=n.get("is_hub", False),  # NEW: parse is_hub field for tree structure
                data=RoadmapNodeData(
                    label=node_data.get("label", "Unknown Topic"),
                    description=node_data.get("description", ""),
                    estimated_hours=node_data.get("estimated_hours", 5),
                    difficulty=normalized_difficulty,
                    prerequisites=node_data.get("prerequisites", []),  # NEW
                    learning_outcomes=node_data.get("learning_outcomes", []),  # NEW
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
            sections=sections,  # NEW: roadmap.sh-style sections
            phases=phases,      # Backward compatibility
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
