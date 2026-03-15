import { NextRequest, NextResponse } from "next/server";
import { queryBuilder } from "@/lib/db";

export const revalidate = 0; // Always fresh data

interface UserRow {
    id: string;
    full_name: string;
    role: string | null;
    is_active: boolean | null;
    is_verified: boolean | null;
    created_at: string | null;
    last_login: string | null;
}

interface CourseRow {
    id: string;
    title: string;
    is_published: boolean | null;
    rating: number | null;
    rating_count: number | null;
    total_students: number | null;
    price: number | null;
    is_free: boolean | null;
}

interface EnrollmentRow {
    id: string;
    user_id: string;
    course_id: string;
    enrolled_at: string | null;
    progress_percentage: number | null;
}

interface ReviewRow {
    id: string;
    course_id: string;
    user_id: string;
    rating: number;
    comment: string | null;
    created_at: string | null;
}

interface BlogPostRow {
    id: number;
    title: string;
    status: string | null;
    view_count: number | null;
    created_at: string | null;
}

interface LessonRow {
    id: string;
    chapter_id: string;
    title: string;
    content: string | null;
    is_published: boolean | null;
}

interface ChapterRow {
    id: string;
    course_id: string;
    title: string;
}

interface PaymentRow {
    id: string;
    amount: number;
    status: string | null;
    created_at: string | null;
}

