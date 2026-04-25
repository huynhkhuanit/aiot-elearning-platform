/**
 * Loading skeleton cho CV builder.
 */
export default function CVBuilderLoading() {
    return (
        <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
            {/* Toolbar skeleton */}
            <div className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3">
                <div className="h-9 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="flex-1" />
                <div className="h-9 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="h-9 w-32 bg-indigo-300/50 rounded animate-pulse" />
            </div>

            {/* Body skeleton */}
            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 overflow-hidden p-8 flex justify-center">
                    <div className="w-[794px] h-[1123px] bg-white rounded-lg shadow-sm border border-slate-200 p-12 space-y-4">
                        <div className="h-10 w-2/3 bg-slate-200 rounded animate-pulse" />
                        <div className="h-4 w-1/2 bg-slate-100 rounded animate-pulse" />
                        <div className="h-px bg-slate-200 my-6" />
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-4 bg-slate-100 rounded animate-pulse"
                                style={{ width: `${75 + ((i * 11) % 20)}%` }}
                            />
                        ))}
                    </div>
                </main>
                <aside className="w-80 hidden md:block border-l border-slate-200 bg-white p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-16 bg-slate-100 rounded-lg animate-pulse"
                        />
                    ))}
                </aside>
            </div>
        </div>
    );
}
