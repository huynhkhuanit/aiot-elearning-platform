import { NextRequest } from "next/server";
import {
    getChatCompletion,
    getChatCompletionStream,
    getOllamaConfig,
    preWarmModel,
} from "@/lib/ollama";
import { withOptionalAuth } from "@/lib/api-middleware";
import {
    getTutorSession,
    saveTutorSession,
} from "@/lib/learning/learning-service";
import { buildTutorSuggestedNextActions } from "@/lib/learning/tutor-memory";
import {
    classifyComplexity,
    selectModel,
    selectModelParams,
} from "@/lib/ai-router";

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

interface TutorMessage {
    role: string;
    content: string;
}

// ── Compressed system prompts ──────────────────────────────────
// Shorter prompts = fewer tokens for model to process = faster first token

function buildTutorSystemPrompt(
    ctx: LearningContext | null,
    memorySummary?: string | null,
): string {
    const base =
        "Bạn là AI Tutor trên CodeSense AIoT. " +
        "Trả lời tiếng Việt. Dùng markdown. " +
        "Giải thích rõ ràng, từng bước. Khuyến khích tư duy. " +
        "Code kèm comment ngắn.";

    const memoryBlock = memorySummary
        ? `\nTutor memory:\n${memorySummary}`
        : "";

    if (!ctx) return `${base}${memoryBlock}`;

    const lessonTypeLabel =
        ctx.lessonType === "video"
            ? "Video"
            : ctx.lessonType === "reading"
              ? "Đọc"
              : "Quiz";

    // Compress lesson content aggressively for speed
    // 7B gets 2000 chars, enough for context without overwhelming
    const lessonSnippet = ctx.lessonContent
        ? `Nội dung bài:\n${ctx.lessonContent.slice(0, 2000)}`
        : "";

    // Course outline compressed to 800 chars
    const outline = ctx.courseOutline
        ? `Outline khóa học:\n${ctx.courseOutline.slice(0, 800)}`
        : "";

    return [
        base,
        "",
        `Khóa: ${ctx.courseTitle} | Bài: ${ctx.currentLessonTitle}`,
        `Loại: ${lessonTypeLabel} | Chương: ${ctx.currentSection}`,
        `Tiến độ: ${ctx.progress}% (${ctx.completedLessons}/${ctx.totalLessons})`,
        lessonSnippet,
        outline,
        "Trả lời dựa trên ngữ cảnh bài học này.",
        memoryBlock,
    ]
        .filter(Boolean)
        .join("\n");
}

function buildCompactSystemPrompt(
    ctx: LearningContext | null,
    memorySummary?: string | null,
): string {
    if (!ctx) {
        return [
            "Bạn là coding tutor. Tiếng Việt. Ngắn gọn. Markdown.",
            memorySummary ? `Memory: ${memorySummary}` : "",
        ]
            .filter(Boolean)
            .join("\n");
    }

    return [
        "Bạn là coding tutor trên CodeSense AIoT. Tiếng Việt. Markdown.",
        `Bài: ${ctx.currentLessonTitle} | Khóa: ${ctx.courseTitle}`,
        `Chương: ${ctx.currentSection} | Loại: ${ctx.lessonType} | ${ctx.progress}%`,
        ctx.lessonContent
            ? `Nội dung:\n${ctx.lessonContent.slice(0, 800)}`
            : "",
        memorySummary ? `Memory:\n${memorySummary}` : "",
    ]
        .filter(Boolean)
        .join("\n");
}

function isSmallModel(modelId?: string): boolean {
    if (!modelId) return false;
    return /[:\-](0\.5|1|1\.3|1\.5)b/i.test(modelId);
}

function isFastModel(modelId?: string): boolean {
    if (!modelId) return false;
    return /[:\-](3)b/i.test(modelId);
}

function buildTutorRequest(
    modelId: string | undefined,
    learningContext: LearningContext | null,
    messages: TutorMessage[],
    memorySummary?: string | null,
) {
    const small = isSmallModel(modelId);
    const fast = isFastModel(modelId);

    const systemPrompt = small
        ? buildCompactSystemPrompt(null, memorySummary)
        : fast
          ? buildCompactSystemPrompt(learningContext, memorySummary)
          : buildTutorSystemPrompt(learningContext, memorySummary);

    const ollamaMessages: Array<{
        role: "user" | "assistant" | "system";
        content: string;
    }> = [{ role: "system", content: systemPrompt }];

    for (const message of messages) {
        if (message.role === "user" || message.role === "assistant") {
            ollamaMessages.push({
                role: message.role,
                content: message.content,
            });
        }
    }

    // Use ai-router for optimal params
    const routerParams = modelId
        ? selectModelParams(modelId, fast || small ? "simple" : "complex")
        : { num_ctx: 4096, num_predict: 2048, temperature: 0.3 };

    return {
        ollamaMessages,
        options: {
            maxTokens: small ? 512 : routerParams.num_predict,
            temperature: routerParams.temperature,
            modelId,
            num_ctx: routerParams.num_ctx,
        },
    };
}

function createStaticStream(content: string): ReadableStream<string> {
    return new ReadableStream({
        start(controller) {
            if (content) controller.enqueue(content);
            controller.close();
        },
    });
}

