"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { IDELayout } from "@/components/IDE";
import PageLoading from "@/components/PageLoading";

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
        return <PageLoading message="Loading Playground..." bg="dark" />;
    }

    return <IDELayout lessonId={lessonId} initialLanguage={lang} />;
}

export default function PlaygroundPage() {
    return (
        <Suspense fallback={<PageLoading bg="dark" />}>
            <PlaygroundContent />
        </Suspense>
    );
}
