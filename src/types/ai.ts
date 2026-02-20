// AI Assistant type definitions

// ===== Chat Types =====

export interface AIChatMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: number;
    codeBlock?: {
        code: string;
        language: string;
    };
}

export interface AIChatRequest {
    messages: AIChatMessage[];
    codeContext?: string;
    language?: string;
}

export interface AIChatStreamChunk {
    content: string;
    done: boolean;
}

// ===== Code Completion Types =====

export interface AICompletionRequest {
    prefix: string;
    suffix: string;
    language: string;
    maxTokens?: number;
}

export interface AICompletionResponse {
    completion: string;
    model: string;
    durationMs: number;
}

// ===== Code Generation Types =====

export interface AICodeGenerationRequest {
    prompt: string;
    language: string;
    existingCode?: string;
}

export interface AICodeGenerationResponse {
    code: string;
    explanation: string;
    language: string;
    model: string;
}

// ===== Error Explanation Types =====

export interface AIErrorExplanationRequest {
    error: string;
    code: string;
    language: string;
}

export interface AIErrorExplanationResponse {
    explanation: string;
    suggestion: string;
    fixedCode?: string;
    model: string;
}

// ===== Health Check Types =====

export interface AIHealthResponse {
    status: "connected" | "disconnected" | "error";
    models: string[];
    baseUrl: string;
    latencyMs?: number;
    error?: string;
}

// ===== Settings Types =====

export interface AIAssistantSettings {
    enabled: boolean;
    autocompleteEnabled: boolean;
    autocompleteDelay: number; // milliseconds
    serverUrl: string;
    completionModel: string;
    chatModel: string;
}

export const DEFAULT_AI_SETTINGS: AIAssistantSettings = {
    enabled: true,
    autocompleteEnabled: true,
    autocompleteDelay: 300,
    serverUrl: "",
    completionModel: "deepseek-coder:1.3b",
    chatModel: "qwen2.5-coder:7b-instruct",
};

// ===== Ollama API Types (internal) =====

export interface OllamaGenerateRequest {
    model: string;
    prompt: string;
    stream?: boolean;
    options?: {
        temperature?: number;
        num_predict?: number;
        num_ctx?: number;
        top_p?: number;
        top_k?: number;
        stop?: string[];
    };
}

export interface OllamaGenerateResponse {
    model: string;
    response: string;
    done: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    eval_count?: number;
    eval_duration?: number;
}

export interface OllamaChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface OllamaToolCall {
    type: "function";
    function: {
        index?: number;
        name: string;
        arguments?: string | Record<string, unknown>;
    };
}

export interface OllamaChatMessageWithTools extends OllamaChatMessage {
    tool_calls?: OllamaToolCall[];
}

export interface OllamaToolDefinition {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: "object";
            required?: string[];
            properties: Record<string, { type: string; description?: string }>;
        };
    };
}

export interface OllamaChatRequest {
    model: string;
    messages: OllamaChatMessage[];
    tools?: OllamaToolDefinition[];
    tool_choice?: "auto" | "none";
    stream?: boolean;
    options?: {
        temperature?: number;
        num_predict?: number;
        num_ctx?: number;
        top_p?: number;
        top_k?: number;
        stop?: string[];
    };
}

export interface OllamaChatResponse {
    model: string;
    message: OllamaChatMessageWithTools;
    done: boolean;
    total_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

export interface OllamaTagsResponse {
    models: Array<{
        name: string;
        model: string;
        size: number;
        digest: string;
        modified_at: string;
    }>;
}
