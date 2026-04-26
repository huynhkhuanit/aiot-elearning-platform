import { NextRequest } from "next/server";
import {
    getChatCompletionStream,
    getChatCompletion,
    getOllamaConfig,
    preWarmModel,
} from "@/lib/ollama";
import {
    classifyComplexity,
    selectModel,
    selectModelParams,
} from "@/lib/ai-router";

// ── Compressed system prompts ──────────────────────────────────
// ~50% fewer tokens vs original → faster time-to-first-token

const SYSTEM_PROMPT = `Bạn là trợ lý lập trình AI trên CodeSense AI — E-learning cho sinh viên Việt Nam.

VAI TRÒ: Giải thích code, debug, gợi ý clean code, trả lời thuật toán/cấu trúc dữ liệu. Khuyến khích tự suy nghĩ.

QUY TẮC:
- Tiếng Việt, dễ hiểu, có cấu trúc
- Code kèm comment và bước thực hiện
- Dùng markdown (## tiêu đề, - bullet, code blocks)
- Không viết code hoàn chỉnh cho bài tập — hướng dẫn từng bước
- Focus câu hỏi chính, tránh lan man`;

const SYSTEM_PROMPT_LITE =
    "Bạn là coding assistant. Tiếng Việt. Ngắn gọn. Markdown code blocks.";

function isSmallModel(modelId?: string): boolean {
    if (!modelId) return false;
    return /[:\-](0\.5|1|1\.3|1\.5|3)b/i.test(modelId);
}

// Pre-warm fast model on module load (non-blocking)
preWarmModel().catch(() => {});

export async function POST(request: NextRequest) {
    try {
        const { messages, codeContext, language, modelId } =
            await request.json();

        if (!Array.isArray(messages) || messages.length === 0) {
            return new Response(
                JSON.stringify({ error: "messages array is required" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        // ── Smart Routing ──────────────────────────────────
        const lastUserMsg = messages.filter((m: { role: string }) => m.role === "user").pop();
        const ollamaConfig = getOllamaConfig();

        let effectiveModelId: string;
        if (modelId) {
            effectiveModelId = modelId;
        } else {
            const complexity = classifyComplexity({
                message: lastUserMsg?.content || "",
                historyLength: messages.length,
                hasCodeBlock: !!codeContext,
            });
            effectiveModelId = selectModel(complexity, "chat", ollamaConfig);
        }

        const smallModel = isSmallModel(effectiveModelId);
        const systemPrompt = smallModel ? SYSTEM_PROMPT_LITE : SYSTEM_PROMPT;

        // Get optimized params from router
        const complexity = codeContext ? "complex" as const : "simple" as const;
        const routerParams = selectModelParams(effectiveModelId, complexity);

        const ollamaMessages: Array<{
            role: "user" | "assistant" | "system";
            content: string;
        }> = [{ role: "system", content: systemPrompt }];

        if (codeContext) {
            const langLabel = language || "code";
            ollamaMessages.push({
                role: "system",
                content: `Code ${langLabel} hiện tại:\n\`\`\`${langLabel}\n${codeContext.slice(0, 3000)}\n\`\`\``,
            });
        }

        for (const msg of messages) {
            if (msg.role === "user" || msg.role === "assistant") {
                ollamaMessages.push({
                    role: msg.role,
                    content: msg.content,
                });
            }
        }

        const encoder = new TextEncoder();
        const toSSE = (content: string, done: boolean, error?: string) =>
            encoder.encode(
                `data: ${JSON.stringify({ content, done, ...(error && { error }) })}\n\n`,
            );

        let stream: ReadableStream<string>;
        const opts = {
            maxTokens: routerParams.num_predict,
            temperature: routerParams.temperature,
            modelId: effectiveModelId,
            num_ctx: routerParams.num_ctx,
        };

        try {
            stream = await getChatCompletionStream(ollamaMessages, opts);
        } catch (streamErr) {
            const errMsg =
                streamErr instanceof Error
                    ? streamErr.message
                    : String(streamErr);

            if (errMsg.includes("404") && errMsg.includes("not found")) {
                effectiveModelId = ollamaConfig.chatModel;
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
                            { ...opts, modelId: effectiveModelId },
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
                const { content } = await getChatCompletion(ollamaMessages, opts);
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

        console.error("AI Chat Error:", error);
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
                error: "Failed to process chat",
                details: message,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }
}
