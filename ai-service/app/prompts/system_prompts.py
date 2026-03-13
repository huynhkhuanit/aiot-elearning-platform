"""
System prompts for AI roadmap generation.
"""

from typing import Any, Dict, List, Optional


ROADMAP_SYSTEM_PROMPT = """You are an expert Tech Career Mentor, Curriculum Architect, and Knowledge Map Designer.

Your job is to generate a dense, accurate, theory-grounded learning roadmap for a specific learner profile.

Return ONLY one valid JSON object. No markdown. No prose outside JSON.

NON-NEGOTIABLE OUTPUT RULES:
1. The root object must contain:
   - "roadmap_title"
   - "roadmap_description"
   - "total_estimated_hours"
   - "sections"
   - "nodes"
   - "edges"
2. "sections" must be a non-empty array. Every section must include:
   - "id", "name", "order", "description"
   - "subsections": non-empty array
3. Every subsection must include:
   - "id", "name", "order", "description"
4. Every node must include:
   - "id"
   - "section_id"
   - "subsection_id" for all learning nodes
   - "type": one of "core", "optional", "project", "alternative"
   - "is_hub": boolean
   - "data": {
       "label",
       "description",
       "estimated_hours",
       "difficulty",
       "prerequisites",
       "learning_outcomes",
       "learning_resources": {
         "keywords",
         "suggested_type"
       }
     }
5. Use roadmap.sh-like structure:
   - Section -> Subsection -> hub node -> detailed lesson nodes -> checkpoint/milestone
6. The graph must be a DAG with NO isolated nodes.
7. Difficulty must progress from beginner -> intermediate -> advanced inside each section when appropriate.
8. Core learning nodes must include meaningful learning outcomes.
9. Project/checkpoint nodes should stay limited; prioritize lessons, theory, and concept coverage.
10. Prefer smaller lesson nodes over giant vague nodes. Split broad topics into teachable pieces.

CONTENT QUALITY RULES:
- Be comprehensive and accurate for the requested target role.
- Cover foundations, internals, practical standards, and ecosystem knowledge.
- Include theoretical concepts, terminology, mental models, and best practices.
- When the learner prefers theory-heavy content, bias learning_resources.suggested_type toward "doc".
- When outputting projects, use them as checkpoints/capstones, not as the majority of nodes.
- Descriptions should explain what the learner studies and why it matters.
- Prerequisites must reference human-readable prior topics, not node IDs.
- Learning outcomes must be concrete and skill-oriented.

EDGE RULES (CRITICAL - DO NOT SKIP):
- The "edges" array is MANDATORY and must NOT be empty.
- Connect section progression from earlier hubs to later hubs.
- Connect hub nodes to detailed lesson nodes inside the same subsection.
- Connect sequential lesson nodes within each subsection.
- Connect lesson clusters to milestone or checkpoint nodes when appropriate.
- Every node must have at least one incoming or outgoing edge, except the very first hub and the final capstone endpoint.
- Each edge must have: "id", "source" (source node id), "target" (target node id).

OUTPUT ORDERING:
- Write "edges" immediately after "nodes" in the JSON output.
- Do NOT place edges at the very end of the JSON — ensure they are generated before reaching any token limit.
"""


def _default_generation_directives(
    hours_per_week: int,
    target_months: int,
) -> Dict[str, Any]:
    total_hours = hours_per_week * target_months * 4

    if target_months <= 3:
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

    if target_months <= 6:
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


def _content_bias_instruction(content_bias: str) -> str:
    mapping = {
        "theory_heavy": (
            "Bias strongly toward theory, concepts, mental models, terminology, docs, "
            "and structured lessons. Keep projects sparse."
        ),
        "practice_heavy": (
            "Keep theory concise and move faster into applied implementation, checkpoints, "
            "and hands-on consolidation."
        ),
        "balanced": (
            "Balance theoretical grounding with practical application and checkpoints."
        ),
    }
    return mapping.get(content_bias, mapping["balanced"])


def _foundation_instruction(foundation_coverage: str) -> str:
    mapping = {
        "full_foundation": (
            "Do not skip fundamentals. Build a full conceptual base before advanced tooling."
        ),
        "fast_track": (
            "Compress fundamentals where safe, but still keep prerequisite links explicit."
        ),
        "auto": (
            "Adjust foundation depth based on learner background while preserving coherence."
        ),
    }
    return mapping.get(foundation_coverage, mapping["auto"])


def _resource_hint(content_bias: str, learning_style: List[str]) -> str:
    if content_bias == "theory_heavy":
        return (
            "Prefer learning_resources.suggested_type='doc' for most core theory nodes. "
            "Use 'video' or 'project' only when they better fit the topic."
        )

    if "documentation" in learning_style:
        return "Lean toward 'doc' for core nodes unless the topic is best taught visually."
    if "project" in learning_style:
        return "Mix 'doc' for theory nodes and 'project' for checkpoints."
    if "video" in learning_style:
        return "Use 'video' for explanation-heavy nodes, but keep docs for theory depth."
    return "Select suggested_type pragmatically per topic."


