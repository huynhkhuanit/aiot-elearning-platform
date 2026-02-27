import apiClient from "./client";

export interface Question {
    id: string;
    title: string;
    content: string;
    status: "OPEN" | "ANSWERED" | "RESOLVED";
    answersCount: number;
    likesCount: number;
    viewsCount: number;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        fullName: string;
        avatarUrl: string | null;
        membershipType?: "FREE" | "PRO";
    };
    lesson: {
        id: string;
        title: string;
        type: "theory" | "challenge";
    } | null;
}

export interface Answer {
    id: string;
    content: string;
    likesCount: number;
    isAccepted: boolean;
    createdAt: string;
    user: {
        id: string;
        fullName: string;
        avatarUrl: string | null;
        membershipType?: "FREE" | "PRO";
    };
}

interface FetchQuestionsParams {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
    lessonId?: string;
}

export async function fetchQuestions(
    params: FetchQuestionsParams = {},
): Promise<{
    success: boolean;
    data: { questions: Question[]; total: number; page: number };
}> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.status) searchParams.set("status", params.status);
    if (params.category) searchParams.set("category", params.category);
    if (params.search) searchParams.set("search", params.search);
    if (params.lessonId) searchParams.set("lessonId", params.lessonId);

    const response = await apiClient.get(
        `/api/questions?${searchParams.toString()}`,
    );
    return response.data;
}

export async function fetchQuestionDetail(
    questionId: string,
): Promise<{
    success: boolean;
    data: { question: Question; answers: Answer[] };
}> {
    const response = await apiClient.get(`/api/questions/${questionId}`);
    return response.data;
}

export async function createQuestion(data: {
    title: string;
    content: string;
    lessonId?: string;
}): Promise<{ success: boolean; data: Question }> {
    const response = await apiClient.post("/api/questions", data);
    return response.data;
}

export async function createAnswer(
    questionId: string,
    content: string,
): Promise<{ success: boolean; data: Answer }> {
    const response = await apiClient.post(
        `/api/questions/${questionId}/answers`,
        { content },
    );
    return response.data;
}
