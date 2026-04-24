"use client";

import { useEffect } from "react";
import { getCSRFToken } from "@/lib/secure-fetch";

/**
 * Global fetch interceptor that auto-attaches CSRF tokens
 * to all mutating requests (POST, PUT, PATCH, DELETE).
 *
 * Mount once in the root layout to protect all client-side
 * fetch calls without modifying individual components.
 */
export function CSRFInterceptor() {
    useEffect(() => {
        const originalFetch = window.fetch;

        window.fetch = async function (
            input: RequestInfo | URL,
            init?: RequestInit,
        ): Promise<Response> {
            const method = (init?.method || "GET").toUpperCase();
            const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(
                method,
            );

            if (isMutation) {
                const csrfToken = getCSRFToken();
                if (csrfToken) {
                    const headers = new Headers(init?.headers);
                    // Don't overwrite if already set
                    if (!headers.has("X-CSRF-Token")) {
                        headers.set("X-CSRF-Token", csrfToken);
                    }
                    init = { ...init, headers };
                }
            }

            return originalFetch.call(window, input, init);
        };

        return () => {
            // Restore original fetch on unmount
            window.fetch = originalFetch;
        };
    }, []);

    return null;
}
