import { NextRequest } from "next/server";
import {
    getChatCompletionStream,
    getChatCompletion,
    getOllamaConfig,
} from "@/lib/ollama";

interface LearningContext {
    courseTitle: string;
    courseSlug: string;
    currentLessonTitle: string;
    currentLessonId: string;
    lessonType: "video" | "reading" | "quiz";
    lessonContent: string;
    videoUrl: string;
    progress: number;
    completedLessons: number;
    totalLessons: number;
    currentSection: string;
    recentCompletedTopics: string[];
    courseOutline: string;
}

function buildTutorSystemPrompt(ctx: LearningContext | null): string {
    const base = `Bạn là AI Tutor cá nhân trên nền tảng học tập CodeSense AIoT — một trợ lý thông minh hiểu rõ ngữ cảnh bài học mà học viên đang theo dõi.

VAI TRÒ:
- Giải thích nội dung bài học hiện tại một cách chi tiết và chính xác
- Đưa ví dụ thực tế và bài tập thực hành liên quan đến bài đang học
- Liên kết kiến thức mới với các bài đã hoàn thành trước đó
- Động viên và hướng dẫn dựa trên tiến độ học tập
- Trả lời câu hỏi liên quan đến lập trình và công nghệ

QUY TẮC:
- Trả lời bằng TIẾNG VIỆT, rõ ràng, có cấu trúc
- Sử dụng markdown (## tiêu đề, - bullet, code blocks)
- Khi đưa code, kèm comment giải thích
- Khuyến khích học viên tự suy nghĩ, gợi ý từng bước thay vì đưa đáp án hoàn chỉnh
- Nếu câu hỏi nằm ngoài phạm vi bài học, vẫn trả lời nhưng gợi ý quay lại nội dung khóa học`;

    if (!ctx) return base;

    const lessonTypeLabel =
        ctx.lessonType === "video"
            ? "Video bài giảng"
            : ctx.lessonType === "reading"
              ? "Bài đọc lý thuyết"
              : "Bài kiểm tra";

    const progressComment =
        ctx.progress < 20
            ? "Học viên mới bắt đầu — giải thích kỹ hơn, dùng ngôn ngữ đơn giản."
            : ctx.progress < 50
              ? "Học viên đang tiến bộ — có thể dùng thuật ngữ chuyên môn vừa phải."
              : ctx.progress < 80
                ? "Học viên đã vững nền tảng — có thể đưa ví dụ nâng cao."
                : "Học viên gần hoàn thành — có thể đưa bài tập thử thách và kiến thức mở rộng.";

    const recentTopics =
        ctx.recentCompletedTopics.length > 0
            ? `\nBÀI ĐÃ HOÀN THÀNH GẦN ĐÂY: ${ctx.recentCompletedTopics.join(", ")}`
            : "";

    // Build content sections based on available data
    let contentBlock = "";

    if (ctx.lessonContent) {
        contentBlock += `\n\n📄 NỘI DUNG BÀI HỌC (dùng làm kiến thức chính để trả lời câu hỏi):\n\`\`\`\n${ctx.lessonContent.slice(0, 4000)}\n\`\`\``;
    }

    if (ctx.videoUrl) {
        contentBlock += `\n\n🎬 VIDEO BÀI GIẢNG: ${ctx.videoUrl}`;
        if (!ctx.lessonContent) {
            contentBlock += `\nLƯU Ý: Bài này chủ yếu là video. Bạn KHÔNG xem được video nhưng hãy DỰA VÀO tên bài học "${ctx.currentLessonTitle}", chương "${ctx.currentSection}", và cấu trúc khóa học bên dưới để suy luận nội dung bài học và trả lời câu hỏi của học viên. Hãy dùng kiến thức chuyên môn của bạn về chủ đề này để giải thích chi tiết.`;
        }
    }

    if (!ctx.lessonContent && !ctx.videoUrl) {
        contentBlock += `\n\nLƯU Ý: Nội dung chi tiết của bài chưa có sẵn. Hãy DỰA VÀO tên bài "${ctx.currentLessonTitle}", chương "${ctx.currentSection}", và cấu trúc khóa học để suy luận chủ đề và trả lời bằng kiến thức chuyên môn của bạn.`;
    }

    // Course outline for curriculum awareness
    const outlineBlock = ctx.courseOutline
        ? `\n\n📋 CẤU TRÚC KHÓA HỌC (giúp bạn hiểu vị trí bài học trong chương trình):\n${ctx.courseOutline.slice(0, 2000)}`
        : "";

    return `${base}

═══════════════════════════════
NGỮ CẢNH HỌC TẬP HIỆN TẠI:
═══════════════════════════════
📚 Khóa học: ${ctx.courseTitle}
📖 Bài học hiện tại: ${ctx.currentLessonTitle}
📝 Loại bài: ${lessonTypeLabel}
📊 Tiến độ: ${ctx.progress}% (${ctx.completedLessons}/${ctx.totalLessons} bài)
📂 Chương hiện tại: ${ctx.currentSection}${recentTopics}

🎯 GHI CHÚ GIẢNG DẠY: ${progressComment}${contentBlock}${outlineBlock}

QUAN TRỌNG: Khi học viên hỏi về nội dung bài học, hãy trả lời DỰA TRÊN ngữ cảnh ở trên. Nếu bài là video, hãy suy luận nội dung từ tên bài và cấu trúc khóa học, rồi giải thích chi tiết bằng kiến thức chuyên môn.`;
}

