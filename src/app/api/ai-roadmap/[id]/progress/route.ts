import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import type { NodeStatus } from "@/types/ai-roadmap";

interface RouteParams {
    params: Promise<{ id: string }>;
}

interface UpdateProgressRequest {
    node_id: string;
    status: NodeStatus;
    notes?: string;
}

const VALID_STATUSES = ["pending", "in_progress", "completed", "skipped"];

/**
 * Shared auth helper — returns userId or an error response.
 */
async function authenticateUser(): Promise<{ userId: string } | NextResponse> {
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

    return { userId: payload.userId as string };
}

/**
 * Shared upsert logic — used by both POST and PUT.
 */
async function upsertProgress(
    roadmapId: string,
    userId: string,
    body: UpdateProgressRequest,
) {
    const { node_id, status, notes } = body;

    if (!node_id || !status) {
        return NextResponse.json(
            { success: false, error: "node_id and status are required" },
            { status: 400 },
        );
    }

    if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
            {
                success: false,
                error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
            },
            { status: 400 },
        );
    }

    // Verify roadmap belongs to user
    const { data: roadmap, error: roadmapError } = await supabaseAdmin!
        .from("ai_generated_roadmaps")
        .select("id")
        .eq("id", roadmapId)
        .eq("user_id", userId)
        .single();

    if (roadmapError || !roadmap) {
        return NextResponse.json(
            { success: false, error: "Roadmap not found" },
            { status: 404 },
        );
    }

    // Upsert with correct unique constraint: (roadmap_id, user_id, node_id)
    const { data: result, error } = await supabaseAdmin!
        .from("ai_roadmap_node_progress")
        .upsert(
            {
                roadmap_id: roadmapId,
                user_id: userId,
                node_id,
                status,
                notes: notes || null,
                completed_at:
                    status === "completed" ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: "roadmap_id,user_id,node_id",
            },
        )
        .select()
        .single();

    if (error) {
        console.error("Update progress error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update progress" },
            { status: 500 },
        );
    }

    return NextResponse.json({ success: true, data: result });
}

/**
 * POST /api/ai-roadmap/[id]/progress — Upsert node progress.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: roadmapId } = await params;
        const auth = await authenticateUser();
        if (auth instanceof NextResponse) return auth;

        const body: UpdateProgressRequest = await request.json();
        return await upsertProgress(roadmapId, auth.userId, body);
    } catch (error) {
        console.error("Update progress error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 },
        );
    }
}

/**
 * PUT /api/ai-roadmap/[id]/progress — Alias for POST (backward compat).
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: roadmapId } = await params;
        const auth = await authenticateUser();
        if (auth instanceof NextResponse) return auth;

        const body: UpdateProgressRequest = await request.json();
        return await upsertProgress(roadmapId, auth.userId, body);
    } catch (error) {
        console.error("Update progress error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 },
        );
    }
}

/**
 * GET /api/ai-roadmap/[id]/progress — Fetch all progress for a roadmap.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: roadmapId } = await params;
        const auth = await authenticateUser();
        if (auth instanceof NextResponse) return auth;

        const { data: progress, error } = await supabaseAdmin!
            .from("ai_roadmap_node_progress")
            .select("node_id, status, completed_at, notes")
            .eq("roadmap_id", roadmapId)
            .eq("user_id", auth.userId);

        if (error) {
            console.error("Get progress error:", error);
            return NextResponse.json(
                { success: false, error: "Failed to fetch progress" },
                { status: 500 },
            );
        }

        const progressMap: Record<
            string,
            {
                status: string;
                completed_at: string | null;
                notes: string | null;
            }
        > = {};
        if (progress) {
            for (const p of progress) {
                progressMap[p.node_id] = {
                    status: p.status,
                    completed_at: p.completed_at,
                    notes: p.notes,
                };
            }
        }

        return NextResponse.json({ success: true, data: progressMap });
    } catch (error) {
        console.error("Get progress error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 },
        );
    }
}
