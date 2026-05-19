"use client";

import { useEffect, useMemo, useState } from "react";
import {
    getNextTypewriterText,
    stripStreamingCursor,
} from "./typewriter";

interface UseTypewriterTextOptions {
    enabled: boolean;
    intervalMs?: number;
}

export function useTypewriterText(
    content: string,
    { enabled, intervalMs = 14 }: UseTypewriterTextOptions,
): string {
    const targetText = useMemo(() => stripStreamingCursor(content), [content]);
    const [visibleText, setVisibleText] = useState(() =>
        enabled ? "" : targetText,
    );

    useEffect(() => {
        if (!enabled) {
            setVisibleText(targetText);
            return;
        }

        setVisibleText((current) =>
            targetText.startsWith(current)
                ? current
                : getNextTypewriterText("", targetText),
        );
    }, [enabled, targetText]);

    useEffect(() => {
        if (!enabled || visibleText === targetText) return;

        const timer = window.setTimeout(() => {
            setVisibleText((current) =>
                getNextTypewriterText(current, targetText),
            );
        }, intervalMs);

        return () => window.clearTimeout(timer);
    }, [enabled, intervalMs, targetText, visibleText]);

    return enabled ? visibleText : targetText;
}
