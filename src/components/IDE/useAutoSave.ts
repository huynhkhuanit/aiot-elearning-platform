"use client";

import { useState, useEffect, useRef } from "react";
import type { CodeState } from "./useIDEState";

const SAVE_KEY_PREFIX = "ide_playground_";

export function useAutoSave(code: CodeState, lessonId: string) {
    const [status, setStatus] = useState<"saved" | "saving" | "">("");
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const statusTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setStatus("saving");

        timerRef.current = setTimeout(() => {
            try {
                const key = `${SAVE_KEY_PREFIX}code_${lessonId || "scratch"}`;
                localStorage.setItem(key, JSON.stringify(code));
                setStatus("saved");
                if (statusTimerRef.current)
                    clearTimeout(statusTimerRef.current);
                statusTimerRef.current = setTimeout(() => setStatus(""), 2000);
            } catch {
                setStatus("");
            }
        }, 1000);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
        };
    }, [code, lessonId]);

    return status;
}
