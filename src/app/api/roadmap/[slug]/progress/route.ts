import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

interface RouteParams {
    params: Promise<{ slug: string }>;
}

// Valid predefined roadmap slugs
const VALID_SLUGS = ["frontend", "backend", "fullstack", "mobile", "devops"];

/**
 * GET /api/roadmap/[slug]/progress
 * Returns all node progress for the current user on a predefined roadmap.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params;

        if (!VALID_SLUGS.includes(slug)) {
            return NextResponse.json(
                { success: false, error: "Invalid roadmap slug" },
                { status: 400 },
            );
        }

        // Authenticate
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        if (!token) {
            // Not logged in → return empty progress (roadmap still viewable)
            return NextResponse.json({ success: true, data: {} });
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ success: true, data: {} });
        }

        const userId = payload.userId;

        const { data: progress, error } = await supabaseAdmin!
            .from("roadmap_node_progress")
            .select("node_id, status")
            .eq("user_id", userId)
            .eq("roadmap_slug", slug);

        if (error) {
            console.error("Get roadmap progress error:", error);
            return NextResponse.json(
                { success: false, error: "Failed to fetch progress" },
                { status: 500 },
            );
        }

        // Convert to map: { node_id: status }
        const progressMap: Record<string, string> = {};
        if (progress) {
            for (const p of progress) {
                progressMap[p.node_id] = p.status;
            }
        }

        return NextResponse.json({ success: true, data: progressMap });
    } catch (error) {
        console.error("Get roadmap progress error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 },
        );
    }
}

/**
 * POST /api/roadmap/[slug]/progress
 * Upsert a single node's progress status.
 * Body: { node_id: string, status: string }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params;

        if (!VALID_SLUGS.includes(slug)) {
            return NextResponse.json(
                { success: false, error: "Invalid roadmap slug" },
                { status: 400 },
            );
        }

        // Authenticate (required for writes)
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 },
            );
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 },
            );
        }

        const userId = payload.userId;

        const body = await request.json();
        const { node_id, status } = body;

        if (!node_id || !status) {
            return NextResponse.json(
                { success: false, error: "node_id and status are required" },
                { status: 400 },
            );
        }

        const validStatuses = [
            "pending",
            "in_progress",
            "completed",
            "skipped",
        ];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
                },
                { status: 400 },
            );
        }

        // Upsert progress
        const { data: result, error } = await supabaseAdmin!
            .from("roadmap_node_progress")
            .upsert(
                {
                    user_id: userId,
                    roadmap_slug: slug,
                    node_id,
                    status,
                    completed_at:
                        status === "completed"
                            ? new Date().toISOString()
                            : null,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "user_id,roadmap_slug,node_id",
                },
            )
            .select()
            .single();

        if (error) {
            console.error("Update roadmap progress error:", error);
            return NextResponse.json(
                { success: false, error: "Failed to update progress" },
                { status: 500 },
            );
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("Update roadmap progress error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 },
        );
    }
}
