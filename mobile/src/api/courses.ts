import apiClient from "./client";
import { CoursesResponse, CourseDetail, Chapter } from "../types/course";

interface FetchCoursesParams {
    page?: number;
    limit?: number;
    level?: string;
    is_free?: string;
    category?: string;
    search?: string;
}

export async function fetchCourses(
    params: FetchCoursesParams = {},
): Promise<CoursesResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.level) searchParams.set("level", params.level);
    if (params.is_free) searchParams.set("is_free", params.is_free);
    if (params.category) searchParams.set("category", params.category);
    if (params.search) searchParams.set("search", params.search);

    const response = await apiClient.get(
        `/api/courses?${searchParams.toString()}`,
    );
    return response.data;
}

export async function fetchCourseDetail(
    slug: string,
): Promise<{ success: boolean; data: CourseDetail }> {
    const response = await apiClient.get(`/api/courses/${slug}`);
    return response.data;
}

export async function fetchCourseChapters(
    slug: string,
): Promise<{ success: boolean; data: Chapter[] }> {
    const response = await apiClient.get(`/api/courses/${slug}/chapters`);
    return response.data;
}

export async function enrollCourse(
    slug: string,
): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/api/courses/${slug}/enroll`);
    return response.data;
}

export async function fetchCourseProgress(
    slug: string,
): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.get(`/api/courses/${slug}/progress`);
    return response.data;
}

export async function markLessonComplete(
    lessonId: string,
): Promise<{ success: boolean }> {
    const response = await apiClient.post(`/api/lessons/${lessonId}/complete`);
    return response.data;
}
