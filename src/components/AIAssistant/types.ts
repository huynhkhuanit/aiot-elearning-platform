// AI Agent Assistant — Local Types

export type AIAgentMode = "agent" | "ask" | "plan";

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
    { id: "codellama:13b-instruct", name: "CodeLlama 13B", provider: "Ollama" },
];

export const AI_MODE_CONFIG: Record<
    AIAgentMode,
    { label: string; description: string }
> = {
    agent: {
        label: "Agent",
        description: "Tự động phân tích, sửa code, và thực thi",
    },
    ask: { label: "Ask", description: "Hỏi đáp về code, khái niệm" },
    plan: {
        label: "Plan",
        description: "Lên kế hoạch, phân tích kiến trúc",
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

export interface AIAgentPanelProps {
    codeContext?: string;
    language?: string;
    onInsertCode?: (code: string) => void;
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