function isSmallModel(modelId?: string): boolean {
    if (!modelId) return false;
    return /[:\-](0\.5|1|1\.3|1\.5)b/i.test(modelId);
}

function isMediumModel(modelId?: string): boolean {
    if (!modelId) return false;
    return /[:\-](3|4)b/i.test(modelId);
}

function buildCompactSystemPrompt(ctx: LearningContext | null): string {
    const base = `You are a coding tutor on CodeSense AIoT platform. Answer in Vietnamese. Use markdown.`;
    if (!ctx) return base;
    return `${base}\n\nBài học hiện tại: "${ctx.currentLessonTitle}" (${ctx.courseTitle})\nChương: ${ctx.currentSection}\nLoại: ${ctx.lessonType === "video" ? "Video" : ctx.lessonType === "reading" ? "Bài đọc" : "Quiz"}\nTiến độ: ${ctx.progress}%${
        ctx.lessonContent
            ? `\n\nNội dung bài:\n${ctx.lessonContent.slice(0, 1500)}`
            : ""
    }`;
}

export async function POST(request: NextRequest) {
    try {
        const { messages, learningContext, modelId } = await request.json();

        if (!Array.isArray(messages) || messages.length === 0) {
            return new Response(
                JSON.stringify({ error: "messages array is required" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        const small = isSmallModel(modelId);
        const medium = isMediumModel(modelId);

        const systemPrompt = small
            ? "You are a coding tutor. Answer in Vietnamese. Be concise. Use markdown."
            : medium
              ? buildCompactSystemPrompt(learningContext || null)
              : buildTutorSystemPrompt(learningContext || null);

        const maxTokens = small ? 512 : medium ? 2048 : 4096;

        const ollamaMessages: Array<{
            role: "user" | "assistant" | "system";
            content: string;
        }> = [{ role: "system", content: systemPrompt }];

        for (const msg of messages) {
            if (msg.role === "user" || msg.role === "assistant") {
                ollamaMessages.push({ role: msg.role, content: msg.content });
            }
        }

        const encoder = new TextEncoder();
        const toSSE = (content: string, done: boolean, error?: string) =>
            encoder.encode(
                `data: ${JSON.stringify({ content, done, ...(error && { error }) })}\n\n`,
            );

        let stream: ReadableStream<string>;
        let effectiveModelId = modelId;
        const opts = {
            maxTokens,
            temperature: small ? 0.2 : 0.3,
            modelId: effectiveModelId,
        };

        try {
            stream = await getChatCompletionStream(ollamaMessages, opts);
        } catch (streamErr) {
            const errMsg =
                streamErr instanceof Error
                    ? streamErr.message
                    : String(streamErr);

            if (errMsg.includes("404") && errMsg.includes("not found")) {
                const { chatModel } = getOllamaConfig();
                effectiveModelId = chatModel;
                try {
                    stream = await getChatCompletionStream(ollamaMessages, {
                        ...opts,
                        modelId: effectiveModelId,
                    });
                } catch (retryErr) {
                    const retryMsg =
                        retryErr instanceof Error
                            ? retryErr.message
                            : String(retryErr);
                    if (
                        retryMsg.includes("405") ||
                        retryMsg.includes("method not allowed")
                    ) {
                        const { content } = await getChatCompletion(
                            ollamaMessages,
                            {
                                ...opts,
                                modelId: effectiveModelId,
                            },
                        );
                        stream = new ReadableStream({
                            start(controller) {
                                if (content) controller.enqueue(content);
                                controller.close();
                            },
                        });
                    } else {
                        throw retryErr;
                    }
                }
            } else if (
                errMsg.includes("405") ||
                errMsg.includes("method not allowed")
            ) {
                const { content } = await getChatCompletion(
                    ollamaMessages,
                    opts,
                );
                stream = new ReadableStream({
                    start(controller) {
                        if (content) controller.enqueue(content);
                        controller.close();
                    },
                });
            } else {
                throw streamErr;
            }
        }

        const sseStream = new ReadableStream({
            async start(controller) {
                const reader = stream.getReader();
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            controller.enqueue(toSSE("", true));
                            controller.close();
                            break;
                        }
                        controller.enqueue(toSSE(value, false));
                    }
                } catch (error) {
                    const message =
                        error instanceof Error ? error.message : "Stream error";
                    controller.enqueue(toSSE("", true, message));
                    controller.close();
                }
            },
        });

        return new Response(sseStream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
                "X-Accel-Buffering": "no",
            },
        });
    } catch (error) {
        const isAbort =
            error instanceof Error &&
            (error.name === "AbortError" || error.message.includes("aborted"));

        if (isAbort) {
            return new Response(null, { status: 499 });
        }

        console.error("AI Tutor Error:", error);
        const message =
            error instanceof Error ? error.message : "Unknown error";

        if (message.includes("timed out")) {
            return new Response(
                JSON.stringify({
                    error: "AI server timed out",
                    details: message,
                }),
                {
                    status: 504,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        if (message.includes("fetch") || message.includes("ECONNREFUSED")) {
            return new Response(
                JSON.stringify({
                    error: "AI server is not reachable",
                    details: message,
                }),
                {
                    status: 503,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        return new Response(
            JSON.stringify({
                error: "Failed to process tutor request",
                details: message,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }
}
