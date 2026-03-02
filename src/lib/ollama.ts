// Ollama REST API Client for AI Code Assistant
// Connects to Ollama server (Local or Colab via Ngrok) for code completion, chat, and generation

import type {
    OllamaGenerateRequest,
    OllamaGenerateResponse,
    OllamaChatRequest,
    OllamaChatResponse,
    OllamaTagsResponse,
    OllamaToolDefinition,
    OllamaToolCall,
} from "@/types/ai";

// ===== Configuration =====

// Normalize: remove trailing slash to avoid //api/chat (causes 405 with Ngrok)
const OLLAMA_BASE_URL = (
    process.env.OLLAMA_BASE_URL || "http://localhost:11434"
).replace(/\/+$/, "");
const OLLAMA_COMPLETION_MODEL =
    process.env.OLLAMA_COMPLETION_MODEL || "deepseek-coder:1.3b";
const OLLAMA_CHAT_MODEL =
    process.env.OLLAMA_CHAT_MODEL || "qwen2.5-coder:7b-instruct";

// Timeout for different operations
const COMPLETION_TIMEOUT_MS = 120000; // 120s for autocomplete (cold start can take a while)
const CHAT_TIMEOUT_MS = 300000; // 300s (5m) for chat, models take time to load/think
const CHAT_INITIAL_TIMEOUT_MS = 120000; // 120s for first chunk from streaming
const CHAT_ACTIVITY_TIMEOUT_MS = 30000; // 30s inactivity timeout between chunks
const HEALTH_TIMEOUT_MS = 10000; // 10s for health check

// Auto-detect local vs ngrok mode
const isLocalOllama = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(
    OLLAMA_BASE_URL,
);

// Base headers for all requests
const BASE_HEADERS: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
};

// Ngrok free tier requires extra headers to bypass browser warning.
// Skip these when running locally to avoid unnecessary overhead.
const NGROK_HEADERS: Record<string, string> = isLocalOllama
    ? BASE_HEADERS
    : {
          ...BASE_HEADERS,
          "ngrok-skip-browser-warning": "69420",
          "User-Agent": "CodeSense-AIoT-Platform/1.0",
      };

// ===== Helper Functions =====

/**
 * Create an AbortController with timeout
 */
function createTimeoutController(timeoutMs: number): {
    controller: AbortController;
    clear: () => void;
} {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    return {
        controller,
        clear: () => clearTimeout(timeout),
    };
}

/**
 * Make a request to Ollama with retry logic
 */
async function ollamaFetch<T>(
    endpoint: string,
    options: RequestInit,
    timeoutMs: number,
    retries: number = 1,
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        const { controller, clear } = createTimeoutController(timeoutMs);

        try {
            const response = await fetch(`${OLLAMA_BASE_URL}${endpoint}`, {
                ...options,
                headers: { ...NGROK_HEADERS, ...options.headers },
                signal: controller.signal,
            });

            clear();

            if (!response.ok) {
                const errorText = await response
                    .text()
                    .catch(() => "Unknown error");
                throw new Error(
                    `Ollama API error ${response.status}: ${errorText}`,
                );
            }

            return (await response.json()) as T;
        } catch (error) {
            clear();
            lastError =
                error instanceof Error ? error : new Error(String(error));

            if (lastError.name === "AbortError") {
                lastError = new Error(
                    `Ollama request timed out after ${timeoutMs}ms`,
                );
            }

            // Don't retry on non-retryable errors
            if (attempt < retries) {
                // Exponential backoff: 500ms, 1000ms, 2000ms...
                await new Promise((resolve) =>
                    setTimeout(resolve, 500 * Math.pow(2, attempt)),
                );
            }
        }
    }

    throw lastError || new Error("Ollama request failed");
}

// ===== FIM (Fill-in-Middle) Format =====

/**
 * Build a FIM prompt for DeepSeek Coder
 * DeepSeek Coder uses special tokens for fill-in-middle completion
 */
export function buildFIMPrompt(prefix: string, suffix: string): string {
    return `<｜fim▁begin｜>${prefix}<｜fim▁hole｜>${suffix}<｜fim▁end｜>`;
}

