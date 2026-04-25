/**
 * Loading skeleton cho roadmap index.
 */
export default function RoadmapLoading() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-6 py-16 space-y-10">
                <div className="space-y-3">
                    <div className="h-10 w-2/3 bg-gray-200 rounded animate-pulse" />
                    <div className="h-5 w-1/2 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-2xl border border-gray-100 p-5 space-y-3"
                        >
                            <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
                            <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                            <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
                            <div className="flex gap-2 pt-2">
                                <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
                                <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
