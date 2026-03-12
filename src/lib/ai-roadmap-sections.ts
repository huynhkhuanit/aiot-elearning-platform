import type {
    AIGeneratedRoadmap,
    RoadmapNode,
    RoadmapPhase,
    RoadmapSection,
    RoadmapSubsection,
} from "@/types/ai-roadmap";

function buildDefaultSubsection(
    sectionId: string,
    label = "Core Topics",
): RoadmapSubsection {
    return {
        id: `${sectionId}-sub-1`,
        name: label,
        order: 1,
        description: "Synthesized fallback subsection",
    };
}

export function buildPhasesFromSections(
    sections: RoadmapSection[] | undefined,
): RoadmapPhase[] {
    return (sections || []).map((section, index) => ({
        id: section.id,
        name: section.name,
        order: section.order || index + 1,
    }));
}

export function synthesizeSectionsFromPhases(
    phases: RoadmapPhase[] | undefined,
    nodes: RoadmapNode[] | undefined,
): RoadmapSection[] {
    if (phases && phases.length > 0) {
        return phases.map((phase, index) => ({
            id: phase.id,
            name: phase.name,
            order: phase.order || index + 1,
            description: "Synthesized from legacy phase data",
            subsections: [buildDefaultSubsection(phase.id)],
        }));
    }

    const fallbackSectionId = "section-1";
    return [
        {
            id: fallbackSectionId,
            name: "Generated Section",
            order: 1,
            description:
                nodes && nodes.length > 0
                    ? "Synthesized section for roadmap compatibility"
                    : "Empty synthesized section",
            subsections: [buildDefaultSubsection(fallbackSectionId)],
        },
    ];
}

export function ensureRoadmapSections(
    roadmap: AIGeneratedRoadmap,
): AIGeneratedRoadmap {
    const sections =
        roadmap.sections && roadmap.sections.length > 0
            ? roadmap.sections
            : synthesizeSectionsFromPhases(roadmap.phases, roadmap.nodes);

    const subsectionLookup = new Map<string, RoadmapSubsection[]>();
    sections.forEach((section) => {
        const subsections =
            section.subsections && section.subsections.length > 0
                ? section.subsections
                : [buildDefaultSubsection(section.id)];
        subsectionLookup.set(section.id, subsections);
    });

    const firstSectionId = sections[0]?.id || "section-1";

    const nodes = (roadmap.nodes || []).map((node) => {
        const sectionId = node.section_id || node.phase_id || firstSectionId;
        const sectionSubsections =
            subsectionLookup.get(sectionId) || [buildDefaultSubsection(sectionId)];
        const fallbackSubsectionId = sectionSubsections[0]?.id;

        return {
            ...node,
            phase_id: node.phase_id || sectionId,
            section_id: sectionId,
            subsection_id:
                node.subsection_id ||
                (node.type === "project" ? fallbackSubsectionId : fallbackSubsectionId),
        };
    });

    return {
        ...roadmap,
        sections: sections.map((section) => ({
            ...section,
            subsections:
                section.subsections && section.subsections.length > 0
                    ? section.subsections
                    : [buildDefaultSubsection(section.id)],
        })),
        phases:
            roadmap.phases && roadmap.phases.length > 0
                ? roadmap.phases
                : buildPhasesFromSections(sections),
        nodes,
    };
}
