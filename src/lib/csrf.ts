import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure CSRF token.
 */
export function generateCSRFToken(): string {
    return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Set CSRF token cookie on response.
 * Uses Double Submit Cookie pattern:
 * - Token stored in a non-httpOnly cookie (readable by JS)
 * - Client sends it back in a custom header
 * - Server compares cookie value with header value
 */
export function setCSRFCookie(
    response: NextResponse,
    token: string,
): NextResponse {
    response.cookies.set(CSRF_COOKIE_NAME, token, {
        httpOnly: false, // Client JS needs to read this
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
    });
    return response;
}

/**
 * Validate CSRF token from request.
 * Compares the cookie-stored token with the header-submitted token.
 *
 * Returns true if valid, false if mismatch or missing.
 */
export function validateCSRFToken(request: NextRequest): boolean {
    const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    const headerToken = request.headers.get(CSRF_HEADER_NAME);

    if (!cookieToken || !headerToken) {
        return false;
    }

    // Constant-time comparison to prevent timing attacks
    if (cookieToken.length !== headerToken.length) {
        return false;
    }

    try {
        return crypto.timingSafeEqual(
            Buffer.from(cookieToken),
            Buffer.from(headerToken),
        );
    } catch {
        return false;
    }
}

/**
 * HTTP methods that mutate state and require CSRF validation.
 */
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Check if a request method requires CSRF validation.
 */
export function requiresCSRFCheck(method: string): boolean {
    return MUTATING_METHODS.has(method.toUpperCase());
}

/**
 * API routes exempt from CSRF (e.g. auth endpoints that issue tokens).
 */
const CSRF_EXEMPT_ROUTES = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/csrf",
    "/api/auth/logout",
];

/**
 * Check if a route is exempt from CSRF validation.
 */
export function isCSRFExempt(pathname: string): boolean {
    return CSRF_EXEMPT_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(route + "/"),
    );
}
