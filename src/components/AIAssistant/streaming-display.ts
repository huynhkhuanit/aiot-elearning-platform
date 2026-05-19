import { stripStreamingCursor } from "./typewriter";

export function getAssistantDisplayContent(content: string): string {
    return stripStreamingCursor(content);
}

export function isAssistantStreamingContent(content: string): boolean {
    return getAssistantDisplayContent(content) !== content;
}

export function shouldReplayAssistantTypewriter(
    isStreaming: boolean,
    content: string,
): boolean {
    // Replay the typewriter only while the assistant is actively streaming.
    // Static (already-completed) messages are shown immediately without re-typing.
    return isStreaming && content.length > 0;
}

export function shouldRenderAssistantMarkdown(_content: string): boolean {
    return true;
}

export function prepareAssistantMarkdownContent(
    content: string,
    isStreaming: boolean,
): string {
    const cleanContent = getAssistantDisplayContent(content);
    if (!isStreaming) return cleanContent;

    const fenceCount = cleanContent.match(/^```/gm)?.length ?? 0;
    if (fenceCount % 2 === 0) return cleanContent;

    return `${cleanContent}\n\`\`\``;
}
