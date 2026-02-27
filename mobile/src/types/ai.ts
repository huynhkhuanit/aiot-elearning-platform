export interface AIChatMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: number;
}

export interface AIModel {
    id: string;
    name: string;
    provider: string;
}

export const AI_MODELS: AIModel[] = [
    {
        id: "deepseek-coder:1.3b",
        name: "DeepSeek Coder 1.3B",
        provider: "Ollama",
    },
    {
        id: "qwen2.5-coder:7b-instruct",
        name: "Qwen 2.5 Coder 7B",
        provider: "Ollama",
    },
];

export type AIServerStatus = "connected" | "checking" | "disconnected";
