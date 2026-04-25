import type {
    CourseLearningSignal,
    LearningGoal,
    LearningInsights,
    LearningRecommendation,
    LearningSignal,
    RoadmapLearningSignal,
} from "./types";

const levelRank: Record<string, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
};

function normalizeText(value: string | null | undefined): string {
    return (value || "").toLowerCase();
}

function tokenizeGoal(goal: LearningGoal): string[] {
    return [
        goal.targetRole,
        ...goal.focusAreas,
        ...goal.currentSkills,
    ]
        .flatMap((value) => value.split(/[\s,/|+-]+/))
        .map((value) => value.trim().toLowerCase())
        .filter((value) => value.length >= 2);
}

function scoreTextMatch(goal: LearningGoal, course: CourseLearningSignal): number {
    const haystack = normalizeText(
        [
            course.title,
            course.category,
            course.shortDescription,
            ...course.tags,
        ].join(" "),
    );

    const tokens = tokenizeGoal(goal);
    if (tokens.length === 0) return 0;

    const matches = tokens.filter((token) => haystack.includes(token)).length;
    return Math.min(34, matches * 8);
}

function scoreLevelFit(goal: LearningGoal, level: string | null): number {
    const userRank = levelRank[goal.skillLevel] ?? 1;
    const courseRank = levelRank[normalizeText(level)] ?? userRank;
    const distance = Math.abs(userRank - courseRank);
    if (distance === 0) return 18;
    if (distance === 1) return 8;
    return -8;
}

function buildCourseReason(goal: LearningGoal, course: CourseLearningSignal): string {
    const focus = goal.focusAreas.find((area) =>
        normalizeText(
            [course.title, course.category, course.shortDescription, ...course.tags].join(" "),
        ).includes(area.toLowerCase()),
    );

    if (course.progressPercentage > 0 && course.progressPercentage < 100) {
        return `Tiếp tục ${course.title} vì bạn đã hoàn thành ${course.progressPercentage}% và khóa này khớp mục tiêu ${goal.targetRole}.`;
    }

    if (focus) {
        return `${course.title} phù hợp với trọng tâm ${focus} trong mục tiêu ${goal.targetRole}.`;
    }

    return `${course.title} là lựa chọn phù hợp với mục tiêu ${goal.targetRole}.`;
}

function courseRecommendation(
    goal: LearningGoal,
    course: CourseLearningSignal,
): LearningRecommendation {
    let score = 25;
    score += scoreTextMatch(goal, course);
    score += scoreLevelFit(goal, course.level);
    if (course.isFree) score += 4;
    if (course.progressPercentage > 0 && course.progressPercentage < 100) {
        score += 24;
    }
    if (course.completedAt || course.progressPercentage >= 100) {
        score -= 35;
    }
    if (course.enrolledAt && course.progressPercentage === 0) {
        score += 8;
    }

    return {
        targetType: "course",
        targetId: course.id,
        title: course.title,
        score: Math.max(0, Math.min(100, Math.round(score))),
        reason: buildCourseReason(goal, course),
        source:
            course.progressPercentage > 0 && course.progressPercentage < 100
                ? "continue_course"
                : "goal_match",
        status: "active",
        metadata: {
            slug: course.slug,
            level: course.level,
            progressPercentage: course.progressPercentage,
            completedLessons: course.completedLessons,
            totalLessons: course.totalLessons,
        },
    };
}

function roadmapRecommendation(
    goal: LearningGoal,
    roadmap: RoadmapLearningSignal,
): LearningRecommendation {
    const text = normalizeText(`${roadmap.title} ${roadmap.description || ""}`);
    const matchedFocusAreas = goal.focusAreas.filter((area) =>
        text.includes(area.toLowerCase()),
    );
    const activeBonus =
        roadmap.progressPercentage > 0 && roadmap.progressPercentage < 100
            ? 28
            : 0;
    const matchBonus = matchedFocusAreas.length * 8;

    return {
        targetType: "roadmap",
        targetId: roadmap.id,
        title: roadmap.title,
        score: Math.max(
            0,
            Math.min(100, Math.round(38 + activeBonus + matchBonus)),
        ),
        reason:
            roadmap.progressPercentage > 0
                ? `Tiếp tục roadmap ${roadmap.title} để giữ mạch học cho mục tiêu ${goal.targetRole}.`
                : `Roadmap ${roadmap.title} giúp hệ thống hóa lộ trình ${goal.targetRole}.`,
        source: "roadmap_followup",
        status: "active",
        metadata: {
            progressPercentage: roadmap.progressPercentage,
            matchedFocusAreas,
        },
    };
}

export function buildLearningRecommendations(
    goal: LearningGoal,
    signals: LearningSignal,
    limit = 8,
): LearningRecommendation[] {
    const safeLimit = Math.max(1, Math.min(20, Math.round(limit)));

    const recommendations = [
        ...signals.courses.map((course) => courseRecommendation(goal, course)),
        ...signals.roadmaps.map((roadmap) => roadmapRecommendation(goal, roadmap)),
    ];

    return recommendations
        .filter((recommendation) => recommendation.score > 0)
        .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
        .slice(0, safeLimit);
}

export function computeLearningInsights(
    goal: LearningGoal,
    signals: LearningSignal,
    recommendations: LearningRecommendation[],
): LearningInsights {
    const activeRecommendations = recommendations.filter(
        (recommendation) => recommendation.status === "active",
    );

    return {
        targetRole: goal.targetRole,
        targetPaceHoursPerWeek: goal.hoursPerWeek,
        weeklyCompletedLessons: signals.gamification.completedLessonsThisWeek,
        weeklyStudyHours: Number(
            (signals.gamification.studyMinutesThisWeek / 60).toFixed(1),
        ),
        streak: signals.gamification.streak,
        totalXp: signals.gamification.xp,
        activeRecommendationCount: activeRecommendations.length,
        nextRecommendation: activeRecommendations[0] || null,
    };
}
