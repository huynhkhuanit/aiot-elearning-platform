"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLoading from "@/components/PageLoading";

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to home page
        // The modal should be opened through the header button
        router.push("/");
    }, [router]);

    return <PageLoading message="Đang chuyển hướng..." />;
}
