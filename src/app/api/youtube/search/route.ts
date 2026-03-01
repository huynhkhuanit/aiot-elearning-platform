/**
 * API Route: GET /api/youtube/search
 *
 * Intelligent YouTube video search with academic relevance scoring.
 * Used to find backup educational videos for course lessons.
 *
 * Query params:
 *   - course: course title
 *   - chapter: chapter title
 *   - lesson: lesson title
 *   - lang: language preference (vi | en), default: vi
 *
 * Algorithm weights:
 *   - Title keyword match: 40%
 *   - Channel authority: 20%
 *   - Video duration relevance: 15%
 *   - View count signal: 10%
 *   - Recency: 15%
 */

import { NextRequest, NextResponse } from "next/server";

// Trusted educational channels with their authority scores (0-1)
const TRUSTED_CHANNELS: Record<string, number> = {
    // Vietnamese
    "f8 official": 1.0,
    vnoi: 0.95,
    "tôi đi code dạo": 0.9,
    "easy frontend": 0.95,
    codegym: 0.85,
    kteam: 0.9,
    "son duong": 0.85,
    "hỏi dân it": 0.85,
    "poo poo": 0.8,
    "28tech": 0.9,
    // English
    "freecodecamp.org": 1.0,
    "traversy media": 0.95,
    "the coding train": 0.9,
    fireship: 0.95,
    "web dev simplified": 0.95,
    "net ninja": 0.9,
    "programming with mosh": 0.9,
    "cs dojo": 0.9,
    mycodeschool: 0.95,
    "abdul bari": 0.95,
    "william fiset": 0.95,
    neetcode: 0.95,
    "kevin powell": 0.95,
    codevolution: 0.85,
    "techworld with nana": 0.85,
    "javascript mastery": 0.9,
    academind: 0.9,
    sentdex: 0.85,
    "tech with tim": 0.85,
};

// Keywords to filter out non-educational content
const EXCLUDE_KEYWORDS = [
    "shorts",
    "#shorts",
    "meme",
    "funny",
    "reaction",
    "vlog",
    "gameplay",
    "music",
    "podcast unrelated",
    "compilation",
    "tiktok",
];

interface YouTubeSearchResult {
    videoId: string;
    title: string;
    channelTitle: string;
    publishedAt: string;
    description: string;
    thumbnailUrl: string;
    relevanceScore: number;
    factors: {
        keywordMatch: number;
        channelAuthority: number;
        durationRelevance: number;
        viewCountSignal: number;
        recencyScore: number;
    };
}

interface YouTubeVideoDetails {
    id: string;
    duration: string;
    viewCount: string;
}

/**
 * Build an optimized search query for YouTube
 * Prioritizes specific terms over generic ones
 */
function buildSearchQuery(
    course: string,
    chapter: string,
    lesson: string,
    lang: string,
): string {
    // Extract key programming concepts from lesson title
    const lessonClean = lesson
        .replace(/^(Bài tập|Thực hành|Giới thiệu|Tổng kết):?\s*/i, "")
        .replace(/\(.*?\)/g, "")
        .trim();

    // Build query: lesson title + course context + tutorial keyword
    const langKeyword = lang === "vi" ? "hướng dẫn" : "tutorial";
    const query = `${lessonClean} ${course.split(" ").slice(0, 3).join(" ")} ${langKeyword}`;

    return query;
}

/**
 * Calculate keyword match score (0-1)
 * How many lesson keywords appear in the video title
 */
function calcKeywordMatchScore(
    lessonTitle: string,
    videoTitle: string,
): number {
    const normalize = (s: string) =>
        s
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s+#]/g, " ")
            .split(/\s+/)
            .filter((w) => w.length > 1);

    const lessonWords = normalize(lessonTitle);
    const videoTitleNorm = videoTitle.toLowerCase();

    if (lessonWords.length === 0) return 0;

    let matchCount = 0;
    for (const word of lessonWords) {
        if (videoTitleNorm.includes(word)) {
            matchCount++;
        }
    }

    return matchCount / lessonWords.length;
}

