from app.services.roadmap_generator import (
    _collect_structural_issues,
    _rebalance_nodes_across_subsections,
    _validate_roadmap_quality,
    validate_and_parse_roadmap,
)


def test_validate_and_parse_roadmap_adds_default_subsections():
    raw_data = {
        "roadmap_title": "Frontend Roadmap",
        "roadmap_description": "Dense frontend path",
        "total_estimated_hours": 80,
        "sections": [
            {
                "id": "section-1",
                "name": "Foundation",
                "order": 1,
                "description": "Core theory",
            }
        ],
        "nodes": [
            {
                "id": "node-1",
                "section_id": "section-1",
                "type": "core",
                "is_hub": True,
                "data": {
                    "label": "Internet basics",
                    "description": "HTTP and browsers",
                    "estimated_hours": 6,
                    "difficulty": "beginner",
                    "prerequisites": [],
                    "learning_outcomes": ["Explain the request lifecycle"],
                    "learning_resources": {
                        "keywords": ["http", "browser"],
                        "suggested_type": "doc",
                    },
                },
            }
        ],
        "edges": [],
    }

    roadmap = validate_and_parse_roadmap(raw_data)

    assert len(roadmap.sections) == 1
    assert len(roadmap.sections[0].subsections) == 1
    assert roadmap.nodes[0].subsection_id == "section-1-sub-1"


def test_validate_and_parse_roadmap_synthesizes_sections_from_legacy_phases():
    raw_data = {
        "roadmap_title": "Backend Roadmap",
        "roadmap_description": "Legacy structure",
        "total_estimated_hours": 120,
        "phases": [
            {"id": "phase-1", "name": "Basics", "order": 1},
        ],
        "nodes": [
            {
                "id": "node-1",
                "phase_id": "phase-1",
                "type": "core",
                "data": {
                    "label": "Databases",
                    "description": "Relational concepts",
                    "estimated_hours": 8,
                    "difficulty": "beginner",
                    "prerequisites": [],
                    "learning_outcomes": ["Describe normalization"],
                    "learning_resources": {
                        "keywords": ["sql"],
                        "suggested_type": "doc",
                    },
                },
            }
        ],
        "edges": [],
    }

    roadmap = validate_and_parse_roadmap(raw_data)

    assert roadmap.sections[0].id == "phase-1"
    assert roadmap.sections[0].subsections[0].id == "phase-1-sub-1"
    assert roadmap.nodes[0].section_id == "phase-1"


def test_validate_and_parse_roadmap_coerces_numeric_ids_to_strings():
    raw_data = {
        "roadmap_title": "Systems Roadmap",
        "roadmap_description": "Numeric identifiers from model output",
        "total_estimated_hours": 60,
        "sections": [
            {
                "id": 1,
                "name": "Foundations",
                "order": 1,
                "subsections": [
                    {
                        "id": 11,
                        "name": "Theory",
                        "order": 1,
                    }
                ],
            }
        ],
        "nodes": [
            {
                "id": 101,
                "section_id": 1,
                "subsection_id": 11,
                "type": "core",
                "data": {
                    "label": "Operating systems basics",
                    "description": "Processes and threads",
                    "estimated_hours": 6,
                    "difficulty": "beginner",
                    "prerequisites": [],
                    "learning_outcomes": ["Explain scheduling basics"],
                    "learning_resources": {
                        "keywords": ["operating systems", 123],
                        "suggested_type": "doc",
                    },
                },
            },
            {
                "id": 102,
                "section_id": 1,
                "subsection_id": 11,
                "type": "core",
                "data": {
                    "label": "Memory management",
                    "description": "Paging and segmentation",
                    "estimated_hours": 8,
                    "difficulty": "intermediate",
                    "prerequisites": [101],
                    "learning_outcomes": ["Compare virtual memory techniques"],
                    "learning_resources": {
                        "keywords": ["memory"],
                        "suggested_type": "doc",
                    },
                },
            },
        ],
        "edges": [
            {"id": 1, "source": 101, "target": 102},
        ],
    }

    roadmap = validate_and_parse_roadmap(raw_data)

    assert roadmap.sections[0].id == "1"
    assert roadmap.sections[0].subsections[0].id == "11"
    assert roadmap.nodes[0].id == "101"
    assert roadmap.nodes[0].section_id == "1"
    assert roadmap.nodes[0].subsection_id == "11"
    assert roadmap.nodes[1].data.prerequisites == ["101"]
    assert roadmap.nodes[0].data.learning_resources.keywords == ["operating systems", "123"]
    assert roadmap.edges[0].id == "1"
    assert roadmap.edges[0].source == "101"
    assert roadmap.edges[0].target == "102"


