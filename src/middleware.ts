import { NextRequest, NextResponse } from "next/server";
import { getCanonicalProfilePath, normalizeUsername } from "@/lib/profile-url";
import {
    generateCSRFToken,
    setCSRFCookie,
    validateCSRFToken,
    requiresCSRFCheck,
    isCSRFExempt,
} from "@/lib/csrf";

/**
 * Middleware để bảo vệ các routes cần xác thực
 * - Kiểm tra auth_token từ cookies hoặc Authorization header
 * - Cho phép unauthenticated users đến /auth/login, /auth/register, /, /courses, etc
 * - Chuyển hướng unauthenticated users khỏi protected routes như /learn
 * - Hỗ trợ CORS cho mobile app (React Native)
 * - Security headers cho mọi response
 * - CSRF protection cho mutating requests
 */

// ─── CORS whitelist ───
const ALLOWED_ORIGINS = [
    "https://dhvlearnx.page",
    "https://www.dhvlearnx.page",
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.NEXT_PUBLIC_MOBILE_APP_ORIGIN,
].filter(Boolean) as string[];

function isAllowedOrigin(origin: string | null): boolean {
    if (!origin) return false;
    // In development, allow all origins
    if (process.env.NODE_ENV === "development") return true;
    return ALLOWED_ORIGINS.includes(origin);
}

// ─── Security Headers ───
function getPermissionsPolicy(pathname: string) {
    if (pathname.startsWith("/tools/face-touch-alert")) {
        return "camera=(self), microphone=(), geolocation=()";
    }

    return "camera=(), microphone=(), geolocation=()";
}

function setSecurityHeaders(
    response: NextResponse,
    pathname: string,
): NextResponse {
    // Chống clickjacking
    response.headers.set("X-Frame-Options", "DENY");
    // Chống MIME sniffing
    response.headers.set("X-Content-Type-Options", "nosniff");
    // XSS filter (legacy browsers)
    response.headers.set("X-XSS-Protection", "1; mode=block");
    // HTTPS enforcement (1 year)
    response.headers.set(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains",
    );
    // Referrer control
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    // Permissions Policy
    response.headers.set(
        "Permissions-Policy",
        getPermissionsPolicy(pathname),
    );
    // Content Security Policy
    response.headers.set(
        "Content-Security-Policy",
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://i.ytimg.com https://cdn2.fptshop.com.vn https://caodangvietmyhanoi.edu.vn",
            "connect-src 'self' https://*.supabase.co https://api.cloudinary.com wss://*.supabase.co",
            "frame-src 'self' https://www.youtube.com https://youtube.com",
            "media-src 'self' https://res.cloudinary.com blob:",
            "worker-src 'self' blob:",
        ].join("; "),
    );
    return response;
}

