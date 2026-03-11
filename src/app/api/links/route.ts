import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";

/* ── Helper: resolve creator identity from request ──────── */
interface CreatorIdentity {
    creatorId: string;
    creatorType: "anonymous" | "user";
}

function resolveCreator(
    request: NextRequest,
    bodyAnonymousId?: string,
): CreatorIdentity | null {
    // Priority 1: Authenticated user (auth_token cookie or Authorization header)
    const cookieToken = request.cookies.get("auth_token")?.value;
    const headerToken = extractTokenFromHeader(
        request.headers.get("Authorization"),
    );
    const token = cookieToken || headerToken;

    if (token) {
        const payload = verifyToken(token);
        if (payload?.userId) {
            return { creatorId: payload.userId, creatorType: "user" };
        }
    }

    // Priority 2: Anonymous ID from request body/query
    if (bodyAnonymousId && typeof bodyAnonymousId === "string") {
        return { creatorId: bodyAnonymousId, creatorType: "anonymous" };
    }

    return null;
}

/**
 * POST /api/links — Create a short link
 * Body: { url: string, customCode?: string, anonymousId?: string }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url, customCode, anonymousId } = body;

        if (!url || typeof url !== "string") {
            return NextResponse.json(
                { success: false, message: "URL is required" },
                { status: 400 },
            );
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch {
            return NextResponse.json(
                { success: false, message: "Invalid URL format" },
                { status: 400 },
            );
        }

        if (!supabaseAdmin) {
            return NextResponse.json(
                { success: false, message: "Database not configured" },
                { status: 500 },
            );
        }

        // Resolve creator identity
        const creator = resolveCreator(request, anonymousId);
        if (!creator) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Creator identity required (login or provide anonymousId)",
                },
                { status: 400 },
            );
        }

        // Generate or validate code
        const code = customCode?.trim() || nanoid(6);

        if (code.length < 3 || code.length > 32) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Custom code must be 3-32 characters",
                },
                { status: 400 },
            );
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Custom code can only contain letters, numbers, hyphens and underscores",
                },
                { status: 400 },
            );
        }

        // Check for duplicate code
        const { data: existing } = await supabaseAdmin
            .from("short_links")
            .select("id")
            .eq("code", code)
            .maybeSingle();

        if (existing) {
            return NextResponse.json(
                { success: false, message: "This code is already taken" },
                { status: 409 },
            );
        }

        // Insert with creator info
        const { data, error } = await supabaseAdmin
            .from("short_links")
            .insert({
                code,
                original_url: url,
                creator_id: creator.creatorId,
                creator_type: creator.creatorType,
            })
            .select()
            .single();

        if (error) {
            console.error("Failed to create short link:", error);
            return NextResponse.json(
                { success: false, message: "Failed to create short link" },
                { status: 500 },
            );
        }

        const origin = request.nextUrl.origin;
        return NextResponse.json({
            success: true,
            data: {
                id: data.id,
                code: data.code,
                originalUrl: data.original_url,
                shortUrl: `${origin}/api/links/${data.code}`,
                clicks: data.clicks,
                createdAt: data.created_at,
            },
        });
    } catch (error) {
        console.error("Error in POST /api/links:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}

/**
 * GET /api/links — List short links belonging to the caller
 * Query: ?anonymousId=<uuid> (for guests)
 * Auth users are identified automatically via auth_token
 */
export async function GET(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json(
                { success: false, message: "Database not configured" },
                { status: 500 },
            );
        }

        const anonymousId =
            request.nextUrl.searchParams.get("anonymousId") || undefined;
        const creator = resolveCreator(request, anonymousId);

        // If no identity at all, return empty list (never leak others' links)
        if (!creator) {
            return NextResponse.json({ success: true, data: [] });
        }

        const { data, error } = await supabaseAdmin
            .from("short_links")
            .select("*")
            .eq("creator_id", creator.creatorId)
            .order("created_at", { ascending: false })
            .limit(30);

        if (error) {
            console.error("Failed to fetch links:", error);
            return NextResponse.json(
                { success: false, message: "Failed to fetch links" },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            data: (data || []).map((row: any) => ({
                id: row.id,
                code: row.code,
                originalUrl: row.original_url,
                clicks: row.clicks,
                createdAt: row.created_at,
            })),
        });
    } catch (error) {
        console.error("Error in GET /api/links:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}

/**
 * PATCH /api/links — Claim anonymous links when user logs in
 * Body: { anonymousId: string }
 * Requires auth_token
 */
export async function PATCH(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json(
                { success: false, message: "Database not configured" },
                { status: 500 },
            );
        }

        // Must be authenticated
        const cookieToken = request.cookies.get("auth_token")?.value;
        const headerToken = extractTokenFromHeader(
            request.headers.get("Authorization"),
        );
        const token = cookieToken || headerToken;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Authentication required" },
                { status: 401 },
            );
        }

        const payload = verifyToken(token);
        if (!payload?.userId) {
            return NextResponse.json(
                { success: false, message: "Invalid token" },
                { status: 401 },
            );
        }

        const body = await request.json();
        const { anonymousId } = body;

        if (!anonymousId || typeof anonymousId !== "string") {
            return NextResponse.json(
                { success: false, message: "anonymousId is required" },
                { status: 400 },
            );
        }

        // Transfer anonymous links to authenticated user
        const { data, error } = await supabaseAdmin
            .from("short_links")
            .update({
                creator_id: payload.userId,
                creator_type: "user",
            })
            .eq("creator_id", anonymousId)
            .eq("creator_type", "anonymous")
            .select("id");

        if (error) {
            console.error("Failed to claim links:", error);
            return NextResponse.json(
                { success: false, message: "Failed to claim links" },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            message: `Claimed ${data?.length || 0} links`,
            claimedCount: data?.length || 0,
        });
    } catch (error) {
        console.error("Error in PATCH /api/links:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}
