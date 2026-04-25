import { NextRequest } from "next/server";
import {
    getChatCompletion,
    getChatCompletionStream,
    getOllamaConfig,
} from "@/lib/ollama";
import { withOptionalAuth } from "@/lib/api-middleware";
import {
    getTutorSession,
    saveTutorSession,
} from "@/lib/learning/learning-service";
import { buildTutorSuggestedNextActions } from "@/lib/learning/tutor-memory";

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

function buildTutorSystemPrompt(
    ctx: LearningContext | null,
    memorySummary?: string | null,
): string {
    const base = [
        "You are the AI Tutor for the CodeSense AIoT learning platform.",
        "Always answer in Vietnamese.",
        "Use markdown with headings, bullet lists, and code blocks when helpful.",
        "Explain concepts clearly, accurately, and step by step.",
        "Encourage the learner to think instead of giving away full solutions too early.",
        "If you include code, add short comments that explain the important steps.",
    ].join("\n");

    const memoryBlock = memorySummary
        ? ["", "Tutor memory for this learner:", memorySummary].join("\n")
        : "";

    if (!ctx) {
        return `${base}${memoryBlock}`;
    }

    const lessonTypeLabel =
        ctx.lessonType === "video"
            ? "Video lesson"
            : ctx.lessonType === "reading"
              ? "Reading lesson"
              : "Quiz";

    const recentTopics =
        ctx.recentCompletedTopics.length > 0
            ? ctx.recentCompletedTopics.join(", ")
            : "None";

    const lessonContent = ctx.lessonContent
        ? `Lesson content:\n${ctx.lessonContent.slice(0, 4000)}`
        : "Lesson content is not available.";

    const videoContext = ctx.videoUrl
        ? [
              `Video URL: ${ctx.videoUrl}`,
              "Important: you cannot watch the video directly.",
              "Infer the likely lesson content from the lesson title, section, course outline, and any available lesson text.",
          ].join("\n")
        : "No video URL provided.";

    const outline = ctx.courseOutline
        ? `Course outline:\n${ctx.courseOutline.slice(0, 2000)}`
        : "Course outline is not available.";

    return [
        base,
        "",
        "Current learning context:",
        `Course: ${ctx.courseTitle}`,
        `Current lesson: ${ctx.currentLessonTitle}`,
        `Lesson type: ${lessonTypeLabel}`,
        `Section: ${ctx.currentSection}`,
        `Progress: ${ctx.progress}% (${ctx.completedLessons}/${ctx.totalLessons})`,
        `Recent completed topics: ${recentTopics}`,
        "",
        lessonContent,
        "",
        videoContext,
        "",
        outline,
        "",
        "When the learner asks about the current lesson, answer based on this context first.",
        memoryBlock,
    ].join("\n");
}

function buildCompactSystemPrompt(
    ctx: LearningContext | null,
    memorySummary?: string | null,
): string {
    if (!ctx) {
        return [
            "You are a coding tutor. Answer in Vietnamese. Be concise. Use markdown.",
            memorySummary ? `Tutor memory: ${memorySummary}` : "",
        ]
            .filter(Boolean)
            .join("\n");
    }

    return [
        "You are a coding tutor on CodeSense AIoT.",
        "Answer in Vietnamese.",
        "Use markdown.",
        `Current lesson: ${ctx.currentLessonTitle}`,
        `Course: ${ctx.courseTitle}`,
        `Section: ${ctx.currentSection}`,
        `Type: ${ctx.lessonType}`,
        `Progress: ${ctx.progress}%`,
        ctx.lessonContent
            ? `Lesson content:\n${ctx.lessonContent.slice(0, 1500)}`
            : "Lesson content is not available.",
        memorySummary ? `Tutor memory:\n${memorySummary}` : "",
    ]
        .filter(Boolean)
        .join("\n");
}

function isSmallModel(modelId?: string): boolean {
    if (!modelId) return false;
    return /[:\-](0\.5|1|1\.3|1\.5)b/i.test(modelId);
}

function isMediumModel(modelId?: string): boolean {
    if (!modelId) return false;
    return /[:\-](3|4)b/i.test(modelId);
}

function buildTutorRequest(
    modelId: string | undefined,
    learningContext: LearningContext | null,
    messages: TutorMessage[],
    memorySummary?: string | null,
) {
    const small = isSmallModel(modelId);
    const medium = isMediumModel(modelId);

    const systemPrompt = small
        ? buildCompactSystemPrompt(null, memorySummary)
        : medium
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

    return {
        ollamaMessages,
        options: {
            maxTokens: small ? 512 : medium ? 2048 : 4096,
            temperature: small ? 0.2 : 0.3,
            modelId,
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

        const { tutorModel, chatModel } = getOllamaConfig();
        let effectiveModelId = modelId || tutorModel;
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
                const fallbackModelIds = [tutorModel, chatModel].filter(
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
