"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import AITutorPanel from "./AITutorPanel";

export default function AITutorFAB() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showPulse, setShowPulse] = useState(true);

    // Stop pulse after first open
    useEffect(() => {
        if (isOpen && showPulse) {
            setShowPulse(false);
        }
    }, [isOpen, showPulse]);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen]);

    const togglePanel = useCallback(() => {
        if (isOpen && isMinimized) {
            setIsMinimized(false);
            return;
        }
        setIsOpen((v) => !v);
        setIsMinimized(false);
    }, [isOpen, isMinimized]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.shiftKey && event.key === "T") {
                event.preventDefault();
                togglePanel();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [togglePanel]);

    if (authLoading || !isAuthenticated) return null;

    return (
        <>
            {/* FAB Button */}
            <button
                type="button"
                onClick={togglePanel}
                className={cn(
                    "group fixed bottom-6 right-6 z-[9998] flex size-12 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105",
                    isOpen
                        ? "bg-zinc-900 border border-zinc-700 text-zinc-300"
                        : "bg-emerald-600 text-white hover:bg-emerald-500",
                    showPulse && !isOpen && "animate-pulse",
                )}
                title={
                    isOpen
                        ? "Đóng AI Tutor (Ctrl+Shift+T)"
                        : "AI Tutor (Ctrl+Shift+T)"
                }
                aria-label="AI Tutor"
            >
                {isOpen ? (
                    <X className="size-5" />
                ) : (
                    <Sparkles className="size-5" />
                )}
            </button>

            {/* Panel */}
            {isOpen && (
                <div
                    className={cn(
                        "fixed right-6 z-[9997] overflow-hidden rounded-2xl border shadow-2xl transition-all duration-300",
                        "bg-zinc-950 border-zinc-800",
                        isMinimized
                            ? "bottom-22 h-16 w-80"
                            : isExpanded
                              ? "bottom-22 h-[calc(100vh-7rem)] w-[30rem]"
                              : "bottom-22 h-[40rem] w-[26rem]",
                    )}
                >
                    {isMinimized ? (
                        <button
                            type="button"
                            onClick={() => setIsMinimized(false)}
                            className="flex h-full w-full items-center justify-between px-4 text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-full bg-emerald-600 text-white">
                                    <Sparkles className="size-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-zinc-100">
                                        AI Tutor
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        Nhấn để tiếp tục
                                    </p>
                                </div>
                            </div>
                            <Maximize2 className="size-4 text-zinc-500" />
                        </button>
                    ) : (
                        <div className="flex h-full flex-col">
                            {/* Window controls */}
                            <div className="flex items-center justify-end gap-1 border-b border-zinc-800 px-3 py-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsExpanded((v) => !v)}
                                    className="size-7 rounded-lg text-zinc-500"
                                    title={isExpanded ? "Thu gọn" : "Mở rộng"}
                                >
                                    {isExpanded ? (
                                        <Minimize2 className="size-3.5" />
                                    ) : (
                                        <Maximize2 className="size-3.5" />
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsMinimized(true)}
                                    className="size-7 rounded-lg text-zinc-500"
                                    title="Thu nhỏ"
                                >
                                    <Minimize2 className="size-3.5" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="size-7 rounded-lg text-zinc-500"
                                    title="Đóng"
                                >
                                    <X className="size-3.5" />
                                </Button>
                            </div>

                            <div className="min-h-0 flex-1">
                                <AITutorPanel
                                    className="h-full rounded-none border-0"
                                    theme="dark"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
