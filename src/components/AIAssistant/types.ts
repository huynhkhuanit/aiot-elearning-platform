import { APPROVED_OLLAMA_MODELS } from "@/lib/ai-models";

// AI Agent Assistant local types

export type AIAgentMode = "agent" | "ask";

export interface AIModel {
    id: string;
    name: string;
    provider: string;
    /** Slug for models.dev logo */
    providerSlug: string;
    description?: string;
}

export const AI_MODELS: AIModel[] = APPROVED_OLLAMA_MODELS;

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
    code?: CodeState;
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
