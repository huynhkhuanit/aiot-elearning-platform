import { stripStreamingCursor } from "./typewriter";

export function getAssistantDisplayContent(content: string): string {
    return stripStreamingCursor(content);
}

export function isAssistantStreamingContent(content: string): boolean {
    return getAssistantDisplayContent(content) !== content;
}

export function shouldReplayAssistantTypewriter(
    _animateWords: boolean,
    _content: string,
): boolean {
    return false;
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
