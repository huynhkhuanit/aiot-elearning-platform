export type OllamaEndpointKind = "local" | "remote";

export interface OllamaEndpointCandidate {
    baseUrl: string;
    kind: OllamaEndpointKind;
    headers: Record<string, string>;
}

interface CreateOllamaEndpointCandidatesOptions {
    baseUrl: string;
    localBaseUrl?: string;
    preferLocal?: boolean;
}

const BASE_HEADERS: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
};

export function normalizeOllamaBaseUrl(baseUrl: string): string {
    return baseUrl.trim().replace(/\/+$/, "");
}

export function isLocalOllamaBaseUrl(baseUrl: string): boolean {
    return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?/i.test(
        normalizeOllamaBaseUrl(baseUrl),
    );
}

export function parseBooleanEnv(value: string | undefined): boolean {
    return /^(1|true|yes|on)$/i.test(value?.trim() || "");
}

function createHeaders(baseUrl: string): Record<string, string> {
    if (isLocalOllamaBaseUrl(baseUrl)) {
        return BASE_HEADERS;
    }

    return {
        ...BASE_HEADERS,
        "ngrok-skip-browser-warning": "69420",
        "User-Agent": "CodeSense-AI-Platform/1.0",
    };
}

export function createOllamaEndpointCandidates({
    baseUrl,
    localBaseUrl,
    preferLocal = false,
}: CreateOllamaEndpointCandidatesOptions): OllamaEndpointCandidate[] {
    const endpoints: OllamaEndpointCandidate[] = [];
    const seen = new Set<string>();

    const addEndpoint = (
        rawBaseUrl: string | undefined,
        preferredKind: OllamaEndpointKind,
    ) => {
        if (!rawBaseUrl?.trim()) return;

        const normalized = normalizeOllamaBaseUrl(rawBaseUrl);
        if (!normalized || seen.has(normalized)) return;

        seen.add(normalized);
        endpoints.push({
            baseUrl: normalized,
            kind: preferredKind,
            headers: createHeaders(normalized),
        });
    };

    if (preferLocal) {
        addEndpoint(localBaseUrl, "local");
    }

    addEndpoint(baseUrl, isLocalOllamaBaseUrl(baseUrl) ? "local" : "remote");

    return endpoints;
}
