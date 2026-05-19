type CompactableAIMessage = {
    role: string;
    content: string;
};

interface CompactAIMessageHistoryOptions {
    maxMessages?: number;
    maxUserChars?: number;
    maxAssistantChars?: number;
}

const DEFAULT_MAX_MESSAGES = 8;
const DEFAULT_MAX_USER_CHARS = 1800;
const DEFAULT_MAX_ASSISTANT_CHARS = 900;
const TRUNCATED_SUFFIX = "...[đã cắt bớt]";

function truncateContent(content: string, maxChars: number): string {
    if (content.length <= maxChars) return content;
    return `${content.slice(0, maxChars)}${TRUNCATED_SUFFIX}`;
}

export function compactAIMessageHistory<T extends CompactableAIMessage>(
    messages: T[],
    {
        maxMessages = DEFAULT_MAX_MESSAGES,
        maxUserChars = DEFAULT_MAX_USER_CHARS,
        maxAssistantChars = DEFAULT_MAX_ASSISTANT_CHARS,
    }: CompactAIMessageHistoryOptions = {},
): T[] {
    return messages
        .filter(
            (message) =>
                message.role === "user" || message.role === "assistant",
        )
        .slice(-maxMessages)
        .map((message) => {
            const maxChars =
                message.role === "assistant"
                    ? maxAssistantChars
                    : maxUserChars;
            return {
                ...message,
                content: truncateContent(message.content, maxChars),
            };
        });
}
