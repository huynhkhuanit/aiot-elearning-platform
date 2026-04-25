/**
 * Loading skeleton cho course landing page (F8-style dark theme).
 */
export default function CourseLandingLoading() {
    return (
        <div className="min-h-screen bg-[#0a0c10] text-white">
            {/* Header skeleton */}
            <div className="sticky top-0 z-50 bg-transparent backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/10 rounded-lg animate-pulse" />
                    <div className="h-4 w-72 bg-white/10 rounded animate-pulse hidden sm:block" />
                </div>
            </div>

            {/* Hero skeleton */}
            <div className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-10">
                <div className="space-y-5">
                    <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
                    <div className="h-10 w-5/6 bg-white/10 rounded animate-pulse" />
                    <div className="h-10 w-3/4 bg-white/10 rounded animate-pulse" />
                    <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
                    <div className="h-4 w-4/5 bg-white/10 rounded animate-pulse" />
                    <div className="flex gap-3 pt-3">
                        <div className="h-12 w-40 bg-indigo-500/30 rounded-full animate-pulse" />
                        <div className="h-12 w-40 bg-white/10 rounded-full animate-pulse" />
                    </div>
                </div>
                <div className="aspect-video w-full bg-white/10 rounded-2xl animate-pulse" />
            </div>

            {/* Body skeleton */}
            <div className="max-w-7xl mx-auto px-6 pb-24 grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-20 bg-white/5 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-32 bg-white/5 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
