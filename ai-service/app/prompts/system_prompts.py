"""
System Prompts for AI Roadmap Generation (Optimized)
"""
from typing import List

# =============================================================================
# SYSTEM PROMPT - TỐI ƯU HÓA CHO MỌI ROLE
# =============================================================================

ROADMAP_SYSTEM_PROMPT = """You are an expert Tech Career Mentor & Curriculum Architect with deep knowledge of modern technology stacks (Frontend, Backend, DevOps, AI, Mobile, etc.).

OBJECTIVE: Create a comprehensive, branching learning roadmap similar to "roadmap.sh" for ANY requested role.
OUTPUT FORMAT: Strict JSON.

### 1. STRUCTURAL RULES (THE "ROADMAP.SH" STYLE)
You must generate a **Directed Acyclic Graph (DAG)**, not a linear list.
- **Hierarchical Structure:** Section -> Sub-section -> Hub Node -> Detail Nodes.
- **The "Hub & Spoke" Pattern (MANDATORY):**
    - **Hub Node (`is_hub: true`):** Represents a core concept (e.g., "React Hooks", "Docker Basics").
    - **Detail Nodes:** Small, specific topics branching OUT from a Hub (e.g., "useEffect", "useState").
    - **Flow:** Hub A (branches out) --> [Detail 1, Detail 2, Detail 3] --> (converge in) --> Hub B.

### 2. CONTENT RULES
- **Comprehensive:** Cover everything from Fundamentals -> Advanced -> Ecosystem -> Best Practices.
- **Role-Agnostic:** Dynamically determine the standard industry path for the requested `target_role`.
- **Granularity:** - Short timeline (1-3 months): Focus on Core & MVP skills.
    - Long timeline (6+ months): Include Deep dives, Architecture, and surrounding Ecosystems.

### 3. JSON OUTPUT SCHEMA
Return ONLY a valid JSON object with this structure:
{
  "roadmap_title": "string",
  "description": "string",
  "sections": [
    { "id": "sec-1", "name": "string", "order": 1 }
  ],
  "nodes": [
    {
      "id": "string",
      "section_id": "string",
      "type": "core" | "optional" | "project",
      "is_hub": boolean, // TRUE for main concepts, FALSE for leaves
      "data": {
        "label": "string",
        "description": "string",
        "estimated_hours": number,
        "difficulty": "beginner" | "intermediate" | "advanced",
        "learning_resources": { "keywords": ["string"], "suggested_type": "video"|"doc"|"project" }
      },
      "position": { "x": 0, "y": 0 } // AI estimates relative position flow
    }
  ],
  "edges": [
    { "id": "e1", "source": "node-id", "target": "node-id" }
  ]
}

### 4. EDGE LOGIC (CRITICAL)
- Connect a **Section Hub** to its **Detail Nodes**.
- Connect the **Last Hub** of a section to the **First Hub** of the next section.
- Ensure there are NO isolated nodes.
"""

# =============================================================================
# USER PROMPT BUILDER
# =============================================================================

def build_user_prompt(
    current_role: str,
    target_role: str,
    current_skills: List[str],
    skill_level: str,
    learning_style: List[str],
    hours_per_week: int,
    target_months: int,
    preferred_language: str,
    focus_areas: List[str] | None = None,
) -> str:
    """Builds a dynamic prompt based on user constraints."""
    
    # Tính toán khối lượng công việc
    total_hours = hours_per_week * target_months * 4
    
    # Định nghĩa độ sâu dựa trên thời gian
    if target_months <= 3:
        complexity = "Compact & Fast-track (Focus on MVP skills)"
        min_nodes = 40
        min_hubs = 8
    elif target_months <= 6:
        complexity = "Standard Professional Path (Balanced theory & practice)"
        min_nodes = 80
        min_hubs = 15
    else:
        complexity = "Deep Mastery (Full ecosystem, internals, and architecture)"
        min_nodes = 120
        min_hubs = 25

    skills_text = ", ".join(current_skills) if current_skills else "None"
    focus_text = ", ".join(focus_areas) if focus_areas else "Standard path"
    
    lang_instruction = "VIETNAMESE (Tiếng Việt)" if preferred_language == "vi" else "ENGLISH"

    prompt = f"""
    GENERATE A LEARNING ROADMAP FOR:
    - **Target Role:** {target_role}
    - **Current Context:** {current_role} (Level: {skill_level})
    - **Known Skills (Skip basics of these):** {skills_text}
    - **Focus Areas:** {focus_text}
    - **Constraints:** {target_months} months ({hours_per_week}h/week ≈ {total_hours}h total).
    - **Complexity Level:** {complexity}
    - **Language:** Output content in {lang_instruction}.

    REQUIREMENTS:
    1. **Topology:** Create a Branching Tree.
       - Create at least {min_hubs} HUB NODES (Major Concepts).
       - Create at least {min_nodes} TOTAL NODES.
       - Each Hub must branch into 3-6 Detail Nodes.
    
    2. **Content Coverage:**
       - Analyze the `{target_role}` role carefully.
       - Break it down into standard industry sections (e.g., Fundamentals, Core Tools, Frameworks, Advanced Patterns, Deployment).
       - Include strictly necessary "Modern Standards" (e.g., CI/CD, Security, Performance).
    
    3. **Projects:** - Insert a "Project Node" after every major section to consolidate knowledge.

    4. **Output:** - JSON only. No markdown text before or after.
       - Ensure `is_hub` is correctly set for parent nodes.
    """
    
    return prompt