// ===== Public API =====

/**
 * Code completion using FIM (Fill-in-Middle)
 * Uses deepseek-coder:1.3b for fast autocomplete
 */
export async function getCodeCompletion(
    prefix: string,
    suffix: string,
    options?: { maxTokens?: number; temperature?: number },
): Promise<{ completion: string; durationMs: number }> {
    const prompt = buildFIMPrompt(prefix, suffix);

    const request: OllamaGenerateRequest = {
        model: OLLAMA_COMPLETION_MODEL,
        prompt,
        stream: false,
        options: {
            temperature: options?.temperature ?? 0.2,
            num_predict: options?.maxTokens ?? 128,
            top_p: 0.9,
            stop: [
                "\n\n",
                "<｜fim▁begin｜>",
                "<｜fim▁hole｜>",
                "<｜fim▁end｜>",
                "<|endoftext|>",
            ],
        },
    };

    const response = await ollamaFetch<OllamaGenerateResponse>(
        "/api/generate",
        { method: "POST", body: JSON.stringify(request) },
        COMPLETION_TIMEOUT_MS,
        1, // 1 retry
    );

    const durationMs = response.total_duration
        ? Math.round(response.total_duration / 1e6) // nanoseconds to ms
        : 0;

    return {
        completion: response.response?.trim() || "",
        durationMs,
    };
}

/**
 * Chat completion (non-streaming)
 * Uses codellama:13b-instruct for chat/generation/review
 */
export async function getChatCompletion(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    options?: { maxTokens?: number; temperature?: number; modelId?: string },
): Promise<{ content: string; durationMs: number }> {
    const request: OllamaChatRequest = {
        model: options?.modelId || OLLAMA_CHAT_MODEL,
        messages,
        stream: false,
        options: {
            temperature: options?.temperature ?? 0.3,
            num_predict: options?.maxTokens ?? 1024,
            top_p: 0.9,
            num_ctx: 2048,
        },
    };

    const response = await ollamaFetch<OllamaChatResponse>(
        "/api/chat",
        { method: "POST", body: JSON.stringify(request) },
        CHAT_TIMEOUT_MS,
        1,
    );

    const durationMs = response.total_duration
        ? Math.round(response.total_duration / 1e6)
        : 0;

    return {
        content: response.message?.content || "",
        durationMs,
    };
}

export interface ChatWithToolsResult {
    content: string;
    toolCalls: OllamaToolCall[] | null;
    durationMs: number;
}

/**
 * Parse Qwen 2.5 Coder text-based tool calls.
 * Qwen outputs tool calls as JSON in content instead of structured tool_calls.
 * Handles: {"name":"func","arguments":{}}, ```json {...} ```, text before/after JSON.
 */
