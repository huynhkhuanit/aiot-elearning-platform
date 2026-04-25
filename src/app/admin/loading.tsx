/**
 * Loading skeleton cho admin dashboard (dark theme).
 */
export default function AdminLoading() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 flex">
            {/* Sidebar skeleton */}
            <aside className="hidden md:block w-64 border-r border-slate-800 p-4 space-y-3">
                <div className="h-10 w-32 bg-slate-800 rounded animate-pulse" />
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-9 bg-slate-800/60 rounded-lg animate-pulse"
                    />
                ))}
            </aside>

            {/* Content skeleton */}
            <main className="flex-1 p-6 space-y-6">
                <div className="h-12 w-1/3 bg-slate-800 rounded animate-pulse" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-28 bg-slate-800/50 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-80 bg-slate-800/50 rounded-xl animate-pulse" />
                    <div className="h-80 bg-slate-800/50 rounded-xl animate-pulse" />
                </div>
            </main>
        </div>
    );
}
