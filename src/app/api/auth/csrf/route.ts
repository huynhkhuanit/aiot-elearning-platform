import { NextResponse } from "next/server";
import { generateCSRFToken, setCSRFCookie } from "@/lib/csrf";

/**
 * GET /api/auth/csrf
 *
 * Returns a fresh CSRF token, also set as a cookie.
 * Client should call this on page load and include
 * the token in the `x-csrf-token` header for mutating requests.
 */
export async function GET() {
    const token = generateCSRFToken();

    const response = NextResponse.json(
        {
            success: true,
            csrfToken: token,
        },
        { status: 200 },
    );

    return setCSRFCookie(response, token);
}