// ── Pre-warm on module load (non-blocking) ─────────────────────
// This runs once when the route module is first imported by Next.js.
// It keeps the fast model in RAM so user's first question is instant.
preWarmModel().catch(() => {});

export const POST = withOptionalAuth(async (request: NextRequest, { user }) => {
    try {
        const {
            messages,
            learningContext,
            modelId,
            sessionId,
        }: {
            messages: TutorMessage[];
            learningContext: LearningContext | null;
            modelId?: string;
            sessionId?: string;
        } = await request.json();

        if (!Array.isArray(messages) || messages.length === 0) {
            return new Response(
                JSON.stringify({ error: "messages array is required" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        const existingSession =
            user && sessionId
                ? await getTutorSession(user.userId, sessionId).catch(
                      (error) => {
                          console.warn(
                              "AI Tutor memory lookup failed:",
                              error instanceof Error
                                  ? error.message
                                  : String(error),
                          );
                          return null;
                      },
                  )
                : null;
        const effectiveSessionId =
            existingSession?.id ||
            sessionId ||
            (user ? crypto.randomUUID() : undefined);
        const suggestedNextActions = buildTutorSuggestedNextActions(
            learningContext || null,
        );

        // ── Smart Routing: classify complexity & select model ──
        const lastUserMsg = messages.filter((m) => m.role === "user").pop();
        const ollamaConfig = getOllamaConfig();

        let effectiveModelId: string;
        if (modelId) {
            // User explicitly selected a model → respect their choice
            effectiveModelId = modelId;
        } else {
            const complexity = classifyComplexity({
                message: lastUserMsg?.content || "",
                historyLength: messages.length,
                hasLearningContext: !!learningContext,
                learningContentLength: learningContext?.lessonContent?.length ?? 0,
            });
            effectiveModelId = selectModel(complexity, "tutor", ollamaConfig);
        }

        let requestConfig = buildTutorRequest(
            effectiveModelId,
            learningContext || null,
            messages,
            existingSession?.memorySummary,
        );

        const encoder = new TextEncoder();
        const toSSE = (content: string, done: boolean, error?: string) =>
            encoder.encode(
                `data: ${JSON.stringify({
                    content,
                    done,
                    ...(effectiveSessionId && { sessionId: effectiveSessionId }),
                    suggestedNextActions,
                    ...(error && { error }),
                })}\n\n`,
            );

        let stream: ReadableStream<string>;

        try {
            stream = await getChatCompletionStream(
                requestConfig.ollamaMessages,
                requestConfig.options,
            );
        } catch (streamErr) {
            const errMsg =
                streamErr instanceof Error
                    ? streamErr.message
                    : String(streamErr);

            if (
                errMsg.includes("405") ||
                errMsg.includes("method not allowed")
            ) {
                const { content } = await getChatCompletion(
                    requestConfig.ollamaMessages,
                    requestConfig.options,
                );
                stream = createStaticStream(content);
            } else if (
                errMsg.includes("404") &&
                errMsg.includes("not found")
            ) {
                const fallbackModelIds = [
                    ollamaConfig.fastModel,
                    ollamaConfig.tutorModel,
                    ollamaConfig.chatModel,
                ].filter(
                    (candidate, index, modelIds) =>
                        Boolean(candidate) &&
                        candidate !== effectiveModelId &&
                        modelIds.indexOf(candidate) === index,
                );

                let recovered = false;
                let lastRetryError: unknown = streamErr;

                for (const fallbackModelId of fallbackModelIds) {
                    effectiveModelId = fallbackModelId;
                    requestConfig = buildTutorRequest(
                        effectiveModelId,
                        learningContext || null,
                        messages,
                        existingSession?.memorySummary,
                    );

                    try {
                        stream = await getChatCompletionStream(
                            requestConfig.ollamaMessages,
                            requestConfig.options,
                        );
                        recovered = true;
                        break;
                    } catch (retryErr) {
                        lastRetryError = retryErr;
                        const retryMsg =
                            retryErr instanceof Error
                                ? retryErr.message
                                : String(retryErr);

                        if (
                            retryMsg.includes("405") ||
                            retryMsg.includes("method not allowed")
                        ) {
                            const { content } = await getChatCompletion(
                                requestConfig.ollamaMessages,
                                requestConfig.options,
                            );
                            stream = createStaticStream(content);
                            recovered = true;
                            break;
                        }

                        if (
                            !(
                                retryMsg.includes("404") &&
                                retryMsg.includes("not found")
                            )
                        ) {
                            throw retryErr;
                        }
                    }
                }

                if (!recovered) {
                    throw lastRetryError;
                }
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
                            if (user) {
                                await saveTutorSession({
                                    userId: user.userId,
                                    sessionId: effectiveSessionId,
                                    courseId: learningContext?.courseSlug || null,
                                    lessonId:
                                        learningContext?.currentLessonId || null,
                                    title:
                                        learningContext?.currentLessonTitle ||
                                        null,
                                    previousSummary:
                                        existingSession?.memorySummary || null,
                                    learningContext,
                                    messages,
                                }).catch((error) => {
                                    console.warn(
                                        "AI Tutor memory save failed:",
                                        error instanceof Error
                                            ? error.message
                                            : String(error),
                                    );
                                });
                            }
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
});