/**
 * Calculate channel authority score (0-1)
 */
function calcChannelAuthorityScore(channelTitle: string): number {
    const normalized = channelTitle.toLowerCase().trim();
    return TRUSTED_CHANNELS[normalized] || 0.3; // Unknown channels get base 0.3
}

/**
 * Calculate video duration relevance (0-1)
 * Ideal range: 5-30 minutes for educational content
 */
function calcDurationRelevanceScore(isoDuration: string): number {
    // Parse ISO 8601 duration (PT1H30M45S)
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0.5;

    const hours = parseInt(match[1] || "0");
    const minutes = parseInt(match[2] || "0");
    const seconds = parseInt(match[3] || "0");
    const totalMinutes = hours * 60 + minutes + seconds / 60;

    // Scoring curve: ideal 8-25 minutes
    if (totalMinutes < 2) return 0.1; // Too short (likely shorts)
    if (totalMinutes < 5) return 0.4;
    if (totalMinutes <= 8) return 0.7;
    if (totalMinutes <= 25) return 1.0; // Ideal
    if (totalMinutes <= 45) return 0.8;
    if (totalMinutes <= 90) return 0.6;
    return 0.3; // Very long
}

/**
 * Calculate view count signal (0-1)
 * Higher views = more vetted, but with diminishing returns
 */
function calcViewCountSignal(viewCount: string): number {
    const views = parseInt(viewCount || "0");
    if (views < 100) return 0.1;
    if (views < 1000) return 0.3;
    if (views < 10000) return 0.5;
    if (views < 100000) return 0.7;
    if (views < 1000000) return 0.9;
    return 1.0;
}

/**
 * Calculate recency score (0-1)
 * Newer content preferred for tech topics
 */
