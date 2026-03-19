"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    BookOpen,
    Calendar,
    FileText,
    Globe,
    GraduationCap,
    Link2,
    MapPin,
    Trophy,
    UserPlus,
    Users,
} from "lucide-react";
import PageLoading from "@/components/PageLoading";
import AvatarWithProBadge from "@/components/AvatarWithProBadge";
import VerifiedBadge from "@/components/profile/VerifiedBadge";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import { formatUsernameHandle } from "@/lib/profile-url";
import type { UnifiedProfileResponse } from "@/types/profile";

/* ─────────────────── Helpers ─────────────────── */

function timeSinceJoined(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days < 30) return `${days} ngày trước`;
    if (days < 365) return `${Math.floor(days / 30)} tháng trước`;
    return `${Math.floor(days / 365)} năm trước`;
}

/* ─────────────── Social Icons ─────────────── */

function GitHubIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
        </svg>
    );
}

function FacebookIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    );
}

function YouTubeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
    );
}

function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
    );
}

function LinkedInIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    );
}

function XTwitterIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

const SOCIAL_ICON_MAP: Record<
    string,
    (p: { className?: string }) => ReactNode
> = {
    github: GitHubIcon,
    facebook: FacebookIcon,
    youtube: YouTubeIcon,
    tiktok: TikTokIcon,
    linkedin: LinkedInIcon,
    twitter: XTwitterIcon,
};

function SocialIcon({
    platform,
    className = "h-4 w-4",
}: {
    platform: string;
    className?: string;
}) {
    const Comp = SOCIAL_ICON_MAP[platform.toLowerCase()];
    return Comp ? (
        <Comp className={className} />
    ) : (
        <Link2 className={className} />
    );
}

/* ─────────────── Course Card (F8 style) ─────────────── */

