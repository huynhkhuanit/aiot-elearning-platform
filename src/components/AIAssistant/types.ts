// AI Agent Assistant — Local Types

export type AIAgentMode = "agent" | "ask";

export interface AIModel {
    id: string;
    name: string;
    provider: string;
    /** Slug for models.dev logo — see https://models.dev/logos */
    providerSlug: string;
    description?: string;
}

export const AI_MODELS: AIModel[] = [
    {
        id: "deepseek-coder:1.3b",
        name: "DeepSeek Coder 1.3B",
        provider: "Ollama",
        providerSlug: "deepseek",
        description: "Mô hình nhỏ, phản hồi nhanh",
    },
    {
        id: "qwen2.5-coder:7b-instruct",
        name: "Qwen 2.5 Coder 7B",
        provider: "Ollama",
        providerSlug: "alibaba",
        description: "Hỗ trợ tool calling, phù hợp Agent mode",
    },
    {
        id: "llama3.2:3b",
        name: "Llama 3.2 3B",
        provider: "Ollama",
        providerSlug: "llama",
        description: "Mô hình đa năng từ Meta",
    },
    {
        id: "gemma3:4b",
        name: "Gemma 3 4B",
        provider: "Ollama",
        providerSlug: "google",
        description: "Mô hình của Google, hiệu suất tốt",
    },
];

export const AI_MODE_CONFIG: Record<
    AIAgentMode,
    { label: string; description: string; accent: "amber" | "blue" }
> = {
    agent: {
        label: "Tác vụ",
        description: "Tự động phân tích và sửa code theo ngữ cảnh.",
        accent: "amber",
    },
    ask: {
        label: "Trò chuyện",
        description: "Hỏi đáp về code và các khái niệm kỹ thuật.",
        accent: "blue",
    },
};

export interface ThinkingStep {
    id: string;
    label: string;
    status: "pending" | "active" | "complete";
    detail?: string;
}

export interface CodeBlockData {
    id: string;
    code: string;
    language: string;
    fileName?: string;
    status: "suggested" | "applied" | "rejected";
}

export interface AIConversation {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messageCount: number;
}

export interface CodeState {
    html: string;
    css: string;
    javascript: string;
}

export interface AIAgentPanelProps {
    codeContext?: string;
    language?: string;
    onInsertCode?: (code: string) => void;
    /** Full code state for Agent mode tools (read_code, edit_code) */
    code?: CodeState;
    /** Edit code by tab for Agent mode edit_code tool */
    onEditCode?: (tab: "html" | "css" | "javascript", content: string) => void;
    className?: string;
    theme?: "light" | "dark";
}

export type AIServerStatus = "connected" | "checking" | "disconnected";

export interface QuickAction {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description?: string;
    prompt: string;
}
