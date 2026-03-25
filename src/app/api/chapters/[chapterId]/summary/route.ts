import { NextRequest, NextResponse } from "next/server";
import { db as supabaseAdmin } from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ chapterId: string }> },
) {
    try {
        const { chapterId } = await params;

        const { data, error } = await supabaseAdmin!
            .from("chapter_summaries")
            .select("id, content, created_at, updated_at")
            .eq("chapter_id", chapterId)
            .single();

        if (error || !data) {
            return NextResponse.json({
                success: true,
                data: null,
            });
        }

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("Error fetching chapter summary:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 },
        );
    }
}
