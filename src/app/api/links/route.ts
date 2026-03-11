import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/links — Create a short link
 * Body: { url: string, customCode?: string }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url, customCode } = body;

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

        // Insert
        const { data, error } = await supabaseAdmin
            .from("short_links")
            .insert({ code, original_url: url })
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
 * GET /api/links — List recent short links
 */
export async function GET() {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json(
                { success: false, message: "Database not configured" },
                { status: 500 },
            );
        }

        const { data, error } = await supabaseAdmin
            .from("short_links")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(20);

        if (error) {
            console.error("Failed to fetch links:", error);
            return NextResponse.json(
                { success: false, message: "Failed to fetch links" },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            data: data.map((row: any) => ({
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
