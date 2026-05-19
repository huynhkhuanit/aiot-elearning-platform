import { NextRequest, NextResponse } from "next/server";
import {
    getChatCompletion,
    getChatCompletionStream,
    getChatCompletionWithTools,
    getChatCompletionWithToolsStream,
} from "@/lib/ollama";
import { PLAYGROUND_TOOLS } from "@/lib/agent-tools";
import {
    buildAgentAnswerSystemPrompt,
    buildAgentSystemPrompt,
} from "@/lib/agent-prompt";
import { shouldUseAgentTools } from "@/lib/agent-routing";

type AgentMessage =
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
    | { role: "tool"; tool_name: string; content: string };

function buildCodeContext(code: unknown, useTools: boolean): string | null {
    if (!code || typeof code !== "object") return null;

    const state = code as {
        html?: unknown;
        css?: unknown;
        javascript?: unknown;
    };
    const htmlLimit = useTools ? 3000 : 1200;
    const cssLimit = useTools ? 2000 : 800;
    const jsLimit = useTools ? 3000 : 1200;

    return `[CODE HIỆN TẠI TRONG PLAYGROUND]
HTML:
\`\`\`html
${String(state.html || "").slice(0, htmlLimit)}
\`\`\`
CSS:
\`\`\`css
${String(state.css || "").slice(0, cssLimit)}
\`\`\`
JavaScript:
\`\`\`javascript
${String(state.javascript || "").slice(0, jsLimit)}
\`\`\``;
}

function toChatMessages(
    messages: AgentMessage[],
): Array<{ role: "user" | "assistant" | "system"; content: string }> {
    return messages
        .filter(
            (
                message,
            ): message is {
                role: "user" | "assistant" | "system";
                content: string;
            } =>
                message.role !== "tool" &&
                "content" in message &&
                !("tool_calls" in message),
        )
        .map((message) => ({
            role: message.role,
            content: message.content,
        }));
}

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

        const lastUserMessage = [...messages]
            .reverse()
            .find((msg) => msg.role === "user" && msg.content);
        const useTools = shouldUseAgentTools(lastUserMessage?.content || "");

        const ollamaMessages: AgentMessage[] = [
            {
                role: "system",
                content: useTools
                    ? buildAgentSystemPrompt()
                    : buildAgentAnswerSystemPrompt(),
            },
        ];

        const codeContext = buildCodeContext(code, useTools);
        if (codeContext) {
            ollamaMessages.push({ role: "system", content: codeContext });
        }

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

        const agentModel =
            modelId && String(modelId).includes("qwen")
                ? modelId
                : "qwen2.5-coder:7b-instruct";
        const opts = {
            modelId: agentModel,
            maxTokens: useTools ? 2048 : 1024,
            temperature: useTools ? 0.2 : 0.25,
        };

        const encoder = new TextEncoder();
        const toSSE = (obj: object) =>
            encoder.encode(`data: ${JSON.stringify(obj)}\n\n`);

        if (!useTools) {
            let answerStream: ReadableStream<string>;
            const chatMessages = toChatMessages(ollamaMessages);

            try {
                answerStream = await getChatCompletionStream(
                    chatMessages,
                    opts,
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
                    const result = await getChatCompletion(chatMessages, opts);
                    answerStream = new ReadableStream({
                        start(controller) {
                            if (result.content) {
                                controller.enqueue(result.content);
                            }
                            controller.close();
                        },
                    });
                } else {
                    throw streamErr;
                }
            }

            const sseStream = new ReadableStream({
                async start(controller) {
                    const reader = answerStream.getReader();
                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            controller.enqueue(
                                toSSE({ content: value, done: false }),
                            );
                        }
                        controller.enqueue(
                            toSSE({
                                content: "",
                                toolCalls: null,
                                done: true,
                            }),
                        );
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
        }

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
