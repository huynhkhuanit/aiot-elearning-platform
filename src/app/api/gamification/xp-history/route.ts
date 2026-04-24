import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import type { AuthenticatedContext } from "@/lib/api-middleware";
import { RATE_LIMITS } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/gamification/xp-history
 *
 * Returns user's XP event history (paginated).
 * Query params:
 *   - page: number (default: 1)
 *   - limit: number (default: 20, max: 50)
 *   - type: event type filter (optional)
 */
export const GET = withAuth(
    async (request: NextRequest, { user }: AuthenticatedContext) => {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = Math.min(
            parseInt(searchParams.get("limit") || "20"),
            50,
        );
        const offset = (page - 1) * limit;
        const eventType = searchParams.get("type");

        if (!supabaseAdmin) {
            return NextResponse.json(
                { success: false, message: "Database not available" },
                { status: 503 },
            );
        }

        let query = supabaseAdmin
            .from("xp_events")
            .select("*", { count: "exact" })
            .eq("user_id", user.userId)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (eventType) {
            query = query.eq("event_type", eventType);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error("[xp-history] Query error:", error);
            return NextResponse.json(
                { success: false, message: "Không thể tải lịch sử XP" },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                events: (data || []).map((event: any) => ({
                    id: event.id,
                    eventType: event.event_type,
                    xpAmount: event.xp_amount,
                    sourceId: event.source_id,
                    sourceType: event.source_type,
                    metadata: event.metadata,
                    createdAt: event.created_at,
                })),
                pagination: {
                    total: count || 0,
                    page,
                    limit,
                    totalPages: Math.ceil((count || 0) / limit),
                },
            },
        });
    },
    { rateLimit: RATE_LIMITS.general },
);
