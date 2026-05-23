"use client";

import DevModeIDE from "./IDE/DevModeIDE";
import type { LanguageId } from "./CodePlayground/languages";

interface CodePlaygroundProps {
    isOpen: boolean;
    onClose: () => void;
    lessonId: string;
    initialLanguage?: LanguageId;
    sidebarOpen: boolean;
}

export default function CodePlayground({
    isOpen,
    onClose,
    lessonId,
    initialLanguage = "html",
    sidebarOpen,
}: CodePlaygroundProps) {
    if (!isOpen) return null;

    return (
        <div
            className={`fixed top-0 bottom-0 right-0 z-[60] w-full md:w-[45vw] lg:w-[40vw] bg-[var(--ide-bg)] shadow-2xl flex flex-col border-l border-[var(--ide-border)] animate-in slide-in-from-right duration-300`}
        >
            <div className="flex-1 overflow-hidden relative w-full h-full">
                <DevModeIDE
                    lessonId={lessonId}
                    initialLanguage={initialLanguage}
                    onClose={onClose}
                />
            </div>
        </div>
    );
}
