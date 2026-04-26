import type { AuthResponse, User } from "../types/auth";
import type { Chapter } from "../types/course";
import type { Answer, Question } from "./qa";

type AuthSession = {
    user: User;
    token: string;
};

function isObject(value: unknown): value is Record<string, any> {
    return typeof value === "object" && value !== null;
}

function firstString(...values: unknown[]): string | null {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) {
            return value;
        }
    }
    return null;
}

export function normalizeAuthResponse(response: AuthResponse): AuthSession {
    const data = response.data;
    const token = firstString(
        data?.token,
        (data as any)?.accessToken,
        (data as any)?.access_token,
    );

    if (!response.success || !data?.user) {
        throw new Error(response.message || "Dang nhap that bai");
    }

    if (!token) {
        throw new Error(
            "Missing mobile auth token in API response. Check that the auth request sends X-Client-Platform: mobile.",
        );
    }

    return {
        user: data.user,
        token,
    };
}

export function normalizeChaptersResponse(payload: unknown): Chapter[] {
    const rawChapters =
        isObject(payload) && Array.isArray(payload.chapters)
            ? payload.chapters
            : Array.isArray(payload)
              ? payload
              : [];

    return rawChapters.map((chapter: any) => {
        const lessons = Array.isArray(chapter.lessons) ? chapter.lessons : [];
        return {
            ...chapter,
            order_index:
                chapter.order_index ?? chapter.order ?? chapter.sort_order ?? 0,
            order: chapter.order ?? chapter.order_index ?? chapter.sort_order ?? 0,
            lessons: lessons.map((lesson: any) => {
                const videoUrl = firstString(
                    lesson.video_url,
                    lesson.videoUrl,
                    lesson.youtube_backup_url,
                    lesson.youtubeBackupUrl,
                );
                const youtubeBackupUrl = firstString(
                    lesson.youtube_backup_url,
                    lesson.youtubeBackupUrl,
                );
                const order =
                    lesson.order_index ?? lesson.order ?? lesson.sort_order ?? 0;
                const isCompleted = Boolean(
                    lesson.is_completed ?? lesson.isCompleted ?? false,
                );
                const isPreview = Boolean(
                    lesson.is_preview ??
                        lesson.isPreview ??
                        lesson.isFree ??
                        false,
                );

                return {
                    ...lesson,
                    order_index: order,
                    order,
                    video_url: videoUrl,
                    videoUrl,
                    youtube_backup_url: youtubeBackupUrl,
                    youtubeBackupUrl,
                    is_completed: isCompleted,
                    isCompleted,
                    is_preview: isPreview,
                    isPreview,
                };
            }),
        };
    });
}

export function normalizeQuestionDetailResponse(payload: unknown): {
    question: Question;
    answers: Answer[];
} {
    const data = isObject(payload) ? payload : {};
    const question = data.question as Question & { answers?: Answer[] };
    const answers = Array.isArray(data.answers)
        ? data.answers
        : Array.isArray(question?.answers)
          ? question.answers
          : [];

    return {
        question,
        answers,
    };
}

export function normalizeCreateAnswerResponse(payload: unknown): Answer {
    if (isObject(payload) && isObject(payload.answer)) {
        return payload.answer as Answer;
    }
    return payload as Answer;
}