// ─── CORS headers ───
function setCorsHeaders(response: NextResponse, request: NextRequest) {
    const origin = request.headers.get("origin");

    if (origin && isAllowedOrigin(origin)) {
        response.headers.set("Access-Control-Allow-Origin", origin);
    }
    // If origin is not allowed, omit the header — browser will block the request

    response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    );
    response.headers.set(
        "Access-Control-Allow-Headers",
        [
            "Content-Type",
            "Authorization",
            "Cookie",
            "X-CSRF-Token",
            "X-Client-Platform",
            "X-Mobile-Client",
        ].join(", "),
    );
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Max-Age", "86400");
    return response;
}

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // ─── Profile routing redirects ───
    const directProfileRouteMatch = pathname.match(/^\/profile\/([^/]+)$/);
    if (directProfileRouteMatch) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = getCanonicalProfilePath(
            directProfileRouteMatch[1],
        );
        const response = NextResponse.redirect(redirectUrl);
        return setSecurityHeaders(response, redirectUrl.pathname);
    }

    const publicProfileRouteMatch = pathname.match(/^\/@@?([^/]+)$/);
    if (publicProfileRouteMatch) {
        const normalizedUsername = normalizeUsername(
            publicProfileRouteMatch[1],
        );

        if (!normalizedUsername) {
            const response = NextResponse.next();
            return setSecurityHeaders(response, pathname);
        }

        const canonicalPath = getCanonicalProfilePath(normalizedUsername);
        if (pathname !== canonicalPath) {
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = canonicalPath;
            const response = NextResponse.redirect(redirectUrl);
            return setSecurityHeaders(response, redirectUrl.pathname);
        }

        const response = NextResponse.next();
        return setSecurityHeaders(response, pathname);
    }

    // ─── CORS preflight (OPTIONS) ───
    if (request.method === "OPTIONS" && pathname.startsWith("/api")) {
        const preflightResponse = new NextResponse(null, { status: 204 });
        setCorsHeaders(preflightResponse, request);
        return setSecurityHeaders(preflightResponse, pathname);
    }

    // ─── Public routes (no auth required) ───
    const publicRoutes = [
        "/",
        "/auth/login",
        "/auth/register",
        "/courses",
        "/roadmap",
        "/articles",
        "/qa",
    ];

    const isPublicRoute = publicRoutes.some(
        (route) =>
            pathname === route ||
            pathname.startsWith(route + "/") ||
            pathname.startsWith("/api/public") ||
            pathname.startsWith("/api/auth"),
    );

    const isAuthCheckEndpoint = pathname === "/api/auth/me";
    const isCoursesApiEndpoint = pathname.startsWith("/api/courses");

    // ─── Protected routes (auth required) ───
    const protectedRoutes = [
        "/learn",
        "/admin",
        "/settings",
        "/api/lessons",
        "/api/chapters",
        "/api/users/me",
    ];

    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route),
    );

    // ✅ Allow public routes, auth check endpoint, and courses API
    if (
        (isPublicRoute || isAuthCheckEndpoint || isCoursesApiEndpoint) &&
        !isProtectedRoute
    ) {
        let response = NextResponse.next();
        setSecurityHeaders(response, pathname);

        // Add CORS headers for API routes
        if (pathname.startsWith("/api")) {
            setCorsHeaders(response, request);
        }

        // Set CSRF cookie if not present (for page requests)
        if (!pathname.startsWith("/api")) {
            const existingCSRF = request.cookies.get("csrf_token")?.value;
            if (!existingCSRF) {
                response = setCSRFCookie(response, generateCSRFToken());
            }
        }

        return response;
    }

    // ─── Protected route: verify authentication ───
    if (isProtectedRoute) {
        const cookieToken = request.cookies.get("auth_token")?.value;
        const authHeader = request.headers.get("Authorization");
        const headerToken = authHeader?.startsWith("Bearer ")
            ? authHeader.substring(7)
            : null;
        const token = cookieToken || headerToken;

        if (!token) {
            if (pathname.startsWith("/api")) {
                const errorResponse = new NextResponse(
                    JSON.stringify({
                        success: false,
                        message: "Unauthorized",
                    }),
                    {
                        status: 401,
                        headers: { "content-type": "application/json" },
                    },
                );
                setCorsHeaders(errorResponse, request);
                return setSecurityHeaders(errorResponse, pathname);
            }

            const response = NextResponse.redirect(
                new URL("/auth/login", request.url),
            );
            return setSecurityHeaders(response, pathname);
        }
    }

    // ─── CSRF validation for mutating API requests ───
    if (
        pathname.startsWith("/api") &&
        requiresCSRFCheck(request.method) &&
        !isCSRFExempt(pathname)
    ) {
        // Only enforce CSRF for requests from web browsers (have origin/cookie)
        const origin = request.headers.get("origin");
        const hasCookie = request.cookies.get("auth_token")?.value;
        const isWebRequest = origin || hasCookie;
        const isMobileRequest = request.headers
            .get("Authorization")
            ?.startsWith("Bearer ");

        // Skip CSRF for mobile/API clients using Bearer auth (no cookies)
        if (isWebRequest && !isMobileRequest) {
            if (!validateCSRFToken(request)) {
                const csrfError = new NextResponse(
                    JSON.stringify({
                        success: false,
                        message:
                            "CSRF token không hợp lệ. Vui lòng tải lại trang.",
                    }),
                    {
                        status: 403,
                        headers: { "content-type": "application/json" },
                    },
                );
                setCorsHeaders(csrfError, request);
                return setSecurityHeaders(csrfError, pathname);
            }
        }
    }

    // ─── Default: allow with security headers ───
    let response = NextResponse.next();
    setSecurityHeaders(response, pathname);

    if (pathname.startsWith("/api")) {
        setCorsHeaders(response, request);
    }

    // Ensure CSRF cookie exists for page requests
    if (!pathname.startsWith("/api")) {
        const existingCSRF = request.cookies.get("csrf_token")?.value;
        if (!existingCSRF) {
            response = setCSRFCookie(response, generateCSRFToken());
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!_next/static|_next/image|favicon.ico|assets).*)",
    ],
};