def test_validate_and_parse_roadmap_maps_subsection_names_to_ids():
    raw_data = {
        "roadmap_title": "Database Roadmap",
        "roadmap_description": "Model uses subsection names inside nodes",
        "total_estimated_hours": 48,
        "sections": [
            {
                "id": "section-1",
                "name": "Database Fundamentals",
                "order": 1,
                "subsections": [
                    {
                        "id": "section-1-sub-1",
                        "name": "Cơ Sở Dữ Liệu",
                        "order": 1,
                    },
                    {
                        "id": "section-1-sub-2",
                        "name": "Thiết Kế Cơ Sở Dữ Liệu",
                        "order": 2,
                    },
                ],
            }
        ],
        "nodes": [
            {
                "id": "node-1",
                "section_id": "Database Fundamentals",
                "subsection_id": "Cơ Sở Dữ Liệu",
                "type": "core",
                "data": {
                    "label": "Relational models",
                    "description": "Entity relationships",
                    "estimated_hours": 5,
                    "difficulty": "beginner",
                    "prerequisites": [],
                    "learning_outcomes": ["Explain relational concepts"],
                    "learning_resources": {
                        "keywords": ["database"],
                        "suggested_type": "doc",
                    },
                },
            },
            {
                "id": "node-2",
                "section_id": "Database Fundamentals",
                "subsection_id": "Thiết Kế Cơ Sở Dữ Liệu",
                "type": "core",
                "data": {
                    "label": "Normalization",
                    "description": "Table design tradeoffs",
                    "estimated_hours": 6,
                    "difficulty": "intermediate",
                    "prerequisites": ["Relational models"],
                    "learning_outcomes": ["Normalize a schema"],
                    "learning_resources": {
                        "keywords": ["normalization"],
                        "suggested_type": "doc",
                    },
                },
            },
        ],
        "edges": [
            {"id": "e1", "source": "node-1", "target": "node-2"},
        ],
    }

    roadmap = validate_and_parse_roadmap(raw_data)

    assert roadmap.nodes[0].section_id == "section-1"
    assert roadmap.nodes[0].subsection_id == "section-1-sub-1"
    assert roadmap.nodes[1].subsection_id == "section-1-sub-2"


def test_quality_gate_flags_missing_density_and_learning_outcomes():
    roadmap = validate_and_parse_roadmap(
        {
            "roadmap_title": "Sparse roadmap",
            "roadmap_description": "Too shallow",
            "total_estimated_hours": 20,
            "sections": [
                {
                    "id": "section-1",
                    "name": "Only section",
                    "order": 1,
                    "description": "Sparse",
                    "subsections": [
                        {
                            "id": "section-1-sub-1",
                            "name": "Only subsection",
                            "order": 1,
                            "description": "Sparse subsection",
                        }
                    ],
                }
            ],
            "nodes": [
                {
                    "id": "node-1",
                    "section_id": "section-1",
                    "subsection_id": "section-1-sub-1",
                    "type": "core",
                    "data": {
                        "label": "Single topic",
                        "description": "Not enough detail",
                        "estimated_hours": 5,
                        "difficulty": "intermediate",
                        "prerequisites": [],
                        "learning_outcomes": [],
                        "learning_resources": {
                            "keywords": ["topic"],
                            "suggested_type": "doc",
                        },
                    },
                }
            ],
            "edges": [],
        }
    )

    issues = _validate_roadmap_quality(
        roadmap,
        {
            "min_sections": 2,
            "target_node_range": {"min": 4, "max": 10},
            "min_subsections_per_section": 2,
            "min_lessons_per_subsection": {"min": 2, "max": 3},
            "require_learning_outcomes": True,
            "require_prerequisites": True,
        },
    )

    assert any("Expected at least 2 sections" in issue for issue in issues)
    assert any("Core nodes missing learning outcomes" in issue for issue in issues)
    assert any("isolated nodes" in issue for issue in issues)


