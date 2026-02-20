import { NextRequest } from "next/server";
import {
    getChatCompletionStream,
    getChatCompletion,
    getOllamaConfig,
} from "@/lib/ollama";

// System prompt for the AI coding tutor (Vietnamese context)
const SYSTEM_PROMPT = `Bạn là một trợ lý lập trình AI thông minh trên nền tảng học tập CodeSense AIoT - một trang web E-learning dành cho sinh viên và người mới bắt đầu học lập trình tại Việt Nam.

VAI TRÒ CỦA BẠN:
- Giúp học viên hiểu code, giải thích khái niệm lập trình
- Hỗ trợ debug, tìm lỗi và đề xuất cách sửa
- Gợi ý cách viết code tốt hơn, clean code practices
- Trả lời câu hỏi về thuật toán, cấu trúc dữ liệu
- Khuyến khích học viên tự suy nghĩ trước khi đưa ra đáp án

QUY TẮC:
- Trả lời bằng TIẾNG VIỆT
- Giải thích đơn giản, dễ hiểu cho người mới
- Khi đưa code, luôn kèm comment giải thích
- Sử dụng markdown code blocks với language tag
- Nếu câu hỏi mơ hồ, hỏi lại để làm rõ
- Khuyến khích và động viên, không chê bai
- Không viết code hoàn chỉnh cho bài tập, hướng dẫn từng bước`;

// Compact prompt for small models (1.3b, 1b) that can't handle long context
const SYSTEM_PROMPT_LITE = `You are a coding assistant. Answer in Vietnamese. Be concise. Use markdown code blocks.`;

// Detect small models that need reduced params
function isSmallModel(modelId?: string): boolean {
    if (!modelId) return false;
    return /[:\-](0\.5|1|1\.3|1\.5|3)b/i.test(modelId);
}

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

        // Use compact prompt for small models, full prompt for larger ones
        const smallModel = isSmallModel(modelId);
        const systemPrompt = smallModel ? SYSTEM_PROMPT_LITE : SYSTEM_PROMPT;
        const maxTokens = smallModel ? 512 : 2048;

        // Build messages array with system prompt
        const ollamaMessages: Array<{
            role: "user" | "assistant" | "system";
            content: string;
        }> = [{ role: "system", content: systemPrompt }];

        // Add code context if provided
        if (codeContext) {
            const langLabel = language || "code";
            ollamaMessages.push({
                role: "system",
                content: `Học viên đang làm việc với đoạn code ${langLabel} sau:\n\`\`\`${langLabel}\n${codeContext}\n\`\`\``,
            });
        }

        // Add user messages (map from our format to Ollama format)
        for (const msg of messages) {
            if (msg.role === "user" || msg.role === "assistant") {
                ollamaMessages.push({
                    role: msg.role,
                    content: msg.content,
                });
            }
        }

        // Try streaming first; fallback to non-streaming on 405 (Ngrok) or other errors
        const encoder = new TextEncoder();

        const toSSE = (content: string, done: boolean, error?: string) =>
            encoder.encode(
                `data: ${JSON.stringify({ content, done, ...(error && { error }) })}\n\n`,
            );

        let stream: ReadableStream<string>;
        let effectiveModelId = modelId;
        const opts = {
            maxTokens,
            temperature: smallModel ? 0.2 : 0.3,
            modelId: effectiveModelId,
        };

        try {
            stream = await getChatCompletionStream(ollamaMessages, opts);
        } catch (streamErr) {
            const errMsg =
                streamErr instanceof Error
                    ? streamErr.message
                    : String(streamErr);
            // Fallback: model not found (404) -> retry with default chat model
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

        // Convert to SSE (Server-Sent Events) format
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
        // Check if error is AbortError (user triggered Stop or disconnected)
        const isAbort =
            error instanceof Error &&
            (error.name === "AbortError" || error.message.includes("aborted"));

        if (isAbort) {
            console.log("AI Chat: Request was aborted by the client.");
        } else {
            console.error("AI Chat Error:", error);
        }

        const message =
            error instanceof Error ? error.message : "Unknown error";

        if (isAbort) {
            return new Response(null, { status: 499 }); // 499 Client Closed Request
        }

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
