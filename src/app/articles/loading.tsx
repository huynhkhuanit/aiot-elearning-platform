/**
 * Loading skeleton cho articles list page.
 */
export default function ArticlesLoading() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
                <div className="space-y-3">
                    <div className="h-9 w-1/3 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <article
                            key={i}
                            className="rounded-2xl border border-gray-100 overflow-hidden"
                        >
                            <div className="aspect-video bg-gray-200 animate-pulse" />
                            <div className="p-4 space-y-2.5">
                                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                                <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
                                <div className="flex items-center gap-2 pt-2">
                                    <div className="h-7 w-7 rounded-full bg-gray-200 animate-pulse" />
                                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}
