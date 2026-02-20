// AI Agent Assistant — Local Types

export type AIAgentMode = "agent" | "ask";

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

export const AI_MODE_CONFIG: Record<
    AIAgentMode,
    { label: string; description: string; accent: "amber" | "blue" }
> = {
    agent: {
        label: "Agent",
        description: "Tự động phân tích, sửa code, và thực thi",
        accent: "amber",
    },
    ask: {
        label: "Chat",
        description: "Hỏi đáp về code, khái niệm",
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
    onEditCode?: (
        tab: "html" | "css" | "javascript",
        content: string,
    ) => void;
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
