"use client";

import { ReactNode } from "react";
import { LearnCourseProvider } from "@/contexts/LearnCourseContext";
import { AITutorProvider } from "@/contexts/AITutorContext";

export default function LearnCourseLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <LearnCourseProvider>
            <AITutorProvider>{children}</AITutorProvider>
        </LearnCourseProvider>
    );
}
