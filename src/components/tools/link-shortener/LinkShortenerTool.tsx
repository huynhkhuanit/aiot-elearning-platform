"use client";

/* ══════════════════════════════════════════════════════════════
   Link Shortener Tool – Hybrid Ownership (Anonymous + Auth)
   ══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from "react";

/* ── Types ─────────────────────────────────────────────────── */
interface ShortLink {
    id: string;
    code: string;
    originalUrl: string;
    shortUrl?: string;
    clicks: number;
    createdAt: string;
}

/* ── Anonymous ID helper ──────────────────────────────────── */
const ANON_KEY = "cs_link_shortener_id";

function getAnonymousId(): string {
    if (typeof window === "undefined") return "";
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(ANON_KEY, id);
    }
    return id;
}

/* ── QR helper — tiny inline SVG QR for a URL ─────────────── */
function generateQRDataUrl(text: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}&format=svg`;
}

/* ── Date helper ───────────────────────────────────────────── */
function timeAgo(dateStr: string): string {
    const now = Date.now();
    const past = new Date(dateStr).getTime();
    const diffMs = now - past;
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    return `${Math.floor(days / 30)} tháng trước`;
}

/* ── Component ─────────────────────────────────────────────── */
export function LinkShortenerTool() {
    const [url, setUrl] = useState("");
    const [customCode, setCustomCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<ShortLink | null>(null);
    const [copied, setCopied] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [recentLinks, setRecentLinks] = useState<ShortLink[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    /* ── Auth state ────────────────────────────────────────── */
    const [authUserId, setAuthUserId] = useState<string | null>(null);
    const [authChecked, setAuthChecked] = useState(false);

    /* ── Pagination state ─────────────────────────────────── */
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    /* ── Check auth status on mount ───────────────────────── */
    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await fetch("/api/auth/me", {
                    credentials: "include",
                });
                const json = await res.json();
                if (json.success && json.data?.user?.id) {
                    setAuthUserId(json.data.user.id);

                    // Claim anonymous links if user just logged in
                    const anonId = localStorage.getItem(ANON_KEY);
                    if (anonId) {
                        await fetch("/api/links", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ anonymousId: anonId }),
                        });
                        // Keep the anonymous ID for future sessions
                    }
                }
            } catch {
                // Not logged in — that's fine
            } finally {
                setAuthChecked(true);
            }
        }
        checkAuth();
    }, []);

    /* ── Fetch recent links after auth check ──────────────── */
    useEffect(() => {
        if (authChecked) fetchRecent();
    }, [authChecked, authUserId]);

    async function fetchRecent() {
        try {
            // Build query with identity
            const params = new URLSearchParams();
            if (!authUserId) {
                const anonId = getAnonymousId();
                if (anonId) params.set("anonymousId", anonId);
            }

            const res = await fetch(`/api/links?${params.toString()}`, {
                credentials: "include",
            });
            const json = await res.json();
            if (json.success) setRecentLinks(json.data);
        } catch {
            // silent fail for listing
        }
    }

    /* ── Shorten handler ──────────────────────────────────── */
    const handleShorten = useCallback(async () => {
        setError("");
        setResult(null);
        setCopied(false);

        const trimmed = url.trim();
        if (!trimmed) {
            setError("Vui lòng nhập URL");
            return;
        }

        try {
            new URL(trimmed);
        } catch {
            setError("URL không hợp lệ. Hãy bao gồm http:// hoặc https://");
            return;
        }

        setLoading(true);
        try {
            const body: Record<string, string | undefined> = {
                url: trimmed,
                customCode: customCode.trim() || undefined,
            };

            // Attach anonymous ID if not logged in
            if (!authUserId) {
                body.anonymousId = getAnonymousId();
            }

            const res = await fetch("/api/links", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body),
            });
            const json = await res.json();

            if (!json.success) {
                setError(json.message || "Có lỗi xảy ra");
            } else {
                setResult(json.data);
                setRecentLinks((prev) => [json.data, ...prev].slice(0, 30));
                setCurrentPage(1);
                setUrl("");
                setCustomCode("");
            }
        } catch {
            setError("Không thể kết nối server. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }, [url, customCode, authUserId]);

    /* ── Copy to clipboard ────────────────────────────────── */
    const handleCopy = useCallback(async (text: string, id?: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
        }
        if (id) {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } else {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, []);

    /* ── Keyboard shortcut ────────────────────────────────── */
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !loading) handleShorten();
        },
        [handleShorten, loading],
    );

    /* ── Pagination logic ─────────────────────────────────── */
    const totalPages = Math.ceil(recentLinks.length / itemsPerPage);
    const currentLinks = recentLinks.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    /* ── Render ────────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <main className="mx-auto max-w-3xl px-6 py-12">
                {/* ── Hero section ────────────────────────── */}
                <div className="mb-10 text-center">
                    <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg shadow-teal-200/50">
                        <svg
                            className="size-7 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                            />
                        </svg>
                    </div>
                    <h2 className="mb-2.5 text-2xl font-bold tracking-tight text-slate-800">
                        Rút gọn liên kết dễ dàng
                    </h2>
                    <p className="mx-auto max-w-lg text-sm leading-relaxed text-slate-500">
                        Biến đường dẫn dài thành ngắn gọn, dễ nhớ và theo dõi
                        lượt click trong tích tắc. Dành cho cộng đồng CodeSense.
                    </p>
                </div>

                {/* ── Input card ──────────────────────────── */}
                <div className="mx-auto max-w-2xl">
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40">
                        <div className="p-6">
                            {/* URL input */}
                            <div className="flex gap-2.5">
                                <div className="relative flex-1">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                                        <svg
                                            className="size-4 text-slate-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                            />
                                        </svg>
                                    </div>
                                    <input
                                        ref={inputRef}
                                        id="url-input"
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="https://example.com/very-long-url..."
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-teal-300 focus:bg-white focus:ring-2 focus:ring-teal-100"
                                        disabled={loading}
                                    />
                                </div>
                                <button
                                    id="shorten-button"
                                    onClick={handleShorten}
                                    disabled={loading}
                                    className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-teal-200/50 transition-all hover:from-teal-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-teal-300/50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading ? (
                                        <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    ) : (
                                        <svg
                                            className="size-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2.5}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                                            />
                                        </svg>
                                    )}
                                    Rút gọn
                                </button>
                            </div>

                            {/* Advanced options toggle */}
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-teal-500"
                            >
                                <svg
                                    className="size-3.5 text-slate-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                                Tùy chọn nâng cao
                                <svg
                                    className={`size-3 transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                                    />
                                </svg>
                            </button>

                            {/* Custom code input */}
                            {showAdvanced && (
                                <div className="mt-3 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/50 p-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <label
                                        htmlFor="custom-code"
                                        className="mb-2 block text-xs font-medium text-slate-600"
                                    >
                                        Mã tùy chỉnh
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="shrink-0 rounded-lg bg-white px-2.5 py-2 text-xs text-slate-400 ring-1 ring-slate-200">
                                            /api/links/
                                        </span>
                                        <input
                                            id="custom-code"
                                            type="text"
                                            value={customCode}
                                            onChange={(e) =>
                                                setCustomCode(
                                                    e.target.value.replace(
                                                        /[^a-zA-Z0-9_-]/g,
                                                        "",
                                                    ),
                                                )
                                            }
                                            onKeyDown={handleKeyDown}
                                            placeholder="my-link"
                                            maxLength={32}
                                            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
                                            disabled={loading}
                                        />
                                    </div>
                                    <p className="mt-2 text-[11px] text-slate-400">
                                        Chỉ sử dụng chữ cái, số và dấu gạch
                                        ngang.
                                    </p>
                                </div>
                            )}

                            {/* Error message */}
                            {error && (
                                <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                                    <svg
                                        className="size-4 shrink-0"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                                        />
                                    </svg>
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* ── Result ──────────────────────────── */}
                        {result && (
                            <div className="border-t border-teal-100 bg-gradient-to-br from-teal-50/60 via-cyan-50/40 to-emerald-50/30 p-6">
                                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-teal-700">
                                    <span className="flex size-5 items-center justify-center rounded-full bg-teal-100 text-xs">
                                        ✨
                                    </span>
                                    Liên kết đã được tạo thành công!
                                </div>

                                <div className="flex gap-4">
                                    {/* Short URL + info */}
                                    <div className="min-w-0 flex-1">
                                        <div className="overflow-hidden rounded-xl border border-teal-200/60 bg-white p-4">
                                            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                                Đường dẫn ngắn
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <p
                                                    id="short-url-result"
                                                    className="min-w-0 flex-1 truncate text-sm font-semibold text-teal-700"
                                                >
                                                    {result.shortUrl}
                                                </p>
                                                <button
                                                    id="copy-button"
                                                    onClick={() =>
                                                        handleCopy(
                                                            result.shortUrl ||
                                                                "",
                                                        )
                                                    }
                                                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                                                        copied
                                                            ? "bg-emerald-500 text-white"
                                                            : "bg-teal-100 text-teal-700 hover:bg-teal-200"
                                                    }`}
                                                >
                                                    {copied ? (
                                                        <>
                                                            <svg
                                                                className="size-3.5"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                                strokeWidth={
                                                                    2.5
                                                                }
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M4.5 12.75l6 6 9-13.5"
                                                                />
                                                            </svg>
                                                            Đã chép
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg
                                                                className="size-3.5"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                                strokeWidth={2}
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                                                                />
                                                            </svg>
                                                            Sao chép
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            <div className="mt-3 border-t border-slate-100 pt-3">
                                                <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                                    URL gốc
                                                </p>
                                                <p className="truncate text-xs text-slate-500">
                                                    {result.originalUrl}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* QR Code */}
                                    {result.shortUrl && (
                                        <div className="flex shrink-0 flex-col items-center">
                                            <div className="overflow-hidden rounded-xl border border-teal-100 bg-white p-2.5 shadow-sm">
                                                <img
                                                    src={generateQRDataUrl(
                                                        result.shortUrl,
                                                    )}
                                                    alt="QR Code"
                                                    width={90}
                                                    height={90}
                                                    className="size-[90px]"
                                                />
                                            </div>
                                            <a
                                                href={generateQRDataUrl(
                                                    result.shortUrl,
                                                )}
                                                download="qr-code.svg"
                                                className="mt-2 flex items-center gap-1 text-[11px] text-teal-600 transition hover:text-teal-700"
                                            >
                                                <svg
                                                    className="size-3"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                                                    />
                                                </svg>
                                                Tải QR
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Recent Links ────────────────────────── */}
                    {recentLinks.length > 0 && (
                        <div className="mt-10">
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <svg
                                    className="size-4 text-teal-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                Liên kết của {authUserId ? "bạn" : "bạn"}
                                <span className="ml-auto text-xs font-normal text-slate-400">
                                    {authUserId ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-teal-600">
                                            <svg
                                                className="size-3"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                                                />
                                            </svg>
                                            Đã đồng bộ tài khoản
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-slate-400">
                                            <svg
                                                className="size-3"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
                                                />
                                            </svg>
                                            Lưu trên thiết bị này
                                        </span>
                                    )}
                                </span>
                            </h3>

                            <div className="space-y-2.5">
                                {currentLinks.map((link) => (
                                    <div
                                        key={link.id}
                                        className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3.5 transition-all hover:border-teal-200/60 hover:shadow-sm"
                                    >
                                        {/* Icon */}
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-500 transition group-hover:bg-teal-100">
                                            <svg
                                                className="size-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                                                />
                                            </svg>
                                        </div>

                                        {/* Info */}
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-teal-700">
                                                /api/links/{link.code}
                                            </p>
                                            <p className="truncate text-xs text-slate-400">
                                                {link.originalUrl}
                                            </p>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex shrink-0 flex-col items-end gap-0.5">
                                            <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                                                <svg
                                                    className="size-3 text-teal-400"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59"
                                                    />
                                                </svg>
                                                {link.clicks} clicks
                                            </div>
                                            <span className="text-[10px] text-slate-400">
                                                {timeAgo(link.createdAt)}
                                            </span>
                                        </div>

                                        {/* Copy button */}
                                        <button
                                            onClick={() => {
                                                const shortUrl = `${window.location.origin}/api/links/${link.code}`;
                                                handleCopy(shortUrl, link.id);
                                            }}
                                            className={`shrink-0 rounded-lg p-2 transition-all ${
                                                copiedId === link.id
                                                    ? "bg-emerald-100 text-emerald-600"
                                                    : "text-slate-400 opacity-0 hover:bg-teal-50 hover:text-teal-600 group-hover:opacity-100"
                                            }`}
                                            title={
                                                copiedId === link.id
                                                    ? "Đã sao chép!"
                                                    : "Sao chép link"
                                            }
                                        >
                                            {copiedId === link.id ? (
                                                <svg
                                                    className="size-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={2.5}
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M4.5 12.75l6 6 9-13.5"
                                                    />
                                                </svg>
                                            ) : (
                                                <svg
                                                    className="size-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                                                    />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="mt-6 flex items-center justify-center gap-1">
                                    <button
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.max(1, p - 1),
                                            )
                                        }
                                        disabled={currentPage === 1}
                                        className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-teal-50 hover:text-teal-600 disabled:pointer-events-none disabled:opacity-50"
                                    >
                                        <svg
                                            className="size-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M15 19l-7-7 7-7"
                                            />
                                        </svg>
                                    </button>

                                    <div className="flex items-center gap-1 px-2">
                                        {Array.from({ length: totalPages }).map(
                                            (_, idx) => {
                                                const page = idx + 1;
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() =>
                                                            setCurrentPage(page)
                                                        }
                                                        className={`flex size-8 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                                                            currentPage === page
                                                                ? "bg-teal-500 text-white shadow-sm shadow-teal-200/50"
                                                                : "text-slate-500 hover:bg-teal-50 hover:text-teal-600"
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            },
                                        )}
                                    </div>

                                    <button
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.min(totalPages, p + 1),
                                            )
                                        }
                                        disabled={currentPage === totalPages}
                                        className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-teal-50 hover:text-teal-600 disabled:pointer-events-none disabled:opacity-50"
                                    >
                                        <svg
                                            className="size-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* ── Footer ──────────────────────────────────── */}
            <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
                © {new Date().getFullYear()} CodeSense VN. Nền tảng giáo dục lập
                trình.
            </footer>
        </div>
    );
}
