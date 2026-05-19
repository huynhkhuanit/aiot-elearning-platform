import { NextRequest, NextResponse } from "next/server";
import {
    getChatCompletionWithTools,
    getChatCompletionWithToolsStream,
} from "@/lib/ollama";
import { PLAYGROUND_TOOLS } from "@/lib/agent-tools";
import { buildAgentSystemPrompt } from "@/lib/agent-prompt";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { messages, code, modelId } = body;

        if (!Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json(
                { error: "messages array is required" },
                { status: 400 },
            );
        }

        // Build Ollama messages
        const ollamaMessages: Array<
            | { role: "user" | "assistant" | "system"; content: string }
            | {
                  role: "assistant";
                  content?: string;
                  tool_calls?: Array<{
                      type: "function";
                      function: {
                          index?: number;
                          name: string;
                          arguments?: string | Record<string, unknown>;
                      };
                  }>;
              }
            | { role: "tool"; tool_name: string; content: string }
        > = [{ role: "system", content: buildAgentSystemPrompt() }];

        // Inject current code so model can edit directly; also instruct to use read_code if unsure
        if (code && typeof code === "object") {
            const codeCtx = `[CODE HIỆN TẠI TRONG PLAYGROUND - dùng read_code để đọc hoặc edit_code để sửa]
HTML:
\`\`\`
${String(code.html || "").slice(0, 3000)}
\`\`\`
CSS:
\`\`\`
${String(code.css || "").slice(0, 2000)}
\`\`\`
JavaScript:
\`\`\`
${String(code.javascript || "").slice(0, 3000)}
\`\`\``;
            ollamaMessages.push({ role: "system", content: codeCtx });
        }

        // Map incoming messages to Ollama format
        for (const msg of messages) {
            if (msg.role === "user" && msg.content) {
                ollamaMessages.push({ role: "user", content: msg.content });
            } else if (msg.role === "assistant") {
                if (msg.tool_calls && msg.tool_calls.length > 0) {
                    ollamaMessages.push({
                        role: "assistant",
                        content: msg.content || "",
                        tool_calls: msg.tool_calls,
                    });
                } else if (msg.content) {
                    ollamaMessages.push({
                        role: "assistant",
                        content: msg.content,
                    });
                }
            } else if (msg.role === "tool" && msg.tool_name && msg.content) {
                ollamaMessages.push({
                    role: "tool",
                    tool_name: msg.tool_name,
                    content: msg.content,
                });
            }
        }

        // Agent tools require a model that supports tool calling.
        // Qwen 2.5 Coder outputs tool calls as text (we parse them).
        const agentModel =
            modelId && String(modelId).includes("qwen")
                ? modelId
                : "qwen2.5-coder:7b-instruct";

        const opts = {
            modelId: agentModel,
            maxTokens: 2048,
            temperature: 0.2,
        };

        // Prefer streaming for lower latency; fallback to non-streaming on failure
        let stream: ReadableStream<import("@/lib/ollama").ToolsStreamChunk>;
        try {
            stream = await getChatCompletionWithToolsStream(
                ollamaMessages,
                PLAYGROUND_TOOLS,
                opts,
            );
        } catch (streamErr) {
            const errMsg =
                streamErr instanceof Error
                    ? streamErr.message
                    : String(streamErr);
            if (
                errMsg.includes("405") ||
                errMsg.includes("method not allowed") ||
                errMsg.includes("fetch")
            ) {
                const result = await getChatCompletionWithTools(
                    ollamaMessages,
                    PLAYGROUND_TOOLS,
                    opts,
                );
                return Response.json({
                    content: result.content,
                    toolCalls: result.toolCalls,
                    durationMs: result.durationMs,
                });
            }
            throw streamErr;
        }

        const encoder = new TextEncoder();
        const toSSE = (obj: object) =>
            encoder.encode(`data: ${JSON.stringify(obj)}\n\n`);

        const sseStream = new ReadableStream({
            async start(controller) {
                const reader = stream.getReader();
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        if (value.type === "chunk") {
                            controller.enqueue(
                                toSSE({
                                    content: value.content,
                                    done: false,
                                }),
                            );
                        } else if (value.type === "done") {
                            controller.enqueue(
                                toSSE({
                                    content: value.content,
                                    toolCalls: value.toolCalls,
                                    done: true,
                                }),
                            );
                            break;
                        }
                    }
                } catch (error) {
                    const msg =
                        error instanceof Error
                            ? error.message
                            : "Stream error";
                    controller.enqueue(
                        toSSE({ content: "", done: true, error: msg }),
                    );
                }
                controller.close();
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
        console.error("AI Agent Error:", error);
        const message =
            error instanceof Error ? error.message : "Unknown error";

        const isAbort =
            error instanceof Error && error.name === "AbortError";

        if (message.includes("timed out") || isAbort) {
            return Response.json(
                {
                    error: "AI model đang tải, vui lòng thử lại sau vài giây",
                    details: message,
                },
                { status: 504 },
            );
        }
        if (message.includes("fetch") || message.includes("ECONNREFUSED")) {
            return Response.json(
                { error: "AI server is not reachable", details: message },
                { status: 503 },
            );
        }

        return Response.json(
            { error: "Failed to process agent request", details: message },
            { status: 500 },
        );
    }
}
