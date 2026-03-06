import { NextRequest, NextResponse } from "next/server";
import { rpc, queryBuilder, insert, queryOneBuilder } from "@/lib/db";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function generateExcerpt(html: string, maxLength: number = 200): string {
    const cleaned = html
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    return cleaned.length > maxLength
        ? cleaned.substring(0, maxLength) + "..."
        : cleaned;
}

// GET - Fetch blog posts with filters and pagination
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const status = searchParams.get("status") || "published"; // Default to published
        const categoryId = searchParams.get("categoryId");
        const tag = searchParams.get("tag");
        const search = searchParams.get("search");
        const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50); // Max 50
        const offset = parseInt(searchParams.get("offset") || "0");

        // Try RPC function first, fallback to direct query if it fails
        let results: any[] = [];
        let total: number = 0;

        try {
            // Use RPC function for complex query
            results =
                (await rpc<any[]>("get_blog_posts_with_details", {
                    p_user_id: userId || null,
                    p_status: status,
                    p_category_id: categoryId ? parseInt(categoryId) : null,
                    p_tag_slug: tag || null,
                    p_search: search || null,
                    p_limit: limit,
                    p_offset: offset,
                })) || [];

            // Get total count
            total =
                (await rpc<number>("count_blog_posts", {
                    p_user_id: userId || null,
                    p_status: status,
                    p_category_id: categoryId ? parseInt(categoryId) : null,
                    p_tag_slug: tag || null,
                    p_search: search || null,
                })) || 0;
        } catch (rpcError: any) {
            console.error(
                "RPC function error, falling back to direct query:",
                rpcError,
            );

            // Fallback: Query directly from Supabase
            const { db: supabaseAdmin } = await import("@/lib/db");

            // If filtering by category, first get post IDs for that category
            let postIdsForCategory: number[] = [];
            if (categoryId) {
                const { data: postCategoriesFilter } = await supabaseAdmin!
                    .from("blog_post_categories")
                    .select("post_id")
                    .eq("category_id", parseInt(categoryId));

                if (postCategoriesFilter && postCategoriesFilter.length > 0) {
                    postIdsForCategory = postCategoriesFilter.map(
                        (pc: any) => pc.post_id,
                    );
                } else {
                    // No posts in this category, return empty results
                    return NextResponse.json({
                        success: true,
                        data: {
                            posts: [],
                            pagination: {
                                total: 0,
                                limit,
                                offset,
                                hasMore: false,
                            },
                        },
                    });
                }
            }

            let query = supabaseAdmin!
                .from("blog_posts")
                .select(
                    `
          id,
          title,
          slug,
          excerpt,
          content,
          cover_image,
          status,
          view_count,
          published_at,
          created_at,
          updated_at,
          user_id,
          users!inner(id, username, full_name, avatar_url, membership_type)
        `,
                )
                .eq("status", status)
                .order("created_at", { ascending: false })
                .range(offset, offset + limit - 1);

            if (userId) {
                query = query.eq("user_id", userId);
            }

            if (categoryId && postIdsForCategory.length > 0) {
                query = query.in("id", postIdsForCategory);
            }

            if (search) {
                query = query.or(
                    `title.ilike.%${search}%,excerpt.ilike.%${search}%`,
                );
            }

            const { data: posts, error: postsError } = await query;

            if (postsError) {
                throw postsError;
            }

            // Get categories and tags for posts
            const postIds = (posts || []).map((p: any) => p.id);

            // Get categories
            const { data: postCategories } =
                postIds.length > 0
                    ? await supabaseAdmin!
                          .from("blog_post_categories")
                          .select("post_id, category_id")
                          .in("post_id", postIds)
                    : { data: [] };

            const categoryIds = postCategories
                ? [...new Set(postCategories.map((pc: any) => pc.category_id))]
                : [];
            const { data: categories } =
                categoryIds.length > 0
                    ? await supabaseAdmin!
                          .from("blog_categories")
                          .select("id, name, slug")
                          .in("id", categoryIds)
                    : { data: [] };

            const categoryMap = new Map<number, any>();
            const postCategoryMap = new Map<number, any[]>();

            if (categories) {
                categories.forEach((cat: any) => categoryMap.set(cat.id, cat));
            }

            if (postCategories) {
                postCategories.forEach((pc: any) => {
                    const cat = categoryMap.get(pc.category_id);
                    if (cat) {
                        if (!postCategoryMap.has(pc.post_id)) {
                            postCategoryMap.set(pc.post_id, []);
                        }
                        postCategoryMap.get(pc.post_id)!.push(cat);
                    }
                });
            }

            // Format results similar to RPC function output
            results = (posts || []).map((post: any) => ({
                id: post.id,
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt,
                cover_image: post.cover_image,
                username: post.users?.username || "",
                full_name: post.users?.full_name || "",
                avatar_url: post.users?.avatar_url || null,
                membership_type: post.users?.membership_type || null,
                published_at: post.published_at,
                view_count: post.view_count || 0,
                like_count: 0, // TODO: Get from blog_post_likes
                comment_count: 0, // TODO: Get from blog_comments
                bookmark_count: 0, // TODO: Get from blog_bookmarks
                category_names:
                    postCategoryMap
                        .get(post.id)
                        ?.map((c: any) => c.name)
                        .join(", ") || null,
                tag_names: null, // TODO: Get tags
            }));

            // Get count
            let countQuery = supabaseAdmin!
                .from("blog_posts")
                .select("id", { count: "exact", head: true })
                .eq("status", status);

            if (userId) {
                countQuery = countQuery.eq("user_id", userId);
            }

            if (categoryId && postIdsForCategory.length > 0) {
                countQuery = countQuery.in("id", postIdsForCategory);
            }

            if (search) {
                countQuery = countQuery.or(
                    `title.ilike.%${search}%,excerpt.ilike.%${search}%`,
                );
            }

            const { count } = await countQuery;
            total = count || 0;
        }

        return NextResponse.json({
            success: true,
            data: {
                posts: results || [],
                pagination: {
                    total: total || 0,
                    limit,
                    offset,
                    hasMore: offset + limit < (total || 0),
                },
            },
        });
    } catch (error: any) {
        console.error("Get blog posts error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Không thể lấy danh sách bài viết",
                error:
                    process.env.NODE_ENV === "development"
                        ? error.message
                        : undefined,
            },
            { status: 500 },
        );
    }
}

