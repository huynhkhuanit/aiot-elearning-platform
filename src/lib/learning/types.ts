export type LearningSkillLevel = "beginner" | "intermediate" | "advanced";
export type LearningRecommendationTargetType = "course" | "roadmap" | "lesson";
export type LearningRecommendationStatus = "active" | "dismissed" | "completed";

export interface LearningGoalInput {
    targetRole: string;
    skillLevel: LearningSkillLevel;
    focusAreas: string[];
    hoursPerWeek: number;
    timelineMonths: number;
    currentSkills: string[];
    preferredLanguage: "vi" | "en";
}

export interface LearningGoal extends LearningGoalInput {
    id: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CourseLearningSignal {
    id: string;
    slug: string;
    title: string;
    level: string | null;
    category: string | null;
    shortDescription: string | null;
    tags: string[];
    isFree: boolean;
    totalLessons: number;
    completedLessons: number;
    progressPercentage: number;
    enrolledAt?: string | null;
    completedAt?: string | null;
}

export interface RoadmapLearningSignal {
    id: string;
    title: string;
    description: string | null;
    progressPercentage: number;
    updatedAt?: string | null;
}

export interface GamificationLearningSignal {
    xp: number;
    streak: number;
    completedLessonsThisWeek: number;
    studyMinutesThisWeek: number;
}

export interface LearningSignal {
    courses: CourseLearningSignal[];
    roadmaps: RoadmapLearningSignal[];
    gamification: GamificationLearningSignal;
}

export interface LearningRecommendation {
    id?: string;
    userId?: string;
    targetType: LearningRecommendationTargetType;
    targetId: string;
    title: string;
    score: number;
    reason: string;
    source: string;
    status: LearningRecommendationStatus;
    metadata: Record<string, unknown>;
    createdAt?: string;
    updatedAt?: string;
}

export interface LearningInsights {
    targetRole: string;
    targetPaceHoursPerWeek: number;
    weeklyCompletedLessons: number;
    weeklyStudyHours: number;
    streak: number;
    totalXp: number;
    activeRecommendationCount: number;
    nextRecommendation: LearningRecommendation | null;
}

export interface TutorMemoryContext {
    courseTitle?: string;
    currentLessonTitle?: string;
    progress?: number;
    recentCompletedTopics?: string[];
}

export interface TutorMessage {
    role: string;
    content: string;
}
