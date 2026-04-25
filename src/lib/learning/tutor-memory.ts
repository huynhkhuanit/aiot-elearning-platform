import type { TutorMemoryContext, TutorMessage } from "./types";

const MAX_MEMORY_LENGTH = 1200;

function compact(value: string | undefined): string {
    return (value || "").replace(/\s+/g, " ").trim();
}

function latestUserMessage(messages: TutorMessage[]): string {
    return (
        [...messages]
            .reverse()
            .find((message) => message.role === "user" && compact(message.content))
            ?.content || ""
    );
}

export function buildTutorMemorySummary(input: {
    previousSummary?: string | null;
    learningContext?: TutorMemoryContext | null;
    messages: TutorMessage[];
}): string {
    const ctx = input.learningContext;
    const recentTopics = ctx?.recentCompletedTopics?.length
        ? ctx.recentCompletedTopics.join(", ")
        : "chưa có chủ đề gần đây";

    const parts = [
        input.previousSummary ? `Ghi nhớ trước đó: ${compact(input.previousSummary)}` : "",
        ctx?.courseTitle ? `Khóa học: ${compact(ctx.courseTitle)}` : "",
        ctx?.currentLessonTitle ? `Bài hiện tại: ${compact(ctx.currentLessonTitle)}` : "",
        typeof ctx?.progress === "number" ? `Tiến độ: ${ctx.progress}%` : "",
        `Chủ đề gần đây: ${recentTopics}`,
        latestUserMessage(input.messages)
            ? `Câu hỏi gần nhất của học viên: ${compact(latestUserMessage(input.messages))}`
            : "",
    ].filter(Boolean);

    return parts.join("\n").slice(0, MAX_MEMORY_LENGTH);
}

export function buildTutorSuggestedNextActions(
    context?: TutorMemoryContext | null,
): string[] {
    const lessonTitle = compact(context?.currentLessonTitle) || "bài học hiện tại";
    const courseTitle = compact(context?.courseTitle) || "khóa học";
    const recentTopics = context?.recentCompletedTopics?.filter(Boolean) || [];

    return [
        `Ôn lại nhanh các ý chính của ${lessonTitle}.`,
        `Làm một bài tập nhỏ áp dụng kiến thức trong ${courseTitle}.`,
        recentTopics.length > 0
            ? `Liên hệ ${lessonTitle} với chủ đề đã học: ${recentTopics.join(", ")}.`
            : `Tạo checklist kiến thức cần nắm sau ${lessonTitle}.`,
    ];
}
