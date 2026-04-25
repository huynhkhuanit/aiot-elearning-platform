"use client";

import { useEffect } from "react";
import { getCSRFToken } from "@/lib/secure-fetch";
import { buildCSRFProtectedInit } from "@/lib/csrf-fetch";

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
            const protectedInit = buildCSRFProtectedInit(
                input,
                init,
                getCSRFToken(),
            );

            return originalFetch(input, protectedInit);
        };

        return () => {
            // Restore original fetch on unmount
            window.fetch = originalFetch;
        };
    }, []);

    return null;
}
