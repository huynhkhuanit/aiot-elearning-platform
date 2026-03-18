import { NextRequest, NextResponse } from "next/server";
import { db as supabaseAdmin } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth-helpers";

/**
 * GET /api/questions
 * Get all questions from all courses (or filtered by courseSlug).
 *
 * Query params:
 * - category: Filter by lesson type (all, theory, challenge)
 * - search: Search in question title/content
 * - status: Filter by status (all, OPEN, ANSWERED, RESOLVED)
 * - courseSlug: Optional filter by course slug
 * - page: Page number (default 1)
 * - limit: Items per page (default 20, max 50)
 */
export async function GET(request: NextRequest) {
    try {
        await requireAuth();

        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category") || "all";
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "all";
        const courseSlug = searchParams.get("courseSlug");
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.min(
            50,
            Math.max(1, parseInt(searchParams.get("limit") || "20")),
        );

        // Step 1: Get valid lesson IDs scoped to course (if specified)
        let lessonQuery = supabaseAdmin!
            .from("lessons")
            .select(
                `
        id,
        title,
        chapter_id,
        video_url,
        chapters!inner(
          id,
          course_id,
          courses!inner(
            id,
            slug,
            is_published
          )
        )
      `,
            )
            .eq("is_published", true);

        const { data: lessons, error: lessonsError } = await lessonQuery;
        if (lessonsError) throw lessonsError;

        if (!lessons || lessons.length === 0) {
            return NextResponse.json({
                success: true,
                data: { questions: [], total: 0, page, limit },
            });
        }

        // Build lesson map filtered by courseSlug if provided
        const lessonMap = new Map<
            string,
            { id: string; title: string; type: string }
        >();
        const validLessonIds: string[] = [];

        for (const lesson of lessons) {
            const course = (lesson.chapters as any)?.courses;
            if (!course?.is_published) continue;
            if (courseSlug && course.slug !== courseSlug) continue;

            // Filter by category at lesson level
            const lessonType = lesson.video_url ? "challenge" : "theory";
            if (category !== "all" && category !== lessonType) continue;

            validLessonIds.push(lesson.id);
            lessonMap.set(lesson.id, {
                id: lesson.id,
                title: lesson.title,
                type: lessonType,
            });
        }

        if (validLessonIds.length === 0) {
            return NextResponse.json({
                success: true,
                data: { questions: [], total: 0, page, limit },
            });
        }

        // Step 2: Query questions with DB-level status column
        let questionsQuery = supabaseAdmin!
            .from("lesson_questions")
            .select(
                `
        id,
        lesson_id,
        title,
        content,
        status,
        answers_count,
        likes_count,
        views_count,
        created_at,
        updated_at,
        users!inner(id, username, full_name, avatar_url, membership_type)
      `,
                { count: "exact" },
            )
            .in("lesson_id", validLessonIds);

        // Filter by status
        if (status !== "all") {
            questionsQuery = questionsQuery.eq("status", status.toUpperCase());
        }

        // Search filter
        if (search) {
            questionsQuery = questionsQuery.or(
                `title.ilike.%${search}%,content.ilike.%${search}%`,
            );
        }

        // Pagination + sort
        const offset = (page - 1) * limit;
        questionsQuery = questionsQuery
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        const {
            data: questionsData,
            error: questionsError,
            count,
        } = await questionsQuery;
        if (questionsError) throw questionsError;

        if (!questionsData || questionsData.length === 0) {
            return NextResponse.json({
                success: true,
                data: { questions: [], total: 0, page, limit },
            });
        }

        // Step 3: Get answer users (max 5 per question) for display
        const questionIds = questionsData.map((q: any) => q.id);
        const { data: answersData } = await supabaseAdmin!
            .from("lesson_answers")
            .select(
                `
        question_id,
        users!inner(id, full_name, avatar_url, membership_type)
      `,
            )
            .in("question_id", questionIds)
            .order("created_at", { ascending: true });

        // Build answer users map (max 5 unique per question)
        const answerUsersMap = new Map<
            string,
            Array<{
                id: string;
                fullName: string;
                avatarUrl: string | null;
                membershipType: "FREE" | "PRO";
            }>
        >();

        for (const answer of answersData || []) {
            if (!answerUsersMap.has(answer.question_id)) {
                answerUsersMap.set(answer.question_id, []);
            }
            const users = answerUsersMap.get(answer.question_id)!;
            const user = answer.users as any;
            if (users.length < 5 && !users.some((u) => u.id === user.id)) {
                users.push({
                    id: user.id,
                    fullName: user.full_name,
                    avatarUrl: user.avatar_url,
                    membershipType: user.membership_type || "FREE",
                });
            }
        }

        // Step 4: Format response
        const questions = questionsData.map((row: any) => {
            const lesson = lessonMap.get(row.lesson_id);
            return {
                id: row.id,
                title: row.title,
                content: row.content,
                status: row.status || "OPEN",
                answersCount: row.answers_count || 0,
                likesCount: row.likes_count || 0,
                viewsCount: row.views_count || 0,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                user: {
                    id: row.users.id,
                    username: row.users.username,
                    fullName: row.users.full_name,
                    avatarUrl: row.users.avatar_url,
                    membershipType: row.users.membership_type || "FREE",
                },
                answerUsers: answerUsersMap.get(row.id) || [],
                lesson: lesson || null,
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                questions,
                total: count || questions.length,
                page,
                limit,
            },
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 },
            );
        }
        console.error("Error fetching questions:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}
