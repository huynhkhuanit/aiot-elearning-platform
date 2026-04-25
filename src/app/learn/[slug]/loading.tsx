/**
 * Loading skeleton for the learning page.
 * Matches the actual layout: top header bar + sidebar + main video/content area.
 */
export default function LearnLoading() {
    return (
        <div className="min-h-screen bg-[#0a0c10] text-gray-300 flex flex-col">
            {/* Top header skeleton */}
            <div className="h-[45px] flex items-center px-6 border-b border-gray-800 gap-4">
                <div className="h-8 w-8 bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-px bg-gray-700" />
                <div className="h-4 w-64 bg-gray-800 rounded animate-pulse" />
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar skeleton */}
                <aside className="w-80 border-r border-gray-800 p-4 space-y-3 hidden md:block">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-4 w-3/4 bg-gray-800 rounded animate-pulse" />
                            <div className="h-3 w-1/2 bg-gray-800/60 rounded animate-pulse" />
                        </div>
                    ))}
                </aside>

                {/* Main area skeleton */}
                <main className="flex-1 p-6 space-y-6">
                    <div className="aspect-video w-full bg-gray-800 rounded-xl animate-pulse" />
                    <div className="space-y-3">
                        <div className="h-6 w-2/3 bg-gray-800 rounded animate-pulse" />
                        <div className="h-4 w-full bg-gray-800/60 rounded animate-pulse" />
                        <div className="h-4 w-5/6 bg-gray-800/60 rounded animate-pulse" />
                        <div className="h-4 w-4/6 bg-gray-800/60 rounded animate-pulse" />
                    </div>
                </main>
            </div>
        </div>
    );
}
