"""
Roadmap Generator Service - Main business logic
"""

import logging
import re
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.models import (
    GeneratedRoadmap,
    GenerationDirectivesRequest,
    GenerationMetadata,
    LearningResources,
    NodePosition,
    RoadmapEdge,
    RoadmapNode,
    RoadmapNodeData,
    RoadmapPhase,
    RoadmapResponse,
    RoadmapSection,
    RoadmapSubsection,
    UserProfileRequest,
)
from app.prompts import build_user_prompt
from app.services.groq_service import generate_roadmap_json

logger = logging.getLogger(__name__)


def calculate_personalization_score(
    profile: UserProfileRequest,
    roadmap: GeneratedRoadmap,
) -> float:
    """
    Calculate a personalization score based on how well the roadmap
    matches the user's profile.
    """

    score = 0.0
    weights = {
        "time_fit": 0.4,
        "difficulty_match": 0.3,
        "structure": 0.3,
    }

    available_hours = profile.hours_per_week * profile.target_months * 4
    estimated = roadmap.total_estimated_hours or 1
    time_ratio = estimated / available_hours if available_hours > 0 else 0.0
    time_fit_score = max(0.0, 1.0 - abs(1.0 - time_ratio))
    score += time_fit_score * weights["time_fit"]

    difficulty_levels = {"beginner": 1, "intermediate": 2, "advanced": 3}
    user_level = difficulty_levels.get(profile.skill_level, 1)

    if roadmap.nodes:
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
            difficulty_match = max(0.0, 1.0 - abs(avg_difficulty - user_level) / 3.0)
            score += difficulty_match * weights["difficulty_match"]

    structure_score = 0.0
    section_count = len(roadmap.sections) if roadmap.sections else len(roadmap.phases)
    if section_count >= 3:
        structure_score += 0.4
    if len(roadmap.edges) >= len(roadmap.nodes) * 0.8:
        structure_score += 0.3
    node_types = set(n.type for n in roadmap.nodes)
    if len(node_types) >= 2:
        structure_score += 0.3
    score += structure_score * weights["structure"]

    clamped = min(1.0, max(0.0, score))
    return int(clamped * 100) / 100.0


def _default_generation_directives(profile: UserProfileRequest) -> Dict[str, Any]:
    total_hours = profile.hours_per_week * profile.target_months * 4

    if profile.target_months <= 3:
        return {
            "available_hours_total": total_hours,
            "target_node_range": {"min": 45, "max": 60},
            "min_sections": 6,
            "min_subsections_per_section": 2,
            "min_lessons_per_subsection": {"min": 3, "max": 4},
            "theory_ratio_target": 0.65,
            "project_cadence": "checkpoint_every_section_capstone_final",
            "require_prerequisites": True,
            "require_learning_outcomes": True,
        }

    if profile.target_months <= 6:
        return {
            "available_hours_total": total_hours,
            "target_node_range": {"min": 70, "max": 110},
            "min_sections": 8,
            "min_subsections_per_section": 3,
            "min_lessons_per_subsection": {"min": 4, "max": 5},
            "theory_ratio_target": 0.72,
            "project_cadence": "checkpoint_every_section_capstone_final",
            "require_prerequisites": True,
            "require_learning_outcomes": True,
        }

    return {
        "available_hours_total": total_hours,
        "target_node_range": {"min": 110, "max": 150},
        "min_sections": 10,
        "min_subsections_per_section": 4,
        "min_lessons_per_subsection": {"min": 5, "max": 6},
        "theory_ratio_target": 0.72,
        "project_cadence": "checkpoint_every_section_capstone_final",
        "require_prerequisites": True,
        "require_learning_outcomes": True,
    }


def _generation_directives_to_dict(
    profile: UserProfileRequest,
    generation_directives: Optional[GenerationDirectivesRequest],
) -> Dict[str, Any]:
    if generation_directives:
        return generation_directives.model_dump()
    return _default_generation_directives(profile)


