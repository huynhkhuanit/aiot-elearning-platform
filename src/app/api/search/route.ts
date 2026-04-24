import { NextRequest, NextResponse } from "next/server";
import { rpc } from "@/lib/db-helpers";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/search
 *
 * Unified full-text search across courses, blog posts, and Q&A.
 * Query params:
 *   - q: search query (required)
 *   - type: 'all' | 'courses' | 'blog' | 'questions' (default: 'all')
 *   - limit: number (default: 10, max: 30)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q")?.trim();
        const type = searchParams.get("type") || "all";
        const limit = Math.min(
            parseInt(searchParams.get("limit") || "10"),
            30,
        );

        if (!query || query.length < 2) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Từ khóa tìm kiếm phải có ít nhất 2 ký tự",
                },
                { status: 400 },
            );
        }

        if (!["all", "courses", "blog", "questions"].includes(type)) {
            return NextResponse.json(
                { success: false, message: "Invalid search type" },
                { status: 400 },
            );
        }

        // Try FTS first
        let results: any[] = [];
        try {
            results = await rpc<any[]>("search_all", {
                p_query: query,
                p_type: type,
                p_limit: limit,
            });
        } catch {
            // FTS function may not exist yet — fallback to ILIKE
            results = [];
        }

        // Fallback: if FTS returns no results, use ILIKE
        if ((!results || results.length === 0) && supabaseAdmin) {
            results = await fallbackSearch(query, type, limit);
        }

        return NextResponse.json(
            {
                success: true,
                data: {
                    query,
                    type,
                    results: (results || []).map((r: any) => ({
                        id: r.id,
                        title: r.title,
                        excerpt: r.excerpt,
                        slug: r.slug,
                        sourceType: r.source_type,
                        rank: r.rank,
                        thumbnailUrl: r.thumbnail_url,
                    })),
                    total: results?.length || 0,
                },
            },
            {
                headers: {
                    "Cache-Control":
                        "public, max-age=10, stale-while-revalidate=30",
                },
            },
        );
    } catch (error: any) {
        console.error("[search] Error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Lỗi tìm kiếm",
                error:
                    process.env.NODE_ENV === "development"
                        ? error.message
                        : undefined,
            },
            { status: 500 },
        );
    }
}

/**
 * ILIKE fallback when FTS is not available or returns no results.
 */
async function fallbackSearch(
    query: string,
    type: string,
    limit: number,
): Promise<any[]> {
    if (!supabaseAdmin) return [];

    const results: any[] = [];
    const pattern = `%${query}%`;

    if (type === "all" || type === "courses") {
        const { data } = await supabaseAdmin
            .from("courses")
            .select("id, title, short_description, slug, thumbnail_url")
            .eq("is_published", true)
            .or(`title.ilike.${pattern},short_description.ilike.${pattern}`)
            .limit(limit);

        (data || []).forEach((c: any) => {
            results.push({
                id: c.id,
                title: c.title,
                excerpt: c.short_description,
                slug: c.slug,
                source_type: "course",
                rank: 0.5,
                thumbnail_url: c.thumbnail_url,
            });
        });
    }

    if (type === "all" || type === "blog") {
        const { data } = await supabaseAdmin
            .from("blog_posts")
            .select("id, title, excerpt, slug, cover_image")
            .eq("status", "published")
            .or(`title.ilike.${pattern},excerpt.ilike.${pattern}`)
            .limit(limit);

        (data || []).forEach((b: any) => {
            results.push({
                id: b.id,
                title: b.title,
                excerpt: b.excerpt,
                slug: b.slug,
                source_type: "blog",
                rank: 0.4,
                thumbnail_url: b.cover_image,
            });
        });
    }

    if (type === "all" || type === "questions") {
        const { data } = await supabaseAdmin
            .from("questions")
            .select("id, title, content")
            .or(`title.ilike.${pattern},content.ilike.${pattern}`)
            .limit(limit);

        (data || []).forEach((q: any) => {
            results.push({
                id: q.id,
                title: q.title,
                excerpt: q.content?.substring(0, 200),
                slug: String(q.id),
                source_type: "question",
                rank: 0.3,
                thumbnail_url: null,
            });
        });
    }

    return results.sort((a, b) => b.rank - a.rank).slice(0, limit);
}
