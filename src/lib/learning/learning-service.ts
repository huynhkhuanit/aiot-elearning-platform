import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";
import {
    buildLearningRecommendations,
    computeLearningInsights,
} from "./recommendation-engine";
import { parseLearningGoalInput } from "./goal-validation";
import {
    buildTutorMemorySummary,
    buildTutorSuggestedNextActions,
} from "./tutor-memory";
import type {
    CourseLearningSignal,
    LearningGoal,
    LearningGoalInput,
    LearningInsights,
    LearningRecommendation,
    LearningSignal,
    RoadmapLearningSignal,
    TutorMemoryContext,
    TutorMessage,
} from "./types";

type SupabaseClient = NonNullable<typeof supabaseAdmin>;

function requireDb(): SupabaseClient {
    if (!supabaseAdmin) {
        throw new Error("Supabase admin client not initialized");
    }
    return supabaseAdmin;
}

function mapGoal(row: any): LearningGoal {
    return {
        id: row.id,
        userId: row.user_id,
        targetRole: row.target_role,
        skillLevel: row.skill_level,
        focusAreas: row.focus_areas || [],
        hoursPerWeek: row.hours_per_week,
        timelineMonths: row.timeline_months,
        currentSkills: row.current_skills || [],
        preferredLanguage: row.preferred_language || "vi",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapRecommendation(row: any): LearningRecommendation {
    return {
        id: row.id,
        userId: row.user_id,
        targetType: row.target_type,
        targetId: row.target_id,
        title: row.title,
        score: row.score,
        reason: row.reason,
        source: row.source,
        status: row.status,
        metadata: row.metadata || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export async function getLearningGoal(
    userId: string,
): Promise<LearningGoal | null> {
    const db = requireDb();
    const { data, error } = await db
        .from("learning_goals")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw error;
    return data ? mapGoal(data) : null;
}

export async function upsertLearningGoal(
    userId: string,
    input: unknown,
): Promise<LearningGoal> {
    const db = requireDb();
    const goal = parseLearningGoalInput(input);
    const now = new Date().toISOString();

    const { data, error } = await db
        .from("learning_goals")
        .upsert(
            {
                user_id: userId,
                target_role: goal.targetRole,
                skill_level: goal.skillLevel,
                focus_areas: goal.focusAreas,
                hours_per_week: goal.hoursPerWeek,
                timeline_months: goal.timelineMonths,
                current_skills: goal.currentSkills,
                preferred_language: goal.preferredLanguage,
                updated_at: now,
            },
            { onConflict: "user_id" },
        )
        .select("*")
        .single();

    if (error) throw error;
    return mapGoal(data);
}

async function loadCourses(
    db: SupabaseClient,
    userId: string,
): Promise<CourseLearningSignal[]> {
    const [{ data: enrollments }, { data: courses }] = await Promise.all([
        db
            .from("enrollments")
            .select(
                "course_id, enrolled_at, completed_at, progress_percentage",
            )
            .eq("user_id", userId),
        db
            .from("courses")
            .select(
                "id, slug, title, level, short_description, is_free, category_id",
            )
            .eq("is_published", true)
            .limit(80),
    ]);

    const enrollmentByCourse = new Map<string, any>();
    for (const enrollment of enrollments || []) {
        enrollmentByCourse.set(String(enrollment.course_id), enrollment);
    }

    const courseIds = (courses || []).map((course) => String(course.id));
    const chapterCounts = new Map<string, number>();
    const completedCounts = new Map<string, number>();

    if (courseIds.length > 0) {
        const { data: chapters } = await db
            .from("chapters")
            .select("id, course_id")
            .in("course_id", courseIds);
        const chapterToCourse = new Map<string, string>();
        for (const chapter of chapters || []) {
            const courseId = String(chapter.course_id);
            chapterToCourse.set(String(chapter.id), courseId);
        }

        const chapterIds = [...chapterToCourse.keys()];
        if (chapterIds.length > 0) {
            const { data: lessons } = await db
                .from("lessons")
                .select("id, chapter_id")
                .in("chapter_id", chapterIds);
            const lessonToCourse = new Map<string, string>();
            for (const lesson of lessons || []) {
                const courseId = chapterToCourse.get(String(lesson.chapter_id));
                if (!courseId) continue;
                lessonToCourse.set(String(lesson.id), courseId);
                chapterCounts.set(courseId, (chapterCounts.get(courseId) || 0) + 1);
            }

            const lessonIds = [...lessonToCourse.keys()];
            if (lessonIds.length > 0) {
                const { data: progressRows } = await db
                    .from("lesson_progress")
                    .select("lesson_id")
                    .eq("user_id", userId)
                    .eq("is_completed", true)
                    .in("lesson_id", lessonIds);
                for (const progress of progressRows || []) {
                    const courseId = lessonToCourse.get(String(progress.lesson_id));
                    if (!courseId) continue;
                    completedCounts.set(
                        courseId,
                        (completedCounts.get(courseId) || 0) + 1,
                    );
                }
            }
        }
    }

    return (courses || []).map((course: any) => {
        const courseId = String(course.id);
        const enrollment = enrollmentByCourse.get(courseId);
        const totalLessons = Number(chapterCounts.get(courseId) || 0);
        const completedLessons = Number(completedCounts.get(courseId) || 0);
        const progressPercentage =
            enrollment?.progress_percentage !== undefined &&
            enrollment?.progress_percentage !== null
                ? Number(enrollment.progress_percentage)
                : totalLessons > 0
                  ? Math.round((completedLessons / totalLessons) * 100)
                  : 0;

        return {
            id: courseId,
            slug: course.slug,
            title: course.title,
            level: course.level,
            category: course.category_id ? String(course.category_id) : null,
            shortDescription: course.short_description,
            tags: [course.level, course.title].filter(Boolean),
            isFree: Boolean(course.is_free),
            totalLessons,
            completedLessons,
            progressPercentage,
            enrolledAt: enrollment?.enrolled_at || null,
            completedAt: enrollment?.completed_at || null,
        };
    });
}

async function loadRoadmaps(
    db: SupabaseClient,
    userId: string,
): Promise<RoadmapLearningSignal[]> {
    const { data: roadmaps } = await db
        .from("ai_generated_roadmaps")
        .select("id, title, description, nodes, updated_at")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(10);

    if (!roadmaps || roadmaps.length === 0) return [];

    const roadmapIds = roadmaps.map((roadmap) => String(roadmap.id));
    const { data: progressRows } = await db
        .from("ai_roadmap_node_progress")
        .select("roadmap_id, status")
        .in("roadmap_id", roadmapIds)
        .eq("status", "completed");

    const completedByRoadmap = new Map<string, number>();
    for (const progress of progressRows || []) {
        const roadmapId = String(progress.roadmap_id);
        completedByRoadmap.set(
            roadmapId,
            (completedByRoadmap.get(roadmapId) || 0) + 1,
        );
    }

    return roadmaps.map((roadmap: any) => {
        const nodes = Array.isArray(roadmap.nodes) ? roadmap.nodes : [];
        const completed = completedByRoadmap.get(String(roadmap.id)) || 0;
        return {
            id: String(roadmap.id),
            title: roadmap.title,
            description: roadmap.description,
            progressPercentage:
                nodes.length > 0 ? Math.round((completed / nodes.length) * 100) : 0,
            updatedAt: roadmap.updated_at,
        };
    });
}

async function loadGamification(
    db: SupabaseClient,
    userId: string,
): Promise<LearningSignal["gamification"]> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const [{ data: gamification }, { data: progressRows }] = await Promise.all([
        db
            .from("user_gamification")
            .select("total_xp, current_streak")
            .eq("user_id", userId)
            .maybeSingle(),
        db
            .from("progress_events")
            .select("event_type, duration_seconds")
            .eq("user_id", userId)
            .gte("created_at", weekStart.toISOString()),
    ]);

    return {
        xp: Number(gamification?.total_xp || 0),
        streak: Number(gamification?.current_streak || 0),
        completedLessonsThisWeek: (progressRows || []).filter(
            (row) => row.event_type === "LESSON_COMPLETED",
        ).length,
        studyMinutesThisWeek: Math.round(
            (progressRows || []).reduce(
                (sum, row) => sum + Number(row.duration_seconds || 0),
                0,
            ) / 60,
        ),
    };
}

export async function loadLearningSignals(
    userId: string,
): Promise<LearningSignal> {
    const db = requireDb();
    const [courses, roadmaps, gamification] = await Promise.all([
        loadCourses(db, userId),
        loadRoadmaps(db, userId),
        loadGamification(db, userId),
    ]);

    return { courses, roadmaps, gamification };
}

export async function getStoredRecommendations(
    userId: string,
    limit = 8,
): Promise<LearningRecommendation[]> {
    const db = requireDb();
    const { data, error } = await db
        .from("learning_recommendations")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("score", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(Math.max(1, Math.min(20, limit)));

    if (error) throw error;
    return (data || []).map(mapRecommendation);
}

export async function refreshLearningRecommendations(
    userId: string,
    limit = 8,
): Promise<LearningRecommendation[]> {
    const db = requireDb();
    const goal = await getLearningGoal(userId);
    if (!goal) {
        throw new Error("Learning goal is required before recommendations");
    }

    const signals = await loadLearningSignals(userId);
    const recommendations = buildLearningRecommendations(goal, signals, limit);
    const now = new Date().toISOString();

    if (recommendations.length === 0) return [];

    const { data, error } = await db
        .from("learning_recommendations")
        .upsert(
            recommendations.map((recommendation) => ({
                user_id: userId,
                target_type: recommendation.targetType,
                target_id: recommendation.targetId,
                title: recommendation.title,
                score: recommendation.score,
                reason: recommendation.reason,
                source: recommendation.source,
                status: recommendation.status,
                metadata: recommendation.metadata,
                updated_at: now,
            })),
            { onConflict: "user_id,target_type,target_id" },
        )
        .select("*");

    if (error) throw error;
    return (data || []).map(mapRecommendation);
}

export async function getLearningInsights(
    userId: string,
): Promise<LearningInsights> {
    const goal = await getLearningGoal(userId);
    if (!goal) {
        throw new Error("Learning goal is required before insights");
    }

    const [signals, storedRecommendations] = await Promise.all([
        loadLearningSignals(userId),
        getStoredRecommendations(userId, 8).catch(() => []),
    ]);
    const recommendations =
        storedRecommendations.length > 0
            ? storedRecommendations
            : buildLearningRecommendations(goal, signals, 8);

    return computeLearningInsights(goal, signals, recommendations);
}

export interface TutorSessionRecord {
    id: string;
    userId: string;
    courseId: string | null;
    lessonId: string | null;
    title: string | null;
    memorySummary: string;
    suggestedNextActions: string[];
}

export async function getTutorSession(
    userId: string,
    sessionId: string | null | undefined,
): Promise<TutorSessionRecord | null> {
    if (!sessionId) return null;
    const db = requireDb();
    const { data, error } = await db
        .from("ai_tutor_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
        id: data.id,
        userId: data.user_id,
        courseId: data.course_id,
        lessonId: data.lesson_id,
        title: data.title,
        memorySummary: data.memory_summary || "",
        suggestedNextActions: data.suggested_next_actions || [],
    };
}

export async function saveTutorSession(input: {
    userId: string;
    sessionId?: string | null;
    courseId?: string | null;
    lessonId?: string | null;
    title?: string | null;
    previousSummary?: string | null;
    learningContext?: TutorMemoryContext | null;
    messages: TutorMessage[];
}): Promise<TutorSessionRecord> {
    const db = requireDb();
    const sessionId = input.sessionId || randomUUID();
    const memorySummary = buildTutorMemorySummary({
        previousSummary: input.previousSummary,
        learningContext: input.learningContext,
        messages: input.messages,
    });
    const suggestedNextActions = buildTutorSuggestedNextActions(
        input.learningContext,
    );

    const { data, error } = await db
        .from("ai_tutor_sessions")
        .upsert(
            {
                id: sessionId,
                user_id: input.userId,
                course_id: input.courseId || null,
                lesson_id: input.lessonId || null,
                title: input.title || input.learningContext?.currentLessonTitle || null,
                memory_summary: memorySummary,
                suggested_next_actions: suggestedNextActions,
                last_interaction_at: new Date().toISOString(),
            },
            { onConflict: "id" },
        )
        .select("*")
        .single();

    if (error) throw error;

    return {
        id: data.id,
        userId: data.user_id,
        courseId: data.course_id,
        lessonId: data.lesson_id,
        title: data.title,
        memorySummary: data.memory_summary || "",
        suggestedNextActions: data.suggested_next_actions || [],
    };
}

export function normalizeLearningGoalForResponse(goal: LearningGoal | null) {
    return goal;
}

export type { LearningGoalInput };