export async function GET(request: NextRequest) {
    try {
        // Parallel fetch all data for performance
        const [
            users,
            courses,
            enrollments,
            reviews,
            blogPosts,
            lessons,
            chapters,
            payments,
        ] = await Promise.all([
            queryBuilder<UserRow>("users", {
                select: "id, full_name, role, is_active, is_verified, created_at, last_login",
            }),
            queryBuilder<CourseRow>("courses", {
                select: "id, title, is_published, rating, rating_count, total_students, price, is_free",
            }),
            queryBuilder<EnrollmentRow>("enrollments", {
                select: "id, user_id, course_id, enrolled_at, progress_percentage",
            }),
            queryBuilder<ReviewRow>("course_reviews", {
                select: "id, course_id, user_id, rating, comment, created_at",
            }),
            queryBuilder<BlogPostRow>("blog_posts", {
                select: "id, title, status, view_count, created_at",
            }),
            queryBuilder<LessonRow>("lessons", {
                select: "id, chapter_id, title, content, is_published",
            }),
            queryBuilder<ChapterRow>("chapters", {
                select: "id, course_id, title",
            }),
            queryBuilder<PaymentRow>("payments", {
                select: "id, amount, status, created_at",
            }),
        ]);

        // ==========================================
        // USER STATS
        // ==========================================
        const totalUsers = users.length;
        const activeUsers = users.filter((u) => u.is_active).length;
        const verifiedUsers = users.filter((u) => u.is_verified).length;
        const roleDistribution = {
            admin: users.filter((u) => u.role?.toLowerCase() === "admin")
                .length,
            teacher: users.filter((u) => u.role?.toLowerCase() === "teacher")
                .length,
            user: users.filter(
                (u) => !u.role || u.role.toLowerCase() === "user",
            ).length,
        };

        // New users this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newUsersThisMonth = users.filter((u) => {
            if (!u.created_at) return false;
            return new Date(u.created_at) >= startOfMonth;
        }).length;

        // ==========================================
        // COURSE STATS
        // ==========================================
        const totalCourses = courses.length;
        const publishedCourses = courses.filter((c) => c.is_published).length;

        // ==========================================
        // ENROLLMENT STATS
        // ==========================================
        const totalEnrollments = enrollments.length;
        const avgProgress =
            enrollments.length > 0
                ? Math.round(
                      enrollments.reduce(
                          (sum, e) =>
                              sum + (Number(e.progress_percentage) || 0),
                          0,
                      ) / enrollments.length,
                  )
                : 0;

        // ==========================================
        // REVIEW STATS
        // ==========================================
        const totalReviews = reviews.length;
        const avgRating =
            reviews.length > 0
                ? parseFloat(
                      (
                          reviews.reduce((sum, r) => sum + r.rating, 0) /
                          reviews.length
                      ).toFixed(1),
                  )
                : 0;

        // ==========================================
        // BLOG STATS
        // ==========================================
        const totalBlogPosts = blogPosts.length;
        const publishedBlogPosts = blogPosts.filter(
            (p) => p.status === "published",
        ).length;
        const totalBlogViews = blogPosts.reduce(
            (sum, p) => sum + (p.view_count || 0),
            0,
        );

        // ==========================================
        // LESSON & CONTENT STATS
        // ==========================================
        const totalLessons = lessons.length;
        const publishedLessons = lessons.filter((l) => l.is_published).length;
        const lessonsWithContent = lessons.filter(
            (l) => l.content && l.content.trim().length > 0,
        ).length;
        const totalChapters = chapters.length;
        const completionRate =
            totalLessons > 0
                ? Math.round((lessonsWithContent / totalLessons) * 100)
                : 0;

        // ==========================================
        // REVENUE STATS
        // ==========================================
        const completedPayments = payments.filter(
            (p) => p.status?.toUpperCase() === "COMPLETED",
        );
        const totalRevenue = completedPayments.reduce(
            (sum, p) => sum + Number(p.amount || 0),
            0,
        );

        // ==========================================
        // CHART DATA: Enrollments per course
        // ==========================================
        const enrollmentsByCourseName = courses.map((course) => {
            const count = enrollments.filter(
                (e) => e.course_id === course.id,
            ).length;
            return {
                name:
                    course.title.length > 20
                        ? course.title.substring(0, 20) + "..."
                        : course.title,
                fullName: course.title,
                enrollments: count,
            };
        });

        // ==========================================
        // CHART DATA: Content per course
        // ==========================================
        const courseContentStats = courses.map((course) => {
            const courseChapterIds = chapters
                .filter((c) => c.course_id === course.id)
                .map((c) => c.id);
            const courseLessons = lessons.filter((l) =>
                courseChapterIds.includes(l.chapter_id),
            );
            return {
                name:
                    course.title.length > 20
                        ? course.title.substring(0, 20) + "..."
                        : course.title,
                fullName: course.title,
                lessons: courseLessons.length,
                published: courseLessons.filter((l) => l.is_published).length,
                content: courseLessons.filter(
                    (l) => l.content && l.content.trim().length > 0,
                ).length,
            };
        });

        // ==========================================
        // RECENT ACTIVITY
        // ==========================================
        // Latest enrollments (with user + course names)
        const recentEnrollments = enrollments
            .filter((e) => e.enrolled_at)
            .sort(
                (a, b) =>
                    new Date(b.enrolled_at!).getTime() -
                    new Date(a.enrolled_at!).getTime(),
            )
            .slice(0, 5)
            .map((e) => {
                const user = users.find((u) => u.id === e.user_id);
                const course = courses.find((c) => c.id === e.course_id);
                return {
                    type: "enrollment" as const,
                    userName: user?.full_name || "Unknown",
                    courseName: course?.title || "Unknown",
                    date: e.enrolled_at,
                };
            });

        // Latest reviews
        const recentReviews = reviews
            .filter((r) => r.created_at)
            .sort(
                (a, b) =>
                    new Date(b.created_at!).getTime() -
                    new Date(a.created_at!).getTime(),
            )
            .slice(0, 5)
            .map((r) => {
                const user = users.find((u) => u.id === r.user_id);
                const course = courses.find((c) => c.id === r.course_id);
                return {
                    type: "review" as const,
                    userName: user?.full_name || "Unknown",
                    courseName: course?.title || "Unknown",
                    rating: r.rating,
                    comment: r.comment
                        ? r.comment.length > 60
                            ? r.comment.substring(0, 60) + "..."
                            : r.comment
                        : null,
                    date: r.created_at,
                };
            });

        // Merge and sort recent activity
        const recentActivity = [...recentEnrollments, ...recentReviews]
            .sort(
                (a, b) =>
                    new Date(b.date!).getTime() - new Date(a.date!).getTime(),
            )
            .slice(0, 8);

        return NextResponse.json({
            success: true,
            data: {
                stats: {
                    // Users
                    totalUsers,
                    activeUsers,
                    verifiedUsers,
                    newUsersThisMonth,
                    roleDistribution,
                    // Courses
                    totalCourses,
                    publishedCourses,
                    // Enrollments
                    totalEnrollments,
                    avgProgress,
                    // Reviews
                    totalReviews,
                    avgRating,
                    // Blog
                    totalBlogPosts,
                    publishedBlogPosts,
                    totalBlogViews,
                    // Lessons & Content
                    totalLessons,
                    totalChapters,
                    publishedLessons,
                    lessonsWithContent,
                    completionRate,
                    // Revenue
                    totalRevenue,
                },
                charts: {
                    enrollmentsByCourse: enrollmentsByCourseName,
                    courseContentStats,
                },
                recentActivity,
            },
        });
    } catch (error: any) {
        console.error("Error fetching admin stats:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch stats",
                error: error.message,
            },
            { status: 500 },
        );
    }
}
