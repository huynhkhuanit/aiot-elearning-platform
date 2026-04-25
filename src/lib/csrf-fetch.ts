export function isMutatingMethod(method: string | undefined): boolean {
    return ["POST", "PUT", "PATCH", "DELETE"].includes(
        (method || "GET").toUpperCase(),
    );
}

function getRequestMethod(input: RequestInfo | URL, init?: RequestInit): string {
    if (init?.method) return init.method;
    if (typeof Request !== "undefined" && input instanceof Request) {
        return input.method;
    }
    return "GET";
}

export function buildCSRFProtectedInit(
    input: RequestInfo | URL,
    init: RequestInit = {},
    csrfToken?: string | null,
): RequestInit {
    if (!csrfToken || !isMutatingMethod(getRequestMethod(input, init))) {
        return init;
    }

    const headers = new Headers(init.headers);
    if (!headers.has("X-CSRF-Token")) {
        headers.set("X-CSRF-Token", csrfToken);
    }

    return { ...init, headers };
}
