"use client";

import { useEffect, useRef } from "react";

interface UseFollowScrollOptions {
    /**
     * Pixels from the bottom that still count as "user is at the bottom".
     * Slightly larger than 0 because typewriter additions can shift the
     * scrollHeight by a few pixels between checks.
     */
    threshold?: number;
    /**
     * When true, the hook re-attaches to the container — useful if the
     * container element changes after mount (e.g. conditional rendering).
     */
    enabled?: boolean;
}

/**
 * Keep a scroll container pinned to the bottom while its content grows
 * (e.g. while an AI typewriter is revealing characters). The hook respects
 * the user's intent: as soon as they scroll up past the threshold, auto-scroll
 * pauses; once they return to the bottom, it resumes.
 *
 * Usage:
 *   const { containerRef } = useFollowScroll();
 *   <div ref={containerRef} className="overflow-y-auto">…</div>
 */
export function useFollowScroll<T extends HTMLElement>({
    threshold = 80,
    enabled = true,
}: UseFollowScrollOptions = {}) {
    const containerRef = useRef<T | null>(null);
    // Sticky flag — true means "follow new content". Flipped off when the
    // user manually scrolls up, on again when they scroll back to bottom.
    const stickyRef = useRef(true);
    // Track previous scrollTop so we can distinguish "user scrolled up" from
    // "scrollHeight grew because we appended content" (which also shifts the
    // distance-from-bottom even though the user didn't move).
    const lastScrollTopRef = useRef(0);

    useEffect(() => {
        if (!enabled) return;
        const el = containerRef.current;
        if (!el) return;

        // Initial pin: start at bottom.
        const pin = () => {
            el.scrollTop = el.scrollHeight;
            lastScrollTopRef.current = el.scrollTop;
        };
        pin();

        const isNearBottom = () =>
            el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;

        const handleScroll = () => {
            const prev = lastScrollTopRef.current;
            const curr = el.scrollTop;
            lastScrollTopRef.current = curr;

            // Only flip stickiness based on user-initiated scroll.
            // If scrollTop decreased, the user (or wheel/keyboard) moved up.
            if (curr < prev - 1) {
                stickyRef.current = isNearBottom();
            } else if (isNearBottom()) {
                // User scrolled back to (or past) the threshold → re-enable
                // following.
                stickyRef.current = true;
            }
        };

        el.addEventListener("scroll", handleScroll, { passive: true });

        // Watch the container subtree for any DOM mutations. Each typewriter
        // tick mutates a text node inside, which triggers this observer; we
        // then nudge the scroll position to keep the new bottom visible.
        const observer = new MutationObserver(() => {
            if (!stickyRef.current) return;
            // requestAnimationFrame so the layout has updated with the new
            // characters before we read scrollHeight.
            requestAnimationFrame(() => {
                if (!stickyRef.current) return;
                el.scrollTop = el.scrollHeight;
                lastScrollTopRef.current = el.scrollTop;
            });
        });
        observer.observe(el, {
            childList: true,
            characterData: true,
            subtree: true,
        });

        // Also follow when the container itself resizes (e.g. images load,
        // fonts swap).
        const resizeObserver = new ResizeObserver(() => {
            if (!stickyRef.current) return;
            el.scrollTop = el.scrollHeight;
            lastScrollTopRef.current = el.scrollTop;
        });
        resizeObserver.observe(el);

        return () => {
            el.removeEventListener("scroll", handleScroll);
            observer.disconnect();
            resizeObserver.disconnect();
        };
    }, [enabled, threshold]);

    /** Force-scroll to the bottom and re-enable following. */
    const scrollToBottom = () => {
        const el = containerRef.current;
        if (!el) return;
        stickyRef.current = true;
        el.scrollTop = el.scrollHeight;
        lastScrollTopRef.current = el.scrollTop;
    };

    return { containerRef, scrollToBottom };
}