def build_user_prompt(
    current_role: str,
    target_role: str,
    current_skills: List[str],
    skill_level: str,
    learning_style: List[str],
    hours_per_week: int,
    target_months: int,
    preferred_language: str,
    focus_areas: Optional[List[str]] = None,
    audience_type: Optional[str] = None,
    specific_job: Optional[str] = None,
    class_level: Optional[str] = None,
    major: Optional[str] = None,
    study_year: Optional[int] = None,
    generation_preferences: Optional[Dict[str, Any]] = None,
    generation_directives: Optional[Dict[str, Any]] = None,
) -> str:
    """Build a dense roadmap request based on user profile and directives."""

    preferences = {
        "content_bias": "theory_heavy",
        "roadmap_depth": "deep",
        "lesson_granularity": "detailed",
        "foundation_coverage": "auto",
    }
    if generation_preferences:
        preferences.update(generation_preferences)

    directives = generation_directives or _default_generation_directives(
        hours_per_week=hours_per_week,
        target_months=target_months,
    )

    total_hours = directives["available_hours_total"]
    skills_text = ", ".join(current_skills) if current_skills else "None"
    focus_text = ", ".join(focus_areas) if focus_areas else "Standard path"
    lang_instruction = "Vietnamese" if preferred_language == "vi" else "English"

    audience_context = _build_audience_context(
        audience_type=audience_type,
        specific_job=specific_job,
        class_level=class_level,
        major=major,
        study_year=study_year,
    )

    return f"""
GENERATE A LEARNING ROADMAP FOR THIS LEARNER:
- Target role: {target_role}
- Current context: {current_role}
- Audience context: {audience_context}
- Current level: {skill_level}
- Known skills: {skills_text}
- Focus areas to emphasize: {focus_text}
- Available time: {target_months} months, {hours_per_week} hours/week, about {total_hours} total hours
- Output language: {lang_instruction}

GENERATION PREFERENCES:
- Content bias: {preferences["content_bias"]}
- Roadmap depth: {preferences["roadmap_depth"]}
- Lesson granularity: {preferences["lesson_granularity"]}
- Foundation coverage: {preferences["foundation_coverage"]}

DIRECT STRUCTURE TARGETS:
- Generate between {directives["target_node_range"]["min"]} and {directives["target_node_range"]["max"]} total nodes.
- Generate at least {directives["min_sections"]} sections.
- Generate at least {directives["min_subsections_per_section"]} subsections per section.
- Generate at least {directives["min_lessons_per_subsection"]["min"]}-{directives["min_lessons_per_subsection"]["max"]} lesson nodes per subsection.
- Keep project/checkpoint density aligned with: {directives["project_cadence"]}.
- Target theory-heavy lesson ratio around {directives["theory_ratio_target"]}.

QUALITY REQUIREMENTS:
- Every section must have a clear conceptual theme and supporting subsections.
- Every subsection must contain a progression from foundations to more advanced lessons when appropriate.
- Use hub nodes for major concepts and smaller lesson nodes beneath them.
- Populate learning outcomes for core nodes.
- Populate prerequisites when needed to preserve learning order.
- Keep project nodes around 10-15% of total nodes, not more.
- Use accurate, industry-relevant sequencing for the target role.
- Avoid generic filler nodes like "Learn more" or "Advanced topics".

INSTRUCTION BIASES:
- {_content_bias_instruction(preferences["content_bias"])}
- {_foundation_instruction(preferences["foundation_coverage"])}
- {_resource_hint(preferences["content_bias"], learning_style)}

OUTPUT REQUIREMENTS:
- Return JSON only.
- Use "roadmap_description" exactly, not "description" at root.
- Ensure nodes use section_id and subsection_id consistently.
- nodes.section_id must reference an existing sections[].id, not a section name.
- nodes.subsection_id must reference an existing sections[].subsections[].id, not a subsection name.
- Ensure all nodes participate in the graph.
"""


def _build_audience_context(
    audience_type: Optional[str],
    specific_job: Optional[str] = None,
    class_level: Optional[str] = None,
    major: Optional[str] = None,
    study_year: Optional[int] = None,
) -> str:
    """Build a rich audience context string from audience type and detail fields."""

    at = audience_type or "worker"

    if at == "worker":
        job_info = f" working as {specific_job}" if specific_job else ""
        return (
            f"The learner is a working professional{job_info} looking to upskill or change careers. "
            "Respect their limited weekly time and prior real-world experience."
        )

    if at == "non-worker":
        return (
            "The learner is not currently employed and wants a structured roadmap from fundamentals upward."
        )

    if at == "student":
        grade_info = f" in grade {class_level}" if class_level else ""
        return (
            f"The learner is a high school student{grade_info}. Keep explanations foundational, clear, and progressive."
        )

    if at == "university_student":
        parts = ["The learner is a university student"]
        if major:
            parts.append(f"majoring in {major}")
        if study_year:
            parts.append(f"in year {study_year}")
        parts.append("who needs stronger job-ready knowledge without losing theoretical grounding.")
        return " ".join(parts)

    if at == "recent_graduate":
        major_info = f" in {major}" if major else ""
        return (
            f"The learner recently graduated{major_info} and needs practical readiness plus strong conceptual foundations."
        )

    legacy_descriptions = {
        "self-learner": "The learner studies independently for career growth.",
        "teacher": "The user is a teacher or lecturer building a curriculum outline.",
        "team-lead": "The user is a team lead who needs a structured upskilling path.",
        "mentor": "The user is a mentor guiding someone else's progress.",
        "content-creator": "The user creates learning content and needs a dense structured map.",
        "other": "General-purpose learner context.",
    }
    return legacy_descriptions.get(at, legacy_descriptions["self-learner"])
