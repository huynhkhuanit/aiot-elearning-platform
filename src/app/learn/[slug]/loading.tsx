/**
 * Server-rendered loading fallback for /learn/[slug].
 *
 * Must visually match `<PageLoading bg="dark" />` (rendered by the client
 * page during data fetch) — same dark background, same centered spinner.
 * Otherwise users see a skeleton flash → spinner flash → real content,
 * which feels like "components appear before loading".
 */
export default function LearnLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0c10]">
            <div className="text-center">
                <div
                    className="h-10 w-10 rounded-full border-4 border-gray-700 border-t-indigo-400 animate-spin mx-auto mb-4"
                    role="status"
                    aria-label="Đang tải"
                />
                <p className="text-sm font-medium text-gray-300">
                    Đang tải khóa học...
                </p>
            </div>
        </div>
    );
}