def test_quality_gate_accepts_dense_valid_structure():
    roadmap = validate_and_parse_roadmap(
        {
            "roadmap_title": "Valid roadmap",
            "roadmap_description": "Enough structure",
            "total_estimated_hours": 40,
            "sections": [
                {
                    "id": "section-1",
                    "name": "Foundation",
                    "order": 1,
                    "description": "Start here",
                    "subsections": [
                        {
                            "id": "section-1-sub-1",
                            "name": "Core",
                            "order": 1,
                            "description": "Core concepts",
                        }
                    ],
                },
                {
                    "id": "section-2",
                    "name": "Advanced",
                    "order": 2,
                    "description": "Go deeper",
                    "subsections": [
                        {
                            "id": "section-2-sub-1",
                            "name": "Systems",
                            "order": 1,
                            "description": "Systems concepts",
                        }
                    ],
                },
            ],
            "nodes": [
                {
                    "id": "node-1",
                    "section_id": "section-1",
                    "subsection_id": "section-1-sub-1",
                    "type": "core",
                    "data": {
                        "label": "HTTP fundamentals",
                        "description": "Theory of request/response",
                        "estimated_hours": 6,
                        "difficulty": "beginner",
                        "prerequisites": [],
                        "learning_outcomes": ["Explain HTTP verbs"],
                        "learning_resources": {
                            "keywords": ["http"],
                            "suggested_type": "doc",
                        },
                    },
                },
                {
                    "id": "node-2",
                    "section_id": "section-1",
                    "subsection_id": "section-1-sub-1",
                    "type": "core",
                    "data": {
                        "label": "Browser flow",
                        "description": "Rendering and networking",
                        "estimated_hours": 6,
                        "difficulty": "intermediate",
                        "prerequisites": ["HTTP fundamentals"],
                        "learning_outcomes": ["Trace a request in the browser"],
                        "learning_resources": {
                            "keywords": ["browser"],
                            "suggested_type": "doc",
                        },
                    },
                },
                {
                    "id": "node-3",
                    "section_id": "section-2",
                    "subsection_id": "section-2-sub-1",
                    "type": "core",
                    "data": {
                        "label": "Caching strategy",
                        "description": "Caching layers and tradeoffs",
                        "estimated_hours": 8,
                        "difficulty": "intermediate",
                        "prerequisites": ["Browser flow"],
                        "learning_outcomes": ["Compare cache strategies"],
                        "learning_resources": {
                            "keywords": ["cache"],
                            "suggested_type": "doc",
                        },
                    },
                },
                {
                    "id": "node-3b",
                    "section_id": "section-2",
                    "subsection_id": "section-2-sub-1",
                    "type": "core",
                    "data": {
                        "label": "Cache invalidation",
                        "description": "Maintain consistency and freshness",
                        "estimated_hours": 6,
                        "difficulty": "advanced",
                        "prerequisites": ["Caching strategy"],
                        "learning_outcomes": ["Choose an invalidation approach"],
                        "learning_resources": {
                            "keywords": ["cache invalidation"],
                            "suggested_type": "doc",
                        },
                    },
                },
                {
                    "id": "node-4",
                    "section_id": "section-2",
                    "subsection_id": "section-2-sub-1",
                    "type": "project",
                    "data": {
                        "label": "Performance checkpoint",
                        "description": "Apply caching concepts",
                        "estimated_hours": 10,
                        "difficulty": "advanced",
                        "prerequisites": ["Caching strategy"],
                        "learning_outcomes": ["Design a cache-aware solution"],
                        "learning_resources": {
                            "keywords": ["performance"],
                            "suggested_type": "project",
                        },
                    },
                },
            ],
                "edges": [
                    {"id": "e1", "source": "node-1", "target": "node-2"},
                    {"id": "e2", "source": "node-2", "target": "node-3"},
                    {"id": "e3", "source": "node-3", "target": "node-3b"},
                    {"id": "e4", "source": "node-3b", "target": "node-4"},
                ],
            }
        )

    issues = _validate_roadmap_quality(
        roadmap,
            {
                "min_sections": 2,
                "target_node_range": {"min": 5, "max": 10},
                "min_subsections_per_section": 1,
                "min_lessons_per_subsection": {"min": 1, "max": 3},
                "require_learning_outcomes": True,
            "require_prerequisites": True,
        },
    )

    assert issues == []