// POST - Create new blog post
export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token");

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 },
            );
        }

        const decoded = jwt.verify(
            token.value,
            process.env.JWT_SECRET || "",
        ) as { userId: string };
        const body = await request.json();
        const {
            title,
            content,
            coverImage,
            categories,
            tags,
            status: postStatus,
        } = body;

        if (!title || !content) {
            return NextResponse.json(
                { success: false, message: "Title and content are required" },
                { status: 400 },
            );
        }

        // Generate unique slug
        let slug = generateSlug(title);
        let slugExists = true;
        let slugSuffix = 1;

        // Check for unique slug
        while (slugExists) {
            const existing = await queryOneBuilder<{ id: number }>(
                "blog_posts",
                {
                    select: "id",
                    filters: { slug },
                },
            );
            if (!existing) {
                slugExists = false;
            } else {
                slug = `${generateSlug(title)}-${slugSuffix}`;
                slugSuffix++;
            }
        }

        // Generate excerpt from content
        const excerpt = generateExcerpt(content, 200);

        // Determine published_at timestamp
        const publishedAt =
            postStatus === "published" ? new Date().toISOString() : null;

        // Insert blog post using Supabase
        const [newPost] = await insert<{
            id: number;
            user_id: string;
            title: string;
            slug: string;
            content: string;
            excerpt: string;
            cover_image: string | null;
            status: string;
            published_at: string | null;
        }>("blog_posts", {
            user_id: decoded.userId,
            title,
            slug,
            content,
            excerpt,
            cover_image: coverImage || null,
            status: postStatus || "draft",
            published_at: publishedAt,
        });

        const postId = newPost.id;

        // Insert categories (if provided)
        if (categories && Array.isArray(categories) && categories.length > 0) {
            for (const categoryId of categories) {
                // Validate category exists
                const categoryCheck = await queryOneBuilder<{ id: number }>(
                    "blog_categories",
                    {
                        select: "id",
                        filters: { id: categoryId },
                    },
                );

                if (categoryCheck) {
                    await insert("blog_post_categories", {
                        post_id: postId,
                        category_id: categoryId,
                    });
                }
            }
        }

        // Insert tags (if provided)
        if (tags && Array.isArray(tags) && tags.length > 0) {
            for (const tagName of tags) {
                // Check if tag exists, create if not
                let tag = await queryOneBuilder<{ id: number; slug: string }>(
                    "blog_tags",
                    {
                        select: "id, slug",
                        filters: { slug: generateSlug(tagName) },
                    },
                );

                if (!tag) {
                    // Create new tag
                    const [newTag] = await insert<{
                        id: number;
                        name: string;
                        slug: string;
                    }>("blog_tags", {
                        name: tagName,
                        slug: generateSlug(tagName),
                    });
                    tag = { id: newTag.id, slug: generateSlug(tagName) };
                }

                // Link tag to post
                await insert("blog_post_tags", {
                    post_id: postId,
                    tag_id: tag.id,
                });
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                post: {
                    id: newPost.id,
                    slug: newPost.slug,
                    title: newPost.title,
                },
            },
            message: "Bài viết đã được tạo thành công",
        });
    } catch (error: any) {
        console.error("Create blog post error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Không thể tạo bài viết",
                error:
                    process.env.NODE_ENV === "development"
                        ? error.message
                        : undefined,
            },
            { status: 500 },
        );
    }
}
