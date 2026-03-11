import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/links/[code] — Redirect to the original URL
 * Increments click counter and returns 307 redirect.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ code: string }> },
) {
    try {
        const { code } = await params;

        if (!supabaseAdmin) {
            return NextResponse.json(
                { success: false, message: "Database not configured" },
                { status: 500 },
            );
        }

        // Lookup the short link
        const { data: link, error } = await supabaseAdmin
            .from("short_links")
            .select("*")
            .eq("code", code)
            .maybeSingle();

        if (error) {
            console.error("Failed to lookup short link:", error);
            return NextResponse.json(
                { success: false, message: "Internal server error" },
                { status: 500 },
            );
        }

        if (!link) {
            return NextResponse.json(
                { success: false, message: "Short link not found" },
                { status: 404 },
            );
        }

        // Check expiration
        if (link.expires_at && new Date(link.expires_at) < new Date()) {
            return NextResponse.json(
                { success: false, message: "This link has expired" },
                { status: 410 },
            );
        }

        // Increment clicks (fire-and-forget)
        supabaseAdmin
            .from("short_links")
            .update({ clicks: (link.clicks || 0) + 1 })
            .eq("id", link.id)
            .then();

        // 307 Temporary Redirect
        return NextResponse.redirect(link.original_url, 307);
    } catch (error) {
        console.error("Error in GET /api/links/[code]:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}
