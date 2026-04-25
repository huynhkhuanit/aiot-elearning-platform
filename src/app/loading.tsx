/**
 * Root-level route loading state.
 *
 * Server component (no client JS) — instant paint khi chuyển trang.
 * Hiện ngay giữa lúc Next.js resolve route segment, tránh "trắng màn".
 */
export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div
                className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-[var(--color-primary,#4F46E5)] animate-spin"
                role="status"
                aria-label="Đang tải"
            />
        </div>
    );
}