function calcRecencyScore(publishedAt: string): number {
    const pubDate = new Date(publishedAt);
    const now = new Date();
    const monthsAgo =
        (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (monthsAgo < 6) return 1.0;
    if (monthsAgo < 12) return 0.9;
    if (monthsAgo < 24) return 0.8;
    if (monthsAgo < 36) return 0.65;
    if (monthsAgo < 60) return 0.5;
    return 0.3;
}

/**
 * Check if video should be excluded (non-educational)
 */
function shouldExclude(title: string, description: string): boolean {
    const combined = `${title} ${description}`.toLowerCase();
    return EXCLUDE_KEYWORDS.some((kw) => combined.includes(kw));
}

/**
 * Calculate final relevance score with weights
 */
function calcRelevanceScore(
    lessonTitle: string,
    videoTitle: string,
    channelTitle: string,
    duration: string,
    viewCount: string,
    publishedAt: string,
): { score: number; factors: YouTubeSearchResult["factors"] } {
    const factors = {
        keywordMatch: calcKeywordMatchScore(lessonTitle, videoTitle),
        channelAuthority: calcChannelAuthorityScore(channelTitle),
        durationRelevance: calcDurationRelevanceScore(duration),
        viewCountSignal: calcViewCountSignal(viewCount),
        recencyScore: calcRecencyScore(publishedAt),
    };

    // Weighted average
    const score =
        factors.keywordMatch * 0.4 +
        factors.channelAuthority * 0.2 +
        factors.durationRelevance * 0.15 +
        factors.viewCountSignal * 0.1 +
        factors.recencyScore * 0.15;

    return { score: Math.round(score * 100) / 100, factors };
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const course = searchParams.get("course") || "";
        const chapter = searchParams.get("chapter") || "";
        const lesson = searchParams.get("lesson") || "";
        const lang = searchParams.get("lang") || "vi";
        const maxResults = Math.min(
            parseInt(searchParams.get("max") || "5"),
            10,
        );

        if (!lesson) {
            return NextResponse.json(
                { success: false, message: "lesson parameter is required" },
                { status: 400 },
            );
        }

        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                {
                    success: false,
                    message: "YouTube API key not configured",
                    hint: "Set YOUTUBE_API_KEY in environment variables",
                },
                { status: 503 },
            );
        }

        // Step 1: Build search query
        const query = buildSearchQuery(course, chapter, lesson, lang);

        // Step 2: Search YouTube
        const searchUrl = new URL(
            "https://www.googleapis.com/youtube/v3/search",
        );
        searchUrl.searchParams.set("key", apiKey);
        searchUrl.searchParams.set("q", query);
        searchUrl.searchParams.set("part", "snippet");
        searchUrl.searchParams.set("type", "video");
        searchUrl.searchParams.set("maxResults", String(maxResults * 2)); // Fetch extra for filtering
        searchUrl.searchParams.set(
            "relevanceLanguage",
            lang === "vi" ? "vi" : "en",
        );
        searchUrl.searchParams.set("videoDuration", "medium"); // 4-20 minutes
        searchUrl.searchParams.set("videoEmbeddable", "true");
        searchUrl.searchParams.set("safeSearch", "strict");

        const searchRes = await fetch(searchUrl.toString());
        if (!searchRes.ok) {
            throw new Error(
                `YouTube search failed: ${searchRes.status} ${searchRes.statusText}`,
            );
        }

        const searchData = await searchRes.json();
        const items = searchData.items || [];

        if (items.length === 0) {
            return NextResponse.json({
                success: true,
                data: { results: [], query, totalResults: 0 },
            });
        }

        // Step 3: Get video details (duration, view count)
        const videoIds = items.map((i: any) => i.id.videoId).join(",");
        const detailsUrl = new URL(
            "https://www.googleapis.com/youtube/v3/videos",
        );
        detailsUrl.searchParams.set("key", apiKey);
        detailsUrl.searchParams.set("id", videoIds);
        detailsUrl.searchParams.set(
            "part",
            "contentDetails,statistics,snippet",
        );

        const detailsRes = await fetch(detailsUrl.toString());
        const detailsData = await detailsRes.json();
        const videoDetails: Record<string, YouTubeVideoDetails> = {};

        for (const v of detailsData.items || []) {
            videoDetails[v.id] = {
                id: v.id,
                duration: v.contentDetails?.duration || "PT0S",
                viewCount: v.statistics?.viewCount || "0",
            };
        }

        // Step 4: Score and rank
        const results: YouTubeSearchResult[] = items
            .filter(
                (item: any) =>
                    !shouldExclude(
                        item.snippet.title,
                        item.snippet.description,
                    ),
            )
            .map((item: any) => {
                const videoId = item.id.videoId;
                const details = videoDetails[videoId];
                const { score, factors } = calcRelevanceScore(
                    lesson,
                    item.snippet.title,
                    item.snippet.channelTitle,
                    details?.duration || "PT10M",
                    details?.viewCount || "0",
                    item.snippet.publishedAt,
                );

                return {
                    videoId,
                    title: item.snippet.title,
                    channelTitle: item.snippet.channelTitle,
                    publishedAt: item.snippet.publishedAt,
                    description: item.snippet.description,
                    thumbnailUrl:
                        item.snippet.thumbnails?.high?.url ||
                        item.snippet.thumbnails?.default?.url,
                    relevanceScore: score,
                    factors,
                };
            })
            .sort(
                (a: YouTubeSearchResult, b: YouTubeSearchResult) =>
                    b.relevanceScore - a.relevanceScore,
            )
            .slice(0, maxResults);

        return NextResponse.json({
            success: true,
            data: {
                results,
                query,
                totalResults: results.length,
                algorithm: {
                    weights: {
                        keywordMatch: 0.4,
                        channelAuthority: 0.2,
                        durationRelevance: 0.15,
                        viewCountSignal: 0.1,
                        recencyScore: 0.15,
                    },
                    trustedChannels: Object.keys(TRUSTED_CHANNELS).length,
                },
            },
        });
    } catch (error: any) {
        console.error("YouTube search error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to search YouTube",
                error: error.message,
            },
            { status: 500 },
        );
    }
}