function parseToolCallsFromText(content: string): OllamaToolCall[] {
    if (!content || typeof content !== "string") return [];

    const toToolCall = (parsed: { name?: string; arguments?: Record<string, unknown> }) => {
        if (parsed?.name && typeof parsed.name === "string") {
            return {
                type: "function" as const,
                function: {
                    name: parsed.name,
                    arguments:
                        parsed.arguments && typeof parsed.arguments === "object"
                            ? parsed.arguments
                            : {},
                },
            };
        }
        return null;
    };

    const results: OllamaToolCall[] = [];

    const tryParse = (raw: string): boolean => {
        const trimmed = raw.trim();
        if (!trimmed) return false;
        try {
            const parsed = JSON.parse(trimmed) as
                | { name?: string; arguments?: Record<string, unknown> }
                | Array<{ name?: string; arguments?: Record<string, unknown> }>;
            if (Array.isArray(parsed)) {
                for (const item of parsed) {
                    const tc = toToolCall(item);
                    if (tc) results.push(tc);
                }
            } else {
                const tc = toToolCall(parsed);
                if (tc) results.push(tc);
            }
            return results.length > 0;
        } catch {
            return false;
        }
    };

    // 1. Markdown code block: ```json ... ``` or ``` ... ```
    const blockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (blockMatch && tryParse(blockMatch[1])) return results;

    // 2. Find JSON object via brace matching (handles text before/after)
    const nameIdx = content.search(/"name"\s*:\s*"/);
    if (nameIdx !== -1) {
        const start = content.lastIndexOf("{", nameIdx);
        if (start !== -1) {
            let depth = 0;
            for (let i = start; i < content.length; i++) {
                const c = content[i];
                if (c === "{") depth++;
                else if (c === "}") {
                    depth--;
                    if (depth === 0) {
                        const slice = content.slice(start, i + 1);
                        if (tryParse(slice)) return results;
                        break;
                    }
                }
            }
        }
    }

    // 3. Brute-force: try JSON.parse from each { (handles nested content in edit_code)
    if (results.length === 0) {
        for (let i = 0; i < content.length; i++) {
            if (content[i] !== "{") continue;
            for (let j = content.length; j > i + 10; j--) {
                try {
                    const parsed = JSON.parse(content.slice(i, j)) as {
                        name?: string;
                        arguments?: Record<string, unknown>;
                    };
                    if (
                        parsed &&
                        (parsed.name === "read_code" || parsed.name === "edit_code")
                    ) {
                        const tc = toToolCall(parsed);
                        if (tc) results.push(tc);
                        return results;
                    }
                } catch {
                    /* try shorter slice */
                }
            }
        }
    }

    return results;
}

/**
 * Chat completion with tools (non-streaming, for agent)
 * Returns content and tool_calls if model requests tool execution.
 * Falls back to parsing Qwen text-based tool calls when tool_calls is empty.
 */
export async function getChatCompletionWithTools(
    messages: Array<
        | { role: "user" | "assistant" | "system"; content: string }
        | {
              role: "assistant";
              content?: string;
              tool_calls?: OllamaToolCall[];
          }
        | { role: "tool"; tool_name: string; content: string }
    >,
    tools: OllamaToolDefinition[],
    options?: {
        maxTokens?: number;
        temperature?: number;
        modelId?: string;
    },
): Promise<ChatWithToolsResult> {
    const request: OllamaChatRequest & { tools?: OllamaToolDefinition[] } = {
        model: options?.modelId || OLLAMA_CHAT_MODEL,
        messages: messages as OllamaChatRequest["messages"],
        stream: false,
        tools,
        tool_choice: "auto",
        options: {
            temperature: options?.temperature ?? 0.3,
            num_predict: options?.maxTokens ?? 2048,
            top_p: 0.9,
            num_ctx: 4096,
        },
    };

    const response = await ollamaFetch<OllamaChatResponse>(
        "/api/chat",
        { method: "POST", body: JSON.stringify(request) },
        CHAT_TIMEOUT_MS,
        1,
    );

    const durationMs = response.total_duration
        ? Math.round(response.total_duration / 1e6)
        : 0;

    let toolCalls: OllamaToolCall[] | null =
        response.message?.tool_calls && response.message.tool_calls.length > 0
            ? response.message.tool_calls
            : null;

    // Qwen 2.5 Coder outputs tool calls as text - parse content when tool_calls is empty
    if (!toolCalls && response.message?.content) {
        const parsed = parseToolCallsFromText(response.message.content);
        if (parsed.length > 0) toolCalls = parsed;
    }

    return {
        content: response.message?.content || "",
        toolCalls,
        durationMs,
    };
}

export type ToolsStreamChunk =
    | { type: "chunk"; content: string }
    | { type: "done"; content: string; toolCalls: OllamaToolCall[] | null };

/**
 * Chat completion with tools - STREAMING version for reduced latency.
 * Streams content chunks as they arrive; emits done with full content + toolCalls at end.
 * Buffers content that looks like JSON (tool call) to avoid showing raw JSON to user.
 */
export async function getChatCompletionWithToolsStream(
    messages: Array<
        | { role: "user" | "assistant" | "system"; content: string }
        | {
              role: "assistant";
              content?: string;
              tool_calls?: OllamaToolCall[];
          }
        | { role: "tool"; tool_name: string; content: string }
    >,
    tools: OllamaToolDefinition[],
    options?: {
        maxTokens?: number;
        temperature?: number;
        modelId?: string;
    },
): Promise<ReadableStream<ToolsStreamChunk>> {
    const request: OllamaChatRequest & { tools?: OllamaToolDefinition[] } = {
        model: options?.modelId || OLLAMA_CHAT_MODEL,
        messages: messages as OllamaChatRequest["messages"],
        stream: true,
        tools,
        tool_choice: "auto",
        options: {
            temperature: options?.temperature ?? 0.3,
            num_predict: options?.maxTokens ?? 2048,
            top_p: 0.9,
            num_ctx: 4096,
        },
    };

    const { controller: fetchController, clear: clearInitial } =
        createTimeoutController(CHAT_INITIAL_TIMEOUT_MS);

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: "POST",
        headers: NGROK_HEADERS,
        body: JSON.stringify(request),
        signal: fetchController.signal,
    });

    clearInitial();

    if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(
            `Ollama streaming error ${response.status}: ${errorText}`,
        );
    }

    if (!response.body) {
        throw new Error("No response body for streaming");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let bufferMode: boolean | null = null; // null = not yet decided, true = buffer (JSON), false = stream
    let totalContent = ""; // always accumulate for final content

    return new ReadableStream<ToolsStreamChunk>({
        async pull(streamController) {
            try {
                const chunkTimeout = setTimeout(() => {
                    reader.cancel();
                    streamController.error(
                        new Error("Stream inactivity timeout"),
                    );
                }, CHAT_ACTIVITY_TIMEOUT_MS);

                const { done, value } = await reader.read();
                clearTimeout(chunkTimeout);

                if (done) {
                    if (buffer.trim()) {
                        try {
                            const data = JSON.parse(
                                buffer.trim(),
                            ) as OllamaChatResponse;
                            const content = data.message?.content || "";
                            totalContent += content;
                            let toolCalls: OllamaToolCall[] | null =
                                data.message?.tool_calls &&
                                data.message.tool_calls.length > 0
                                    ? data.message.tool_calls
                                    : null;
                            if (
                                !toolCalls &&
                                totalContent &&
                                parseToolCallsFromText(totalContent).length > 0
                            ) {
                                toolCalls = parseToolCallsFromText(totalContent);
                            }
                            streamController.enqueue({
                                type: "done",
                                content: totalContent,
                                toolCalls,
                            });
                        } catch {
                            streamController.enqueue({
                                type: "done",
                                content: totalContent,
                                toolCalls: null,
                            });
                        }
                    } else {
                        streamController.enqueue({
                            type: "done",
                            content: totalContent,
                            toolCalls: null,
                        });
                    }
                    streamController.close();
                    return;
                }

                const text = decoder.decode(value, { stream: true });
                buffer += text;
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;
                    try {
                        const data = JSON.parse(trimmed) as OllamaChatResponse & {
                            message?: {
                                content?: string;
                                tool_calls?: OllamaToolCall[];
                            };
                        };
                        const content = data.message?.content || "";
                        const hasToolCalls =
                            data.message?.tool_calls &&
                            data.message.tool_calls.length > 0;

                        if (content) {
                            totalContent += content;
                            if (bufferMode === null) {
                                const looksLikeJson = /^\s*[\{\`]/.test(
                                    content.trim(),
                                );
                                bufferMode = looksLikeJson;
                            }
                            if (!bufferMode) {
                                streamController.enqueue({
                                    type: "chunk",
                                    content,
                                });
                            }
                        }

                        if (hasToolCalls) {
                            let toolCalls =
                                data.message!.tool_calls as OllamaToolCall[];
                            if (toolCalls.length === 0 && totalContent) {
                                const parsed =
                                    parseToolCallsFromText(totalContent);
                                if (parsed.length > 0) toolCalls = parsed;
                            }
                            streamController.enqueue({
                                type: "done",
                                content: totalContent,
                                toolCalls:
                                    toolCalls.length > 0 ? toolCalls : null,
                            });
                            streamController.close();
                            return;
                        }

                        if (data.done) {
                            let toolCalls: OllamaToolCall[] | null =
                                data.message?.tool_calls &&
                                data.message.tool_calls.length > 0
                                    ? data.message.tool_calls
                                    : null;
                            if (!toolCalls && totalContent) {
                                const parsed =
                                    parseToolCallsFromText(totalContent);
                                if (parsed.length > 0) toolCalls = parsed;
                            }
                            streamController.enqueue({
                                type: "done",
                                content: totalContent,
                                toolCalls,
                            });
                            streamController.close();
                            return;
                        }
                    } catch {
                        /* skip malformed line */
                    }
                }
            } catch (error) {
                streamController.error(error);
            }
        },
        cancel() {
            reader.cancel();
        },
    });
}

/**
 * Chat completion with streaming
 * Returns a ReadableStream of text chunks
 */
export async function getChatCompletionStream(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    options?: { maxTokens?: number; temperature?: number; modelId?: string },
): Promise<ReadableStream<string>> {
    const request: OllamaChatRequest = {
        model: options?.modelId || OLLAMA_CHAT_MODEL,
        messages,
        stream: true,
        options: {
            temperature: options?.temperature ?? 0.3,
            num_predict: options?.maxTokens ?? 1024,
            top_p: 0.9,
            num_ctx: 2048,
        },
    };

    // Use initial timeout for the first response (model loading + first token)
    const { controller: fetchController, clear: clearInitial } =
        createTimeoutController(CHAT_INITIAL_TIMEOUT_MS);

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: "POST",
        headers: NGROK_HEADERS,
        body: JSON.stringify(request),
        signal: fetchController.signal,
    });

    clearInitial();

    if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(
            `Ollama streaming error ${response.status}: ${errorText}`,
        );
    }

    if (!response.body) {
        throw new Error("No response body for streaming");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    return new ReadableStream<string>({
        async pull(streamController) {
            try {
                // Per-chunk activity timeout: abort if no data for 30s
                const chunkTimeout = setTimeout(() => {
                    reader.cancel();
                    streamController.close();
                }, CHAT_ACTIVITY_TIMEOUT_MS);

                const { done, value } = await reader.read();
                clearTimeout(chunkTimeout);

                if (done) {
                    if (buffer.trim()) {
                        try {
                            const data = JSON.parse(
                                buffer.trim(),
                            ) as OllamaChatResponse;
                            if (data.message?.content) {
                                streamController.enqueue(data.message.content);
                            }
                        } catch {}
                    }
                    streamController.close();
                    return;
                }

                const text = decoder.decode(value, { stream: true });
                buffer += text;
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;
                    try {
                        const data = JSON.parse(trimmed) as OllamaChatResponse;
                        if (data.message?.content) {
                            streamController.enqueue(data.message.content);
                        }
                        if (data.done) {
                            streamController.close();
                            return;
                        }
                    } catch {
                        // Skip malformed JSON lines
                    }
                }
            } catch (error) {
                streamController.error(error);
            }
        },
        cancel() {
            reader.cancel();
        },
    });
}

/**
 * Health check - verify Ollama server is reachable and models are available
 */
export async function checkHealth(): Promise<{
    status: "connected" | "disconnected" | "error";
    models: string[];
    latencyMs: number;
    error?: string;
}> {
    const start = Date.now();

    try {
        const response = await ollamaFetch<OllamaTagsResponse>(
            "/api/tags",
            { method: "GET" },
            HEALTH_TIMEOUT_MS,
            0, // no retry for health check
        );

        const models = response.models?.map((m) => m.name) || [];
        const latencyMs = Date.now() - start;

        return {
            status: "connected",
            models,
            latencyMs,
        };
    } catch (error) {
        const latencyMs = Date.now() - start;
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

        return {
            status: "disconnected",
            models: [],
            latencyMs,
            error: errorMessage,
        };
    }
}

/**
 * Get configuration info (for debugging/settings)
 */
export function getOllamaConfig() {
    return {
        baseUrl: OLLAMA_BASE_URL,
        completionModel: OLLAMA_COMPLETION_MODEL,
        chatModel: OLLAMA_CHAT_MODEL,
    };
}
