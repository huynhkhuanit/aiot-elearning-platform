import type {
    GenerationDirectives,
    GenerationDirectivesRequest,
    GenerationPreferences,
    GenerationPreferencesRequest,
    RangeConstraint,
    UserProfile,
} from "@/types/ai-roadmap";

const DEFAULT_GENERATION_PREFERENCES: GenerationPreferences = {
    contentBias: "theory_heavy",
    roadmapDepth: "deep",
    lessonGranularity: "detailed",
    foundationCoverage: "auto",
};

type BaseDirectivePreset = Omit<
    GenerationDirectives,
    "availableHoursTotal" | "theoryRatioTarget"
>;

function clampRange(range: RangeConstraint): RangeConstraint {
    const min = Math.max(1, Math.round(range.min));
    const max = Math.max(min, Math.round(range.max));
    return { min, max };
}

function adjustRange(
    range: RangeConstraint,
    deltaMin: number,
    deltaMax: number,
): RangeConstraint {
    return clampRange({
        min: range.min + deltaMin,
        max: range.max + deltaMax,
    });
}

function baseDirectivePreset(targetMonths: number): BaseDirectivePreset {
    if (targetMonths <= 3) {
        return {
            targetNodeRange: { min: 45, max: 60 },
            minSections: 6,
            minSubsectionsPerSection: 2,
            minLessonsPerSubsection: { min: 3, max: 4 },
            projectCadence: "checkpoint_every_section_capstone_final",
            requirePrerequisites: true,
            requireLearningOutcomes: true,
        };
    }

    if (targetMonths <= 6) {
        return {
            targetNodeRange: { min: 70, max: 110 },
            minSections: 8,
            minSubsectionsPerSection: 3,
            minLessonsPerSubsection: { min: 4, max: 5 },
            projectCadence: "checkpoint_every_section_capstone_final",
            requirePrerequisites: true,
            requireLearningOutcomes: true,
        };
    }

    return {
        targetNodeRange: { min: 110, max: 150 },
        minSections: 10,
        minSubsectionsPerSection: 4,
        minLessonsPerSubsection: { min: 5, max: 6 },
        projectCadence: "checkpoint_every_section_capstone_final",
        requirePrerequisites: true,
        requireLearningOutcomes: true,
    };
}

export function normalizeGenerationPreferences(
    preferences?: Partial<GenerationPreferences> | null,
): GenerationPreferences {
    return {
        contentBias:
            preferences?.contentBias ??
            DEFAULT_GENERATION_PREFERENCES.contentBias,
        roadmapDepth:
            preferences?.roadmapDepth ??
            DEFAULT_GENERATION_PREFERENCES.roadmapDepth,
        lessonGranularity:
            preferences?.lessonGranularity ??
            DEFAULT_GENERATION_PREFERENCES.lessonGranularity,
        foundationCoverage:
            preferences?.foundationCoverage ??
            DEFAULT_GENERATION_PREFERENCES.foundationCoverage,
    };
}

export function buildRoadmapGenerationDirectives(
    profile: Pick<UserProfile, "hoursPerWeek" | "targetMonths" | "generationPreferences">,
): GenerationDirectives {
    const preferences = normalizeGenerationPreferences(
        profile.generationPreferences,
    );
    const base = baseDirectivePreset(profile.targetMonths);

    let minSections = base.minSections;
    let minSubsectionsPerSection = base.minSubsectionsPerSection;
    let minLessonsPerSubsection = { ...base.minLessonsPerSubsection };
    let targetNodeRange = { ...base.targetNodeRange };
    let projectCadence = base.projectCadence;

    switch (preferences.roadmapDepth) {
        case "deep":
            targetNodeRange = adjustRange(targetNodeRange, 8, 12);
            break;
        case "expert":
            minSections += 1;
            minSubsectionsPerSection += 1;
            targetNodeRange = adjustRange(targetNodeRange, 18, 24);
            minLessonsPerSubsection = adjustRange(
                minLessonsPerSubsection,
                0,
                1,
            );
            break;
        default:
            break;
    }

    switch (preferences.lessonGranularity) {
        case "compact":
            minLessonsPerSubsection = adjustRange(
                minLessonsPerSubsection,
                -1,
                -1,
            );
            targetNodeRange = adjustRange(targetNodeRange, -8, -12);
            break;
        case "micro_lesson":
            minLessonsPerSubsection = adjustRange(
                minLessonsPerSubsection,
                1,
                1,
            );
            targetNodeRange = adjustRange(targetNodeRange, 12, 18);
            break;
        default:
            break;
    }

    switch (preferences.foundationCoverage) {
        case "full_foundation":
            minSections += 1;
            targetNodeRange = adjustRange(targetNodeRange, 8, 12);
            projectCadence = "checkpoint_every_2_sections_capstone_final";
            break;
        case "fast_track":
            minSections = Math.max(4, minSections - 1);
            minSubsectionsPerSection = Math.max(2, minSubsectionsPerSection - 1);
            targetNodeRange = adjustRange(targetNodeRange, -12, -16);
            minLessonsPerSubsection = adjustRange(
                minLessonsPerSubsection,
                -1,
                0,
            );
            projectCadence = "checkpoint_every_section_capstone_only";
            break;
        default:
            break;
    }

    const theoryRatioTarget =
        preferences.contentBias === "theory_heavy"
            ? 0.72
            : preferences.contentBias === "practice_heavy"
              ? 0.4
              : 0.58;

    if (preferences.contentBias === "theory_heavy") {
        projectCadence = "checkpoint_every_2_sections_capstone_final";
    }

    if (preferences.contentBias === "practice_heavy") {
        projectCadence = "checkpoint_every_section_plus_capstone";
    }

    return {
        availableHoursTotal: profile.hoursPerWeek * profile.targetMonths * 4,
        targetNodeRange: clampRange(targetNodeRange),
        minSections,
        minSubsectionsPerSection,
        minLessonsPerSubsection: clampRange(minLessonsPerSubsection),
        theoryRatioTarget,
        projectCadence,
        requirePrerequisites: true,
        requireLearningOutcomes: true,
    };
}

export function toGenerationPreferencesRequest(
    preferences?: Partial<GenerationPreferences> | null,
): GenerationPreferencesRequest {
    const normalized = normalizeGenerationPreferences(preferences);
    return {
        content_bias: normalized.contentBias,
        roadmap_depth: normalized.roadmapDepth,
        lesson_granularity: normalized.lessonGranularity,
        foundation_coverage: normalized.foundationCoverage,
    };
}

export function toGenerationDirectivesRequest(
    directives: GenerationDirectives,
): GenerationDirectivesRequest {
    return {
        available_hours_total: directives.availableHoursTotal,
        target_node_range: directives.targetNodeRange,
        min_sections: directives.minSections,
        min_subsections_per_section: directives.minSubsectionsPerSection,
        min_lessons_per_subsection: directives.minLessonsPerSubsection,
        theory_ratio_target: directives.theoryRatioTarget,
        project_cadence: directives.projectCadence,
        require_prerequisites: directives.requirePrerequisites,
        require_learning_outcomes: directives.requireLearningOutcomes,
    };
}

export { DEFAULT_GENERATION_PREFERENCES };
