/**
 * Centralized secure fetch utility.
 *
 * Automatically attaches the CSRF token (from cookie) to all
 * mutating HTTP methods (POST, PUT, PATCH, DELETE).
 *
 * Usage:
 *   import { secureFetch } from "@/lib/secure-fetch";
 *   const res = await secureFetch("/api/courses", { method: "POST", body: ... });
 */

function getCSRFToken(): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
}

export async function secureFetch(
    url: string,
    options: RequestInit = {},
): Promise<Response> {
    const method = (options.method || "GET").toUpperCase();
    const headers = new Headers(options.headers);

    // Auto-attach CSRF token for mutating methods
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        const csrfToken = getCSRFToken();
        if (csrfToken) {
            headers.set("X-CSRF-Token", csrfToken);
        }
    }

    return fetch(url, {
        ...options,
        headers,
        credentials: "include",
    });
}

export { getCSRFToken };
