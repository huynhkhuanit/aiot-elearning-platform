import type { OllamaChatRequest } from "../types/ai";

export function createOllamaChatRequest(
    request: Omit<OllamaChatRequest, "think">,
): OllamaChatRequest {
    return {
        ...request,
        think: false,
    };
}

