import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware để bảo vệ các routes cần xác thực
 * - Kiểm tra auth_token từ cookies hoặc Authorization header
 * - Cho phép unauthenticated users đến /auth/login, /auth/register, /, /courses, etc
 * - Chuyển hướng unauthenticated users khỏi protected routes như /learn
 * - Hỗ trợ CORS cho mobile app (React Native)
 */

// CORS headers cho mobile app
function setCorsHeaders(response: NextResponse, request: NextRequest) {
    const origin = request.headers.get("origin") || "*";
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    );
    response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Cookie",
    );
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Max-Age", "86400");
    return response;
}

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Handle CORS preflight requests (OPTIONS) for API routes
    if (request.method === "OPTIONS" && pathname.startsWith("/api")) {
        const preflightResponse = new NextResponse(null, { status: 204 });
        return setCorsHeaders(preflightResponse, request);
    }

    // Danh sách các public routes (không cần xác thực)
    const publicRoutes = [
        "/",
        "/auth/login",
        "/auth/register",
        "/courses",
        "/roadmap",
        "/articles",
        "/qa",
    ];

    // Kiểm tra nếu đây là public route (bao gồm /api/auth/*)
    const isPublicRoute = publicRoutes.some(
        (route) =>
            pathname === route ||
            pathname.startsWith("/api/public") ||
            pathname.startsWith("/api/auth"),
    );

    // ✅ Allow /api/auth/me để check authentication status
    const isAuthCheckEndpoint = pathname === "/api/auth/me";

    // ✅ Allow /api/courses endpoints (authentication sẽ được handle ở route handler)
    const isCoursesApiEndpoint = pathname.startsWith("/api/courses");

    // Danh sách các protected routes (cần xác thực)
    // ⚠️ NOTE: /api/courses routes sẽ tự handle auth tại route handler
    // Middleware chỉ protect page routes (/learn, /admin) và API routes khác (/api/lessons, /api/users/me)
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
        const response = NextResponse.next();
        // Add CORS headers for API routes
        if (pathname.startsWith("/api")) {
            return setCorsHeaders(response, request);
        }
        return response;
    }

    // Nếu là protected route, kiểm tra xác thực
    if (isProtectedRoute) {
        // Check token from cookie OR Authorization header (for mobile app)
        const cookieToken = request.cookies.get("auth_token")?.value;
        const authHeader = request.headers.get("Authorization");
        const headerToken = authHeader?.startsWith("Bearer ")
            ? authHeader.substring(7)
            : null;
        const token = cookieToken || headerToken;

        // Nếu không có token, chuyển hướng đến login
        if (!token) {
            // Nếu là API request, return 401
            if (pathname.startsWith("/api")) {
                const errorResponse = new NextResponse(
                    JSON.stringify({ success: false, message: "Unauthorized" }),
                    {
                        status: 401,
                        headers: { "content-type": "application/json" },
                    },
                );
                return setCorsHeaders(errorResponse, request);
            }

            // Nếu là page request, chuyển hướng đến login
            return NextResponse.redirect(new URL("/auth/login", request.url));
        }
    }

    const response = NextResponse.next();
    // Add CORS headers for API routes
    if (pathname.startsWith("/api")) {
        return setCorsHeaders(response, request);
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
