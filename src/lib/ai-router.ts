/**
 * AI Smart Router — Classify question complexity and select optimal model.
 *
 * On CPU-only VPS, model size directly impacts tokens/s:
 *   3B ≈ 15-25 tok/s  |  7B ≈ 5-8 tok/s
 *
 * Route simple questions to the fast 3B model, complex ones to 7B.
 */

const CODE_BLOCK_RE = /```[\s\S]*?```/;
const COMPLEX_KEYWORDS_RE =
    /so sánh|phân tích|debug|sửa lỗi|refactor|tối ưu|optimize|viết code|implement|xây dựng|thiết kế|architecture|algorithm|thuật toán|đệ quy|recursion|promise|async|concurrent|thread|design pattern|hãy viết|write.*function|compare|difference between/i;
const SIMPLE_KEYWORDS_RE =
    /là gì|what is|giải thích|explain|tóm tắt|summary|ví dụ|example|nghĩa là|có nghĩa|định nghĩa|define|hello|xin chào|cảm ơn|thanks/i;

export type QueryComplexity = "simple" | "complex";

interface ClassifyOptions {
    message: string;
    historyLength: number;
    hasCodeBlock?: boolean;
    hasLearningContext?: boolean;
    learningContentLength?: number;
}

/**
 * Classify a user query as simple or complex using fast heuristics (no AI call).
 *
 * Decision matrix (any "complex" signal wins):
 *   - Contains code block           → complex
 *   - Complex keywords detected     → complex
 *   - Message > 200 chars           → complex
 *   - Deep conversation (>6 msgs)   → complex
 *   - Heavy learning context        → complex
 *   - Otherwise                     → simple
 */
export function classifyComplexity(opts: ClassifyOptions): QueryComplexity {
    const { message, historyLength, hasLearningContext, learningContentLength } = opts;
    const trimmed = message.trim();

    // Code blocks always need the stronger model
    if (CODE_BLOCK_RE.test(trimmed) || opts.hasCodeBlock) return "complex";

    // Keyword-based detection
    if (COMPLEX_KEYWORDS_RE.test(trimmed)) return "complex";

    // Long messages imply nuanced questions
    if (trimmed.length > 200) return "complex";

    // Deep conversations need context continuity (7B handles better)
    if (historyLength > 6) return "complex";

    // Heavy learning context = more reasoning needed
    if (hasLearningContext && (learningContentLength ?? 0) > 1000) return "complex";

    // Simple keyword match → definitely simple
    if (SIMPLE_KEYWORDS_RE.test(trimmed)) return "simple";

    // Default: medium-length messages without signals → simple (favor speed)
    return "simple";
}

/**
 * Select the optimal model ID based on complexity and endpoint type.
 */
export function selectModel(
    complexity: QueryComplexity,
    endpoint: "tutor" | "chat" | "agent",
    config: { fastModel: string; tutorModel: string; chatModel: string },
): string {
    // Agent always needs 7B (tool calling requires stronger model)
    if (endpoint === "agent") return config.chatModel;

    if (complexity === "simple") return config.fastModel;

    return endpoint === "tutor" ? config.tutorModel : config.chatModel;
}

/**
 * Select optimized Ollama params based on model size and complexity.
 * Smaller models get smaller context windows and token limits for speed.
 */
export function selectModelParams(
    modelId: string,
    complexity: QueryComplexity,
): { num_ctx: number; num_predict: number; temperature: number } {
    const is3B = /3b/i.test(modelId);
    const is1B = /[:\-](0\.5|1|1\.3|1\.5)b/i.test(modelId);

    if (is1B) {
        return { num_ctx: 2048, num_predict: 256, temperature: 0.2 };
    }

    if (is3B) {
        return {
            num_ctx: complexity === "simple" ? 2048 : 4096,
            num_predict: complexity === "simple" ? 512 : 1024,
            temperature: 0.25,
        };
    }

    // 7B+ models
    return {
        num_ctx: complexity === "simple" ? 4096 : 8192,
        num_predict: complexity === "simple" ? 1024 : 4096,
        temperature: 0.3,
    };
}
