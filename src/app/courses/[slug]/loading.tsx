/**
 * Server-rendered loading fallback for /courses/[slug].
 *
 * Matches `<PageLoading bg="dark" />` rendered by the page during data fetch.
 * Avoid skeleton/spinner mismatch which causes a perceptible UI flash.
 */
export default function CourseLandingLoading() {
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
