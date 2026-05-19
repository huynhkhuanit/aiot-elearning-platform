"use client";

import { useEffect, useRef, useState } from "react";
import {
    getNextTypewriterText,
    stripStreamingCursor,
} from "./typewriter";

interface UseTypewriterTextOptions {
    /**
     * When true, the hook reveals `content` character-by-character.
     * When false, the hook still finishes typing whatever it has revealed so
     * far (so the message doesn't visually "snap" when streaming ends), then
     * stays in sync with the target text afterwards.
     */
    enabled: boolean;
    intervalMs?: number;
}

/**
 * Component-level typewriter.
 *
 * Each call uses its own setTimeout chain, so updates from this hook are NOT
 * affected by React 18 automatic batching at the hook caller above. That is
 * the key reason why the typewriter must live at the message-component level
 * and not at the chat-controller level.
 */
export function useTypewriterText(
    content: string,
    { enabled, intervalMs = 28 }: UseTypewriterTextOptions,
): string {
    const targetText = stripStreamingCursor(content);

    // Initialize the visible text:
    //  - If typing is enabled on first render, start from empty string so the
    //    user sees characters appear one-by-one.
    //  - If typing is disabled (e.g. an already-completed history message),
    //    show the full target immediately.
    const [visibleText, setVisibleText] = useState<string>(() =>
        enabled ? "" : targetText,
    );

    // Track whether the typewriter has ever been enabled for this instance.
    // Once it has, we keep typing until we catch up to the target, even if
    // the parent flips `enabled` back to false (e.g. when the stream ends).
    const wasEnabledRef = useRef<boolean>(enabled);
    if (enabled) wasEnabledRef.current = true;

    // Reset visibleText when the target text changes in a way that breaks the
    // prefix relationship (e.g. user starts a brand new message).
    useEffect(() => {
        if (!targetText.startsWith(visibleText)) {
            setVisibleText(targetText.length === 0 ? "" : "");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetText]);

    // Schedule the next character reveal.
    useEffect(() => {
        // If we've never been in streaming mode, just show the target.
        if (!wasEnabledRef.current) {
            if (visibleText !== targetText) setVisibleText(targetText);
            return;
        }

        if (visibleText === targetText) return;

        const timer = window.setTimeout(() => {
            setVisibleText((current) =>
                getNextTypewriterText(current, targetText),
            );
        }, intervalMs);

        return () => window.clearTimeout(timer);
    }, [intervalMs, targetText, visibleText]);

    return visibleText;
}
