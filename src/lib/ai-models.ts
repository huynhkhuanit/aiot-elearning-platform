export const DEFAULT_OLLAMA_COMPLETION_MODEL = "deepseek-coder:1.3b";
export const DEFAULT_OLLAMA_CHAT_MODEL = "qwen2.5-coder:7b-instruct";
export const DEFAULT_OLLAMA_TUTOR_MODEL = "qwen2.5:7b-instruct";
export const DEFAULT_OLLAMA_FAST_MODEL = "qwen2.5:3b-instruct";

export interface OllamaUIModel {
    id: string;
    name: string;
    provider: string;
    providerSlug: string;
    description?: string;
}

export const APPROVED_OLLAMA_MODELS: OllamaUIModel[] = [
    {
        id: DEFAULT_OLLAMA_FAST_MODEL,
        name: "Qwen 2.5 3B ⚡",
        provider: "Ollama",
        providerSlug: "alibaba",
        description: "Nhanh — phản hồi tức thì cho câu hỏi cơ bản",
    },
    {
        id: DEFAULT_OLLAMA_TUTOR_MODEL,
        name: "Qwen 2.5 7B",
        provider: "Ollama",
        providerSlug: "alibaba",
        description: "Tối ưu cho AI Tutor và giải thích bài học",
    },
    {
        id: DEFAULT_OLLAMA_CHAT_MODEL,
        name: "Qwen 2.5 Coder 7B",
        provider: "Ollama",
        providerSlug: "alibaba",
        description: "Chuyên cho chat code và tác vụ lập trình",
    },
    {
        id: DEFAULT_OLLAMA_COMPLETION_MODEL,
        name: "DeepSeek Coder 1.3B",
        provider: "Ollama",
        providerSlug: "deepseek",
        description: "Autocomplete nhanh và nhẹ",
    },
];
