import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";
import { checkRateLimit, getClientIP, type RateLimitResult } from "@/lib/rateLimit";
import type { AuthPayload } from "@/types/auth";
import type { AppRole } from "@/types/profile";
import { supabaseAdmin } from "@/lib/supabase";
import { validateCSRFToken, requiresCSRFCheck, isCSRFExempt } from "@/lib/csrf";

export interface AuthenticatedContext {
    user: AuthPayload;
    roles: AppRole[];
    request: NextRequest;
}

type AuthenticatedHandler = (
    request: NextRequest,
    context: AuthenticatedContext,
    routeContext?: unknown,
) => Promise<NextResponse>;

interface WithAuthOptions {
    /** Require specific roles. If empty/undefined, any authenticated user is allowed. */
    roles?: AppRole[];
    /** Rate limit configuration. If provided, rate limiting is enforced. */
    rateLimit?: { maxAttempts: number; windowMs: number };
    /** Custom rate limit key prefix. Defaults to pathname. */
    rateLimitKeyPrefix?: string;
    /** Skip CSRF check for this route. Defaults to false. */
    skipCSRF?: boolean;
}

/**
 * Higher-Order Function (HOF) wrapping API route handlers with:
 * 1. Rate limiting (optional)
 * 2. CSRF validation (for mutating methods)
 * 3. JWT authentication & verification
 * 4. Role-based authorization
 *
 * @example
 * ```ts
 * export const POST = withAuth(
 *     async (request, { user, roles }) => {
 *         // user is verified, roles are loaded
 *         return NextResponse.json({ success: true });
 *     },
 *     { roles: ["admin"], rateLimit: RATE_LIMITS.general }
 * );
 * ```
 */
export function withAuth(
    handler: AuthenticatedHandler,
    options: WithAuthOptions = {},
) {
    return async (request: NextRequest, routeContext?: unknown): Promise<NextResponse> => {
        try {
            // 1. Rate limiting
            if (options.rateLimit) {
                const clientIP = getClientIP(request);
                const prefix = options.rateLimitKeyPrefix || request.nextUrl.pathname;
                const rateCheck: RateLimitResult = checkRateLimit(
                    `${prefix}:${clientIP}`,
                    options.rateLimit,
                );

                if (!rateCheck.allowed) {
                    const retryAfterSec = Math.ceil(rateCheck.resetInMs / 1000);
                    return NextResponse.json(
                        {
                            success: false,
                            message: `Quá nhiều yêu cầu. Vui lòng đợi ${retryAfterSec} giây.`,
                        },
                        {
                            status: 429,
                            headers: { "Retry-After": String(retryAfterSec) },
                        },
                    );
                }
            }

            // 2. CSRF validation (for mutating methods)
            if (
                !options.skipCSRF &&
                requiresCSRFCheck(request.method) &&
                !isCSRFExempt(request.nextUrl.pathname)
            ) {
                if (!validateCSRFToken(request)) {
                    return NextResponse.json(
                        {
                            success: false,
                            message: "CSRF token không hợp lệ. Vui lòng tải lại trang.",
                        },
                        { status: 403 },
                    );
                }
            }

            // 3. JWT authentication
            const cookieToken = request.cookies.get("auth_token")?.value;
            const headerToken = extractTokenFromHeader(
                request.headers.get("Authorization"),
            );
            const token = cookieToken || headerToken;

            if (!token) {
                return NextResponse.json(
                    { success: false, message: "Chưa đăng nhập" },
                    { status: 401 },
                );
            }

            const payload = verifyToken(token);
            if (!payload) {
                return NextResponse.json(
                    { success: false, message: "Phiên đăng nhập hết hạn hoặc không hợp lệ" },
                    { status: 401 },
                );
            }

            // 4. Load user roles from database
            let roles: AppRole[] = ["student"];
            if (supabaseAdmin) {
                const { data: roleRecords } = await supabaseAdmin
                    .from("user_roles")
                    .select("role")
                    .eq("user_id", payload.userId)
                    .is("revoked_at", null);

                if (roleRecords && roleRecords.length > 0) {
                    roles = roleRecords.map(
                        (r: { role: string }) => r.role as AppRole,
                    );
                }
            }

            // 5. Role authorization check
            if (options.roles && options.roles.length > 0) {
                const hasRequiredRole = options.roles.some((requiredRole) =>
                    roles.includes(requiredRole),
                );
                if (!hasRequiredRole) {
                    return NextResponse.json(
                        {
                            success: false,
                            message: "Bạn không có quyền truy cập tài nguyên này",
                        },
                        { status: 403 },
                    );
                }
            }

            // 6. Execute handler with authenticated context
            return await handler(request, { user: payload, roles, request }, routeContext);
        } catch (error) {
            console.error("[withAuth] Unexpected error:", error);
            return NextResponse.json(
                {
                    success: false,
                    message: "Đã xảy ra lỗi máy chủ",
                },
                { status: 500 },
            );
        }
    };
}

/**
 * Lightweight variant — validates auth but does not enforce roles.
 * Use for endpoints where authentication is optional but adds features.
 */
export function withOptionalAuth(
    handler: (
        request: NextRequest,
        context: { user: AuthPayload | null; request: NextRequest },
        routeContext?: unknown,
    ) => Promise<NextResponse>,
) {
    return async (request: NextRequest, routeContext?: unknown): Promise<NextResponse> => {
        const cookieToken = request.cookies.get("auth_token")?.value;
        const headerToken = extractTokenFromHeader(
            request.headers.get("Authorization"),
        );
        const token = cookieToken || headerToken;

        let user: AuthPayload | null = null;
        if (token) {
            user = verifyToken(token);
        }

        return handler(request, { user, request }, routeContext);
    };
}
