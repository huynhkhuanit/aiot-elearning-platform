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