def _default_subsection(section_id: str, order: int = 1) -> RoadmapSubsection:
    return RoadmapSubsection(
        id=f"{section_id}-sub-{order}",
        name="Core Topics",
        order=order,
        description="Synthesized subsection for compatibility",
    )


def _ensure_list(value: Any) -> List[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _normalize_text(value: Any, fallback: str = "") -> str:
    if value is None:
        return fallback

    normalized = value.strip() if isinstance(value, str) else str(value).strip()
    return normalized or fallback


def _normalize_optional_text(value: Any) -> Optional[str]:
    normalized = _normalize_text(value, "")
    return normalized or None


def _normalize_identifier(value: Any, fallback: str) -> str:
    return _normalize_text(value, fallback)


def _normalize_int(value: Any, fallback: int, minimum: Optional[int] = None) -> int:
    try:
        normalized = int(value)
    except (TypeError, ValueError):
        normalized = fallback

    if minimum is not None:
        normalized = max(minimum, normalized)

    return normalized


def _normalize_float(value: Any, fallback: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def _normalize_bool(value: Any, fallback: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        value_lower = value.strip().lower()
        if value_lower in {"true", "1", "yes"}:
            return True
        if value_lower in {"false", "0", "no"}:
            return False
    if isinstance(value, (int, float)):
        return bool(value)
    return fallback


def _normalize_string_list(value: Any) -> List[str]:
    normalized_items: List[str] = []
    for item in _ensure_list(value):
        normalized = _normalize_text(item, "")
        if normalized:
            normalized_items.append(normalized)
    return normalized_items


def _normalize_lookup_key(value: Any) -> str:
    text = _normalize_text(value, "")
    if not text:
        return ""

    folded = unicodedata.normalize("NFKD", text)
    folded = "".join(ch for ch in folded if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", " ", folded.lower()).strip()


def _register_alias(alias_map: Dict[str, str], value: Any, canonical_id: str) -> None:
    alias = _normalize_lookup_key(value)
    if alias and alias not in alias_map:
        alias_map[alias] = canonical_id


def _resolve_alias(
    value: Any,
    alias_map: Dict[str, str],
    fallback: Optional[str] = None,
) -> Optional[str]:
    alias = _normalize_lookup_key(value)
    if not alias:
        return fallback
    return alias_map.get(alias, fallback)


def _build_section_alias_maps(
    sections: List[RoadmapSection],
) -> tuple[Dict[str, str], Dict[str, Dict[str, str]]]:
    section_alias_map: Dict[str, str] = {}
    subsection_aliases_by_section: Dict[str, Dict[str, str]] = {}

    for section in sections:
        _register_alias(section_alias_map, section.id, section.id)
        _register_alias(section_alias_map, section.name, section.id)
        _register_alias(section_alias_map, section.order, section.id)
        _register_alias(section_alias_map, f"section-{section.order}", section.id)
        _register_alias(section_alias_map, f"sec-{section.order}", section.id)

        subsection_alias_map: Dict[str, str] = {}
        for subsection in section.subsections or []:
            _register_alias(subsection_alias_map, subsection.id, subsection.id)
            _register_alias(subsection_alias_map, subsection.name, subsection.id)
            _register_alias(subsection_alias_map, subsection.order, subsection.id)
            _register_alias(
                subsection_alias_map,
                f"{section.id}-sub-{subsection.order}",
                subsection.id,
            )
            _register_alias(
                subsection_alias_map,
                f"subsection-{subsection.order}",
                subsection.id,
            )
            _register_alias(subsection_alias_map, f"sub-{subsection.order}", subsection.id)

        subsection_aliases_by_section[section.id] = subsection_alias_map

    return section_alias_map, subsection_aliases_by_section


def _normalize_suggested_type(value: str) -> str:
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


def _normalize_difficulty(value: str) -> str:
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


def _normalize_node_type(value: str) -> str:
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
        "alternative": "alternative",
        "alt": "alternative",
    }
    return type_mapping.get(value_lower, "core")


def validate_and_parse_roadmap(raw_data: dict) -> GeneratedRoadmap:
    """
    Validate and parse raw AI response into structured roadmap.
    Supports sections-first data with phase fallback.
    """

    try:
        sections: List[RoadmapSection] = []
        raw_sections = _ensure_list(raw_data.get("sections", []))

        for section_index, section_data in enumerate(raw_sections):
            if not isinstance(section_data, dict):
                section_data = {}

            section_id = _normalize_identifier(
                section_data.get("id"),
                f"section-{section_index + 1}",
            )
            raw_subsections = _ensure_list(section_data.get("subsections", []))
            subsections = [
                RoadmapSubsection(
                    id=_normalize_identifier(
                        subsec.get("id") if isinstance(subsec, dict) else None,
                        f"{section_id}-sub-{idx + 1}",
                    ),
                    name=_normalize_text(
                        subsec.get("name") if isinstance(subsec, dict) else None,
                        f"Subsection {idx + 1}",
                    ),
                    order=_normalize_int(
                        subsec.get("order") if isinstance(subsec, dict) else None,
                        idx + 1,
                        minimum=1,
                    ),
                    description=_normalize_optional_text(
                        subsec.get("description") if isinstance(subsec, dict) else None
                    ),
                )
                for idx, subsec in enumerate(raw_subsections)
            ]

            if not subsections:
                subsections = [_default_subsection(section_id)]

            sections.append(
                RoadmapSection(
                    id=section_id,
                    name=_normalize_text(
                        section_data.get("name"),
                        f"Section {section_index + 1}",
                    ),
                    order=_normalize_int(
                        section_data.get("order"),
                        section_index + 1,
                        minimum=1,
                    ),
                    description=_normalize_optional_text(section_data.get("description")),
                    subsections=subsections,
                )
            )

        phases_data = _ensure_list(raw_data.get("phases", []))
        if not sections and phases_data:
            sections = [
                RoadmapSection(
                    id=_normalize_identifier(
                        phase.get("id") if isinstance(phase, dict) else None,
                        f"section-{index + 1}",
                    ),
                    name=_normalize_text(
                        phase.get("name") if isinstance(phase, dict) else None,
                        f"Section {index + 1}",
                    ),
                    order=_normalize_int(
                        phase.get("order") if isinstance(phase, dict) else None,
                        index + 1,
                        minimum=1,
                    ),
                    description=_normalize_optional_text(
                        phase.get("description") if isinstance(phase, dict) else None
                    ),
                    subsections=[
                        _default_subsection(
                            _normalize_identifier(
                                phase.get("id") if isinstance(phase, dict) else None,
                                f"section-{index + 1}",
                            )
                        )
                    ],
                )
                for index, phase in enumerate(phases_data)
            ]

        if not phases_data and sections:
            phases_data = [
                {"id": section.id, "name": section.name, "order": section.order}
                for section in sections
            ]

        phases = [
            RoadmapPhase(
                id=_normalize_identifier(
                    phase.get("id") if isinstance(phase, dict) else None,
                    f"phase-{index + 1}",
                ),
                name=_normalize_text(
                    phase.get("name") if isinstance(phase, dict) else None,
                    f"Phase {index + 1}",
                ),
                order=_normalize_int(
                    phase.get("order") if isinstance(phase, dict) else None,
                    index + 1,
                    minimum=1,
                ),
            )
            for index, phase in enumerate(phases_data)
        ]

        section_lookup = {
            section.id: section.subsections or [_default_subsection(section.id)]
            for section in sections
        }
        section_alias_map, subsection_aliases_by_section = _build_section_alias_maps(
            sections
        )
        first_section_id = sections[0].id if sections else "section-1"

        parsed_nodes: List[Dict[str, Any]] = []
        fallback_subsection_indexes_by_section: Dict[str, List[int]] = {}

        for node_index, raw_node in enumerate(_ensure_list(raw_data.get("nodes", []))):
            if not isinstance(raw_node, dict):
                continue

            node_data = raw_node.get("data", {}) if isinstance(raw_node.get("data"), dict) else {}
            learning_res = (
                node_data.get("learning_resources", {})
                if isinstance(node_data.get("learning_resources"), dict)
                else {}
            )

            raw_section_ref = (
                raw_node.get("section_id")
                or raw_node.get("phase_id")
                or raw_node.get("section")
                or raw_node.get("section_name")
                or first_section_id
            )
            section_id = _resolve_alias(raw_section_ref, section_alias_map, None) or _normalize_identifier(
                raw_section_ref,
                first_section_id,
            )
            if section_id not in section_lookup:
                section_id = first_section_id

            section_subsections = section_lookup.get(section_id) or [_default_subsection(section_id)]
            subsection_alias_map = subsection_aliases_by_section.get(section_id, {})
            raw_subsection_ref = (
                raw_node.get("subsection_id")
                or raw_node.get("subsection")
                or raw_node.get("subsection_name")
            )
            subsection_id = _resolve_alias(raw_subsection_ref, subsection_alias_map, None)
            phase_id = _normalize_identifier(raw_node.get("phase_id"), section_id)

            position_data = (
                raw_node.get("position", {})
                if isinstance(raw_node.get("position"), dict)
                else {}
            )

            node_type = _normalize_node_type(raw_node.get("type", "core"))

            parsed_nodes.append(
                {
                    "id": _normalize_identifier(raw_node.get("id"), f"node-{node_index + 1}"),
                    "phase_id": phase_id,
                    "section_id": section_id,
                    "subsection_id": subsection_id,
                    "type": node_type,
                    "is_hub": _normalize_bool(raw_node.get("is_hub", False), False),
                    "data": {
                        "label": _normalize_text(node_data.get("label"), "Unknown Topic"),
                        "description": _normalize_text(node_data.get("description"), ""),
                        "estimated_hours": _normalize_int(
                            node_data.get("estimated_hours"),
                            5,
                            minimum=1,
                        ),
                        "difficulty": _normalize_difficulty(
                            str(node_data.get("difficulty", "beginner"))
                        ),
                        "prerequisites": _normalize_string_list(
                            node_data.get("prerequisites", [])
                        ),
                        "learning_outcomes": _normalize_string_list(
                            node_data.get("learning_outcomes", [])
                        ),
                        "learning_resources": {
                            "keywords": _normalize_string_list(
                                learning_res.get("keywords", [])
                            ),
                            "suggested_type": _normalize_suggested_type(
                                str(learning_res.get("suggested_type", "video"))
                            ),
                        },
                    },
                    "position": {
                        "x": _normalize_float(position_data.get("x", 0), 0),
                        "y": _normalize_float(position_data.get("y", 0), 0),
                    },
                }
            )

            if not subsection_id:
                fallback_subsection_indexes_by_section.setdefault(section_id, []).append(
                    len(parsed_nodes) - 1
                )

        for section_id, node_indexes in fallback_subsection_indexes_by_section.items():
            section_subsections = section_lookup.get(section_id) or [_default_subsection(section_id)]
            lesson_counts: Counter[str] = Counter(
                node["subsection_id"]
                for node in parsed_nodes
                if node["section_id"] == section_id
                and node["subsection_id"]
                and node["type"] != "project"
            )

            for node_list_index in node_indexes:
                node = parsed_nodes[node_list_index]
                if node["type"] == "project":
                    target_subsection = max(
                        section_subsections,
                        key=lambda subsection: (
                            lesson_counts.get(subsection.id, 0),
                            -subsection.order,
                        ),
                    )
                else:
                    target_subsection = min(
                        section_subsections,
                        key=lambda subsection: (
                            lesson_counts.get(subsection.id, 0),
                            subsection.order,
                        ),
                    )
                    lesson_counts[target_subsection.id] += 1

                node["subsection_id"] = target_subsection.id

        nodes = [
            RoadmapNode(
                id=node["id"],
                phase_id=node["phase_id"],
                section_id=node["section_id"],
                subsection_id=node["subsection_id"],
                type=node["type"],
                is_hub=node["is_hub"],
                data=RoadmapNodeData(
                    label=node["data"]["label"],
                    description=node["data"]["description"],
                    estimated_hours=node["data"]["estimated_hours"],
                    difficulty=node["data"]["difficulty"],
                    prerequisites=node["data"]["prerequisites"],
                    learning_outcomes=node["data"]["learning_outcomes"],
                    learning_resources=LearningResources(
                        keywords=node["data"]["learning_resources"]["keywords"],
                        suggested_type=node["data"]["learning_resources"]["suggested_type"],
                    ),
                ),
                position=NodePosition(
                    x=node["position"]["x"],
                    y=node["position"]["y"],
                ),
            )
            for node in parsed_nodes
        ]

        edges = [
            RoadmapEdge(
                id=_normalize_identifier(
                    edge.get("id") if isinstance(edge, dict) else None,
                    f"e{index}",
                ),
                source=_normalize_identifier(
                    edge.get("source") if isinstance(edge, dict) else None,
                    "",
                ),
                target=_normalize_identifier(
                    edge.get("target") if isinstance(edge, dict) else None,
                    "",
                ),
            )
            for index, edge in enumerate(_ensure_list(raw_data.get("edges", [])))
            if isinstance(edge, dict)
        ]

        return GeneratedRoadmap(
            roadmap_title=_normalize_text(
                raw_data.get("roadmap_title"),
                "Learning Roadmap",
            ),
            roadmap_description=_normalize_text(
                raw_data.get("roadmap_description"),
                _normalize_text(raw_data.get("description"), ""),
            ),
            total_estimated_hours=_normalize_int(
                raw_data.get("total_estimated_hours"),
                0,
                minimum=0,
            ),
            sections=sections,
            phases=phases,
            nodes=nodes,
            edges=edges,
        )

    except Exception as exc:
        raise ValueError(f"Failed to parse roadmap data: {str(exc)}") from exc


def _validate_roadmap_quality(
    roadmap: GeneratedRoadmap,
    directives: Dict[str, Any],
) -> List[str]:
    issues: List[str] = []

    min_sections = directives["min_sections"]
    min_subsections = directives["min_subsections_per_section"]
    min_lessons = directives["min_lessons_per_subsection"]["min"]
    min_nodes = directives["target_node_range"]["min"]

    if len(roadmap.sections) < min_sections:
        issues.append(
            f"Expected at least {min_sections} sections but received {len(roadmap.sections)}."
        )

    if len(roadmap.nodes) < min_nodes:
        issues.append(
            f"Expected at least {min_nodes} nodes but received {len(roadmap.nodes)}."
        )

    for section in roadmap.sections:
        subsection_count = len(section.subsections or [])
        if subsection_count < min_subsections:
            issues.append(
                f"Section '{section.name}' has only {subsection_count} subsections; need at least {min_subsections}."
            )

    subsection_lesson_counts: Counter[str] = Counter(
        node.subsection_id
        for node in roadmap.nodes
        if node.subsection_id and node.type != "project"
    )
    for section in roadmap.sections:
        for subsection in section.subsections or []:
            lesson_count = subsection_lesson_counts.get(subsection.id, 0)
            if lesson_count < min_lessons:
                issues.append(
                    f"Subsection '{subsection.name}' has only {lesson_count} lesson nodes; need at least {min_lessons}."
                )

    isolated_nodes = []
    connected_node_ids = set()
    for edge in roadmap.edges:
        if edge.source:
            connected_node_ids.add(edge.source)
        if edge.target:
            connected_node_ids.add(edge.target)
    for node in roadmap.nodes:
        if node.id not in connected_node_ids:
            isolated_nodes.append(node.data.label)
    if isolated_nodes:
        issues.append(
            f"Found isolated nodes without edges: {', '.join(isolated_nodes[:5])}."
        )

    non_project_without_subsection = [
        node.data.label
        for node in roadmap.nodes
        if node.type != "project" and not node.subsection_id
    ]
    if non_project_without_subsection:
        issues.append(
            "Some learning nodes are missing subsection_id assignments."
        )

    core_nodes = [node for node in roadmap.nodes if node.type == "core"]
    if directives.get("require_learning_outcomes", True):
        missing_outcomes = [
            node.data.label for node in core_nodes if not node.data.learning_outcomes
        ]
        if missing_outcomes:
            issues.append(
                f"Core nodes missing learning outcomes: {', '.join(missing_outcomes[:5])}."
            )

    if directives.get("require_prerequisites", True):
        missing_prerequisites = [
            node.data.label
            for node in core_nodes
            if node.data.difficulty != "beginner" and not node.data.prerequisites
        ]
        if missing_prerequisites:
            issues.append(
                f"Advanced/intermediate core nodes missing prerequisites: {', '.join(missing_prerequisites[:5])}."
            )

    project_count = sum(1 for node in roadmap.nodes if node.type == "project")
    if roadmap.nodes and (project_count / len(roadmap.nodes)) > 0.2:
        issues.append(
            "Project/checkpoint nodes exceed the allowed density; the roadmap should remain lesson-heavy."
        )

    return issues


def _rebalance_nodes_across_subsections(
    roadmap: GeneratedRoadmap,
    directives: Dict[str, Any],
) -> None:
    min_lessons = directives["min_lessons_per_subsection"]["min"]
    node_order = {node.id: index for index, node in enumerate(roadmap.nodes)}

    for section in roadmap.sections:
        subsections = sorted(
            section.subsections or [],
            key=lambda subsection: subsection.order,
        )
        if len(subsections) <= 1:
            continue

        lesson_nodes = [
            node
            for node in roadmap.nodes
            if node.section_id == section.id and node.type != "project"
        ]
        if len(lesson_nodes) <= 1:
            continue

        counts = Counter(node.subsection_id for node in lesson_nodes if node.subsection_id)
        needs_rebalance = any(counts.get(subsection.id, 0) == 0 for subsection in subsections)

        if not needs_rebalance and len(lesson_nodes) >= len(subsections) * min_lessons:
            needs_rebalance = any(
                counts.get(subsection.id, 0) < min_lessons
                for subsection in subsections
            )

        if not needs_rebalance:
            continue

        ordered_lesson_nodes = sorted(
            lesson_nodes,
            key=lambda node: (
                node_order.get(node.id, 0),
                0 if node.is_hub else 1,
            ),
        )

        base_count = len(ordered_lesson_nodes) // len(subsections)
        remainder = len(ordered_lesson_nodes) % len(subsections)

        cursor = 0
        for subsection_index, subsection in enumerate(subsections):
            target_count = base_count + (1 if subsection_index < remainder else 0)
            for _ in range(target_count):
                if cursor >= len(ordered_lesson_nodes):
                    break
                ordered_lesson_nodes[cursor].subsection_id = subsection.id
                cursor += 1

        project_nodes = [
            node for node in roadmap.nodes if node.section_id == section.id and node.type == "project"
        ]
        if project_nodes:
            last_subsection_id = subsections[-1].id
            for project_node in project_nodes:
                project_node.subsection_id = project_node.subsection_id or last_subsection_id


def _build_repair_prompt(user_prompt: str, issues: List[str]) -> str:
    bullet_list = "\n".join(f"- {issue}" for issue in issues)
    return (
        f"{user_prompt}\n\n"
        "REPAIR THE ROADMAP JSON.\n"
        "The previous response failed these validation checks:\n"
        f"{bullet_list}\n\n"
        "Generate a completely new JSON object from scratch that satisfies every failed check.\n"
        "Use the EXACT section.id and subsection.id references inside nodes.section_id and nodes.subsection_id.\n"
        "Do not use subsection names where subsection IDs are required.\n"
        "Do not explain anything. Return JSON only.\n"
    )


def _synthesize_edges(roadmap: GeneratedRoadmap) -> List[RoadmapEdge]:
    """
    Automatically generate edges when the AI fails to produce them.
    Builds a DAG based on section/subsection/node structure:
      1. Hub nodes → lesson nodes within the same subsection
      2. Sequential lesson nodes within the same subsection
      3. Last node of subsection N → first node of subsection N+1 (within a section)
      4. Last node of section N → first node of section N+1 (cross-section bridges)
    """
    if not roadmap.nodes or not roadmap.sections:
        return []

    edges: List[RoadmapEdge] = []
    edge_set: set = set()  # (source, target) to avoid duplicates
    edge_counter: List[int] = [0]  # mutable counter for closure access

    def _add_edge(source_id: str, target_id: str) -> None:
        pair = (source_id, target_id)
        if pair in edge_set or source_id == target_id:
            return
        edge_set.add(pair)
        edge_counter[0] += 1
        edges.append(RoadmapEdge(
            id=f"e-syn-{edge_counter[0]}",
            source=source_id,
            target=target_id,
        ))

    node_order = {node.id: idx for idx, node in enumerate(roadmap.nodes)}
    sorted_sections = sorted(roadmap.sections, key=lambda s: s.order)

    section_last_nodes: List[Optional[str]] = []
    section_first_nodes: List[Optional[str]] = []

    for section in sorted_sections:
        sorted_subsections = sorted(section.subsections or [], key=lambda sub: sub.order)
        subsection_ids = [sub.id for sub in sorted_subsections]

        section_nodes = [
            n for n in roadmap.nodes if n.section_id == section.id
        ]
        if not section_nodes:
            section_first_nodes.append(None)
            section_last_nodes.append(None)
            continue

        first_node_in_section: Optional[str] = None
        last_node_in_section: Optional[str] = None
        prev_subsection_last_node: Optional[str] = None

        for sub_id in subsection_ids:
            sub_nodes = [
                n for n in section_nodes if n.subsection_id == sub_id
            ]
            if not sub_nodes:
                continue

            hub_nodes = [n for n in sub_nodes if n.is_hub]
            lesson_nodes = [n for n in sub_nodes if not n.is_hub and n.type != "project"]
            project_nodes = [n for n in sub_nodes if n.type == "project"]

            lesson_nodes.sort(key=lambda n: node_order.get(n.id, 0))
            hub_nodes.sort(key=lambda n: node_order.get(n.id, 0))

            ordered_non_project = hub_nodes + lesson_nodes
            if not ordered_non_project:
                ordered_non_project = project_nodes
            if not ordered_non_project:
                continue

            first_in_sub = ordered_non_project[0].id
            if first_node_in_section is None:
                first_node_in_section = first_in_sub

            # Connect from previous subsection's last node
            if prev_subsection_last_node:
                _add_edge(prev_subsection_last_node, first_in_sub)

            # Hub → lesson connections
            for hub in hub_nodes:
                for lesson in lesson_nodes:
                    _add_edge(hub.id, lesson.id)

            # Sequential lesson connections within subsection
            for i in range(len(lesson_nodes) - 1):
                _add_edge(lesson_nodes[i].id, lesson_nodes[i + 1].id)

            # Lessons → project connections
            if project_nodes and lesson_nodes:
                last_lesson = lesson_nodes[-1] if lesson_nodes else (hub_nodes[-1] if hub_nodes else None)
                if last_lesson:
                    for proj in project_nodes:
                        _add_edge(last_lesson.id, proj.id)

            # Track last node in subsection
            if project_nodes:
                prev_subsection_last_node = project_nodes[-1].id
                last_node_in_section = project_nodes[-1].id
            elif lesson_nodes:
                prev_subsection_last_node = lesson_nodes[-1].id
                last_node_in_section = lesson_nodes[-1].id
            elif hub_nodes:
                prev_subsection_last_node = hub_nodes[-1].id
                last_node_in_section = hub_nodes[-1].id

        section_first_nodes.append(first_node_in_section)
        section_last_nodes.append(last_node_in_section)

    # Cross-section bridges
    for i in range(len(section_last_nodes) - 1):
        src = section_last_nodes[i]
        tgt = section_first_nodes[i + 1]
        if src and tgt:
            _add_edge(src, tgt)

    return edges


def _collect_structural_issues(roadmap: GeneratedRoadmap) -> List[str]:
    issues: List[str] = []

    if not roadmap.sections:
        issues.append("Roadmap has no sections.")

    if not roadmap.nodes:
        issues.append("Roadmap has no nodes.")
        return issues

    non_project_nodes = [node for node in roadmap.nodes if node.type != "project"]
    if len(non_project_nodes) < max(3, min(8, len(roadmap.sections) or 1)):
        issues.append("Roadmap has too few learning nodes to be usable.")

    # Edge issues are no longer structural blockers because we can synthesize them

    active_sections = {node.section_id for node in non_project_nodes if node.section_id}
    if len(roadmap.sections) > 1 and len(active_sections) < 2:
        issues.append("Learning nodes are concentrated into too few sections.")

    missing_subsection_count = sum(
        1
        for node in non_project_nodes
        if not node.subsection_id
    )
    if non_project_nodes and (missing_subsection_count / len(non_project_nodes)) > 0.5:
        issues.append("Too many learning nodes are missing subsection_id assignments.")

    return issues


async def generate_roadmap(
    profile: UserProfileRequest,
    generation_directives: Optional[GenerationDirectivesRequest] = None,
) -> RoadmapResponse:
    """
    Generate a personalized learning roadmap based on user profile.
    """

    directives = _generation_directives_to_dict(profile, generation_directives)
    generation_preferences = profile.generation_preferences.model_dump()

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
        audience_type=profile.audience_type,
        specific_job=profile.specific_job,
        class_level=profile.class_level,
        major=profile.major,
        study_year=profile.study_year,
        generation_preferences=generation_preferences,
        generation_directives=directives,
    )

    raw_roadmap, raw_metadata = await generate_roadmap_json(user_prompt)
    roadmap = validate_and_parse_roadmap(raw_roadmap)
    _rebalance_nodes_across_subsections(roadmap, directives)

    # Auto-synthesize edges when AI returns none (common with large roadmaps
    # where Groq output gets truncated before the edges array)
    if roadmap.nodes and not roadmap.edges:
        logger.warning(
            "AI returned %d nodes but 0 edges — synthesizing edges from structure.",
            len(roadmap.nodes),
        )
        roadmap.edges = _synthesize_edges(roadmap)

    quality_issues = _validate_roadmap_quality(roadmap, directives)

    if quality_issues:
        repair_prompt = _build_repair_prompt(user_prompt, quality_issues)
        raw_roadmap, raw_metadata = await generate_roadmap_json(repair_prompt)
        roadmap = validate_and_parse_roadmap(raw_roadmap)
        _rebalance_nodes_across_subsections(roadmap, directives)

        # Auto-synthesize edges again for the repair attempt
        if roadmap.nodes and not roadmap.edges:
            logger.warning(
                "Repair attempt also returned 0 edges — synthesizing edges from structure.",
            )
            roadmap.edges = _synthesize_edges(roadmap)

        quality_issues = _validate_roadmap_quality(roadmap, directives)
        if quality_issues:
            joined = "; ".join(quality_issues[:6])
            structural_issues = _collect_structural_issues(roadmap)
            if structural_issues:
                raise ValueError(
                    "Generated roadmap remained structurally invalid after repair: "
                    + "; ".join(structural_issues[:6])
                )
            logger.warning(
                "Returning roadmap with non-fatal quality warnings after repair: %s",
                joined,
            )

    personalization_score = calculate_personalization_score(profile, roadmap)
    metadata = GenerationMetadata(
        model=raw_metadata["model"],
        input_tokens=raw_metadata["input_tokens"],
        output_tokens=raw_metadata["output_tokens"],
        latency_ms=raw_metadata["latency_ms"],
        prompt_version=raw_metadata["prompt_version"],
        personalization_score=personalization_score,
        quality_warnings=quality_issues,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )

    return RoadmapResponse(
        success=True,
        roadmap=roadmap,
        metadata=metadata,
    )