function CourseCard({
    course,
}: {
    course: UnifiedProfileResponse["courses"][number];
}) {
    return (
        <Link
            href={`/learn/${course.slug}`}
            className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-lg"
        >
            <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                {course.thumbnailUrl ? (
                    <Image
                        src={course.thumbnailUrl}
                        alt={course.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <BookOpen className="h-10 w-10 text-gray-300" />
                    </div>
                )}
            </div>
            <div className="p-4">
                <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900 group-hover:text-[#f05123]">
                    {course.title}
                </h3>
                {course.shortDescription && (
                    <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-gray-500">
                        {course.shortDescription}
                    </p>
                )}
            </div>
        </Link>
    );
}

/* ─────────────── Main Component ─────────────── */

export default function UserProfileContent({ username }: { username: string }) {
    const [profile, setProfile] = useState<UnifiedProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("enrolled");

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const res = await fetch(`/api/profiles/${username}`, {
                    cache: "no-store",
                });
                const json = await res.json();
                if (!res.ok || !json.success)
                    throw new Error(json.message || "Không thể tải hồ sơ");
                setProfile(json.data);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Không thể tải hồ sơ",
                );
            } finally {
                setLoading(false);
            }
        }
        if (username) load();
    }, [username]);

    if (loading) return <PageLoading message="Đang tải hồ sơ..." />;

    if (error || !profile) {
        return (
            <div className="flex min-h-[60dvh] items-center justify-center px-4">
                <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                        <Users className="h-7 w-7 text-gray-400" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">
                        Hồ sơ không khả dụng
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                        {error || "Hồ sơ được yêu cầu không tồn tại."}
                    </p>
                    <Link
                        href="/"
                        className="mt-6 inline-flex items-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                        Quay về trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    const { user, publicProfile, badges, courses, stats } = profile;

    const isInstructor =
        user.roles.includes("instructor") || user.roles.includes("partner");

    interface TabItem {
        id: string;
        label: string;
        count: number;
        icon: ReactNode;
    }

    const tabs: TabItem[] = [
        {
            id: "enrolled",
            label: "Khóa học đã đăng ký",
            count: stats.totalCoursesEnrolled,
            icon: <BookOpen className="h-4 w-4" />,
        },
        {
            id: "articles",
            label: "Bài viết đã đăng",
            count: stats.totalArticlesPublished,
            icon: <FileText className="h-4 w-4" />,
        },
    ];

    if (courses.length > 0) {
        tabs.push({
            id: "created",
            label: "Khóa học đã tạo",
            count: courses.length,
            icon: <GraduationCap className="h-4 w-4" />,
        });
    }

    return (
        <div className="px-4 py-8 sm:px-8 lg:px-14">
            {/* ───── Two Column Grid — full-width profile layout ───── */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr] lg:gap-12">
                {/* ═══════════════ LEFT SIDEBAR ═══════════════ */}
                <aside className="space-y-5">
                    {/* Avatar */}
                    <div className="flex justify-center lg:justify-start">
                        <AvatarWithProBadge
                            avatarUrl={publicProfile.avatarUrl}
                            fullName={publicProfile.displayName}
                            isPro={isInstructor}
                            isRegistered
                            size="2xl"
                        />
                    </div>

                    {/* Name + Verified Badge */}
                    <div>
                        <div className="flex items-center gap-1.5">
                            <p
                                className="font-bold leading-tight text-gray-900"
                                style={{ fontSize: "24px", fontWeight: "700" }}
                            >
                                {publicProfile.displayName}
                            </p>
                            {badges.map((b) => (
                                <VerifiedBadge
                                    key={b.code}
                                    badge={b}
                                    className="h-5 w-5"
                                />
                            ))}
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {formatUsernameHandle(user.username)}
                        </p>
                    </div>

                    {/* Bio with Read More */}
                    <BioSection
                        text={publicProfile.bio || publicProfile.headline || ""}
                    />

                    {/* Follow Button (F8 style) */}
                    <button className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-200 active:scale-[0.98]">
                        <UserPlus className="h-4 w-4" />
                        Theo dõi
                    </button>

                    {/* Stats list */}
                    <div className="space-y-3 text-[14px] text-gray-600">
                        {(stats.totalCoursesEnrolled > 0 ||
                            stats.totalForumPosts > 0) && (
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 shrink-0 text-gray-400" />
                                <span>
                                    <strong className="font-semibold text-gray-900">
                                        {stats.totalCoursesEnrolled}
                                    </strong>{" "}
                                    khóa học
                                    {stats.totalForumPosts > 0 && (
                                        <>
                                            {" "}
                                            ·{" "}
                                            <strong className="font-semibold text-gray-900">
                                                {stats.totalForumPosts}
                                            </strong>{" "}
                                            bài forum
                                        </>
                                    )}
                                </span>
                            </div>
                        )}

                        {stats.totalArticlesPublished > 0 && (
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                                <span>
                                    <strong className="font-semibold text-gray-900">
                                        {stats.totalArticlesPublished}
                                    </strong>{" "}
                                    bài viết đã đăng
                                </span>
                            </div>
                        )}

                        {stats.totalCoursesCompleted > 0 && (
                            <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 shrink-0 text-gray-400" />
                                <span>
                                    <strong className="font-semibold text-gray-900">
                                        {stats.totalCoursesCompleted}
                                    </strong>{" "}
                                    chứng chỉ
                                </span>
                            </div>
                        )}

                        {publicProfile.location && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                                <span>{publicProfile.location}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
                            <span>Tham gia nền tảng</span>
                        </div>
                    </div>

                    {/* Social & Website Links */}
                    {(publicProfile.websiteUrl ||
                        Object.keys(publicProfile.socialLinks).length > 0) && (
                        <div className="space-y-2 border-t border-gray-200 pt-4">
                            {publicProfile.websiteUrl && (
                                <a
                                    href={publicProfile.websiteUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 text-sm text-gray-600 transition hover:text-blue-600"
                                >
                                    <Globe className="h-4 w-4 shrink-0" />
                                    <span className="truncate">
                                        {publicProfile.websiteUrl.replace(
                                            /^https?:\/\//,
                                            "",
                                        )}
                                    </span>
                                </a>
                            )}
                            {Object.entries(publicProfile.socialLinks).map(
                                ([key, url]) => (
                                    <a
                                        key={key}
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 text-sm text-gray-600 transition hover:text-blue-600"
                                    >
                                        <SocialIcon
                                            platform={key}
                                            className="h-4 w-4 shrink-0"
                                        />
                                        <span className="truncate">
                                            {url.replace(/^https?:\/\//, "")}
                                        </span>
                                    </a>
                                ),
                            )}
                        </div>
                    )}
                </aside>

                {/* ═══════════════ RIGHT CONTENT ═══════════════ */}
                <main className="min-w-0 space-y-6">
                    {/* Activity Heatmap */}
                    <ActivityHeatmap username={username} />

                    {/* Tab Navigation (F8 style) */}
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex gap-6 overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 pb-3 pt-1 text-[14px] font-semibold transition-colors ${
                                        activeTab === tab.id
                                            ? "border-gray-900 text-gray-900"
                                            : "border-transparent text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label} ({tab.count})
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    {activeTab === "enrolled" && (
                        <EmptyState
                            icon={
                                <BookOpen className="h-10 w-10 text-gray-300" />
                            }
                            message={
                                stats.totalCoursesEnrolled > 0
                                    ? "Thông tin khóa học đã đăng ký hiện được bảo mật."
                                    : "Chưa đăng ký khóa học nào."
                            }
                        />
                    )}

                    {activeTab === "articles" && (
                        <EmptyState
                            icon={
                                <FileText className="h-10 w-10 text-gray-300" />
                            }
                            message={
                                stats.totalArticlesPublished > 0
                                    ? "Hiện chưa hiển thị danh sách bài viết trên hồ sơ công khai."
                                    : "Chưa đăng bài viết nào."
                            }
                        />
                    )}

                    {activeTab === "created" && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {courses.map((c) => (
                                <CourseCard key={c.id} course={c} />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

/* ─────────────── Bio with Read More ─────────────── */

function BioSection({ text }: { text: string }) {
    const [expanded, setExpanded] = useState(false);
    const [isClamped, setIsClamped] = useState(false);
    const textRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        const el = textRef.current;
        if (el) setIsClamped(el.scrollHeight > el.clientHeight + 1);
    }, [text]);

    if (!text) return null;

    return (
        <div>
            <p
                ref={textRef}
                className={`text-[15px] leading-relaxed text-gray-700 ${
                    expanded ? "" : "line-clamp-3"
                }`}
            >
                {text}
            </p>
            {(isClamped || expanded) && (
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-1 text-[13px] font-semibold text-blue-600 transition hover:text-blue-700"
                >
                    {expanded ? "Thu gọn" : "Xem thêm"}
                </button>
            )}
        </div>
    );
}

/* ─────────────── Shared Empty State ─────────────── */

function EmptyState({ icon, message }: { icon: ReactNode; message: string }) {
    return (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                {icon}
            </div>
            <p className="text-sm text-gray-500">{message}</p>
        </div>
    );
}