def test_rebalance_nodes_across_subsections_spreads_lessons_evenly():
    roadmap = validate_and_parse_roadmap(
        {
            "roadmap_title": "ML roadmap",
            "roadmap_description": "Nodes are concentrated in one subsection",
            "total_estimated_hours": 30,
            "sections": [
                {
                    "id": "section-1",
                    "name": "Machine Learning",
                    "order": 1,
                    "subsections": [
                        {"id": "section-1-sub-1", "name": "Foundations", "order": 1},
                        {"id": "section-1-sub-2", "name": "Optimization", "order": 2},
                        {"id": "section-1-sub-3", "name": "Evaluation", "order": 3},
                    ],
                }
            ],
            "nodes": [
                {
                    "id": f"node-{index + 1}",
                    "section_id": "section-1",
                    "subsection_id": "section-1-sub-1",
                    "type": "core",
                    "data": {
                        "label": f"Lesson {index + 1}",
                        "description": "Dense lesson",
                        "estimated_hours": 4,
                        "difficulty": "beginner" if index < 2 else "intermediate",
                        "prerequisites": [] if index == 0 else [f"Lesson {index}"],
                        "learning_outcomes": [f"Outcome {index + 1}"],
                        "learning_resources": {
                            "keywords": [f"lesson-{index + 1}"],
                            "suggested_type": "doc",
                        },
                    },
                }
                for index in range(6)
            ],
            "edges": [
                {"id": f"e{index}", "source": f"node-{index}", "target": f"node-{index + 1}"}
                for index in range(1, 6)
            ],
        }
    )

    _rebalance_nodes_across_subsections(
        roadmap,
        {
            "min_lessons_per_subsection": {"min": 2, "max": 3},
        },
    )

    counts = {}
    for node in roadmap.nodes:
        counts[node.subsection_id] = counts.get(node.subsection_id, 0) + 1

    assert counts == {
        "section-1-sub-1": 2,
        "section-1-sub-2": 2,
        "section-1-sub-3": 2,
    }


