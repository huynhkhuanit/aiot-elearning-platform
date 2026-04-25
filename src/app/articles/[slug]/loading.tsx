/**
 * Loading skeleton cho article detail page.
 */
export default function ArticleDetailLoading() {
    return (
        <div className="min-h-screen bg-white">
            <article className="max-w-3xl mx-auto px-6 py-12 space-y-6">
                <div className="space-y-3">
                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-5/6 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                    <div className="space-y-1.5">
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                    </div>
                </div>
                <div className="aspect-video w-full bg-gray-200 rounded-xl animate-pulse" />
                <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-4 bg-gray-100 rounded animate-pulse"
                            style={{ width: `${85 + ((i * 13) % 15)}%` }}
                        />
                    ))}
                </div>
            </article>
        </div>
    );
}
