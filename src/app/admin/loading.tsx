/**
 * Server-rendered loading fallback for /admin/*.
 *
 * Matches the spinner rendered by the admin page during auth/data fetch.
 */
export default function AdminLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <div
                    className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin mx-auto mb-4"
                    role="status"
                    aria-label="Đang tải"
                />
                <p className="text-sm font-medium text-slate-600">
                    Đang tải bảng điều khiển...
                </p>
            </div>
        </div>
    );
}
