import { API_BASE_URL } from "../api/client";

/**
 * Simple network connectivity check using a lightweight fetch.
 * Does not require any native modules — works on all Expo/RN environments.
 */
export async function checkServerReachable(): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5_000);

        // Use a lightweight endpoint (or just the root) to check reachability
        const response = await fetch(`${API_BASE_URL}/api/health`, {
            method: "GET",
            signal: controller.signal,
            headers: { "X-Client-Platform": "mobile" },
        });

        clearTimeout(timeout);
        return response.ok || response.status < 500;
    } catch {
        return false;
    }
}

/**
 * Retry a function with exponential backoff.
 * Only retries on network errors (isNetworkError flag on the error).
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        baseDelayMs?: number;
        shouldRetry?: (error: any) => boolean;
    } = {},
): Promise<T> {
    const {
        maxRetries = 2,
        baseDelayMs = 1000,
        shouldRetry = (err) => err?.isNetworkError === true,
    } = options;

    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            if (attempt >= maxRetries || !shouldRetry(error)) {
                throw error;
            }

            // Exponential backoff: 1s, 2s, 4s...
            const delay = baseDelayMs * Math.pow(2, attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}