def test_collect_structural_issues_only_flags_broken_roadmaps():
    viable_nodes = []
    viable_edges = []
    for index in range(60):
        section_number = index // 20 + 1
        node_id = f"node-{index + 1}"
        viable_nodes.append(
            {
                "id": node_id,
                "section_id": f"section-{section_number}",
                "subsection_id": f"section-{section_number}-sub-1",
                "type": "core",
                "data": {
                    "label": f"Topic {index + 1}",
                    "description": f"Lesson {index + 1}",
                    "estimated_hours": 2,
                    "difficulty": (
                        "beginner"
                        if index < 20
                        else "intermediate"
                        if index < 40
                        else "advanced"
                    ),
                    "prerequisites": [] if index == 0 else [f"Topic {index}"],
                    "learning_outcomes": [f"Outcome {index + 1}"],
                    "learning_resources": {
                        "keywords": [f"topic-{index + 1}"],
                        "suggested_type": "doc",
                    },
                },
            }
        )
        if index > 0:
            viable_edges.append(
                {
                    "id": f"e{index}",
                    "source": f"node-{index}",
                    "target": node_id,
                }
            )

    viable_roadmap = validate_and_parse_roadmap(
        {
            "roadmap_title": "Viable roadmap",
            "roadmap_description": "Below ideal density but still usable",
            "total_estimated_hours": 60,
            "sections": [
                {
                    "id": "section-1",
                    "name": "Foundation",
                    "order": 1,
                    "subsections": [{"id": "section-1-sub-1", "name": "Basics", "order": 1}],
                },
                {
                    "id": "section-2",
                    "name": "Core",
                    "order": 2,
                    "subsections": [{"id": "section-2-sub-1", "name": "Systems", "order": 1}],
                },
                {
                    "id": "section-3",
                    "name": "Advanced",
                    "order": 3,
                    "subsections": [{"id": "section-3-sub-1", "name": "Depth", "order": 1}],
                },
            ],
            "nodes": viable_nodes,
            "edges": viable_edges,
        }
    )

    broken_roadmap = validate_and_parse_roadmap(
        {
            "roadmap_title": "Broken roadmap",
            "roadmap_description": "Too thin to use",
            "total_estimated_hours": 10,
            "sections": [
                {
                    "id": "section-1",
                    "name": "Only section",
                    "order": 1,
                    "subsections": [{"id": "section-1-sub-1", "name": "Only", "order": 1}],
                }
            ],
            "nodes": [
                {
                    "id": "node-1",
                    "section_id": "section-1",
                    "subsection_id": "section-1-sub-1",
                    "type": "core",
                    "data": {
                        "label": "Lonely topic",
                        "description": "Too small",
                        "estimated_hours": 4,
                        "difficulty": "beginner",
                        "prerequisites": [],
                        "learning_outcomes": ["Outcome"],
                        "learning_resources": {"keywords": ["topic"], "suggested_type": "doc"},
                    },
                }
            ],
            "edges": [],
        }
    )

    directives = {
        "min_sections": 6,
        "target_node_range": {"min": 98, "max": 120},
    }

    _ = directives

    assert _collect_structural_issues(viable_roadmap) == []
    assert _collect_structural_issues(broken_roadmap) != []


def test_should_not_reject_density_only_shortfalls_after_repair():
    roadmap = validate_and_parse_roadmap(
        {
            "roadmap_title": "Data Science roadmap",
            "roadmap_description": "Dense enough to use but below ideal target",
            "total_estimated_hours": 180,
            "sections": [
                {
                    "id": "section-1",
                    "name": "Languages",
                    "order": 1,
                    "subsections": [
                        {"id": "section-1-sub-1", "name": "Python", "order": 1},
                        {"id": "section-1-sub-2", "name": "R", "order": 2},
                        {"id": "section-1-sub-3", "name": "Julia", "order": 3},
                    ],
                },
                {
                    "id": "section-2",
                    "name": "Foundations",
                    "order": 2,
                    "subsections": [
                        {"id": "section-2-sub-1", "name": "Khái niệm cơ bản", "order": 1},
                        {"id": "section-2-sub-2", "name": "Thuật toán", "order": 2},
                    ],
                },
            ],
            "nodes": [
                {
                    "id": f"node-{index + 1}",
                    "section_id": "section-1" if index < 36 else "section-2",
                    "subsection_id": (
                        "section-1-sub-1"
                        if index < 20
                        else "section-1-sub-2"
                        if index < 28
                        else "section-1-sub-3"
                        if index < 36
                        else "section-2-sub-1"
                        if index < 55
                        else "section-2-sub-2"
                    ),
                    "type": "core",
                    "data": {
                        "label": f"Topic {index + 1}",
                        "description": f"Lesson {index + 1}",
                        "estimated_hours": 2,
                        "difficulty": "beginner" if index < 30 else "intermediate",
                        "prerequisites": [] if index == 0 else [f"Topic {index}"],
                        "learning_outcomes": [f"Outcome {index + 1}"],
                        "learning_resources": {
                            "keywords": [f"topic-{index + 1}"],
                            "suggested_type": "doc",
                        },
                    },
                }
                for index in range(73)
            ],
            "edges": [
                {"id": f"e{index}", "source": f"node-{index}", "target": f"node-{index + 1}"}
                for index in range(1, 73)
            ],
        }
    )

    assert _collect_structural_issues(roadmap) == []
