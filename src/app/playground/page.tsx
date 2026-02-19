"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { IDELayout } from "@/components/IDE";

function PlaygroundContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();
    const [ready, setReady] = useState(false);

    const lessonId = searchParams.get("lesson") || "";
    const lang =
        (searchParams.get("lang") as "html" | "css" | "javascript" | "cpp") ||
        "html";

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated) {
            router.push("/auth/login");
            return;
        }
        setReady(true);
    }, [isAuthenticated, isLoading, router]);

    if (isLoading || !ready) {
        return (
            <div className="h-screen w-screen bg-[#1e1e1e] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">
                        Loading Playground...
                    </p>
                </div>
            </div>
        );
    }

    return <IDELayout lessonId={lessonId} initialLanguage={lang} />;
}

export default function PlaygroundPage() {
    return (
        <Suspense
            fallback={
                <div className="h-screen w-screen bg-[#1e1e1e] flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <PlaygroundContent />
        </Suspense>
    );
}
