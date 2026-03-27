"use client";

import { useState, useEffect, useCallback } from "react";
import { BotMessageSquare, Maximize2, Minimize2, X, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import AITutorPanel from "./AITutorPanel";

export default function AITutorFAB() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isOpen) setIsOpen(false);
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
        <TooltipProvider>
            {/* ═══ FAB Button ═══ */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant={isOpen ? "ghost" : "default"}
                        size="icon-lg"
                        onClick={togglePanel}
                        className="fixed bottom-20 right-6 z-[9998] rounded-full shadow-md border-0"
                        aria-label="AI Tutor"
                    >
                        {isOpen ? (
                            <X className="size-5" />
                        ) : (
                            <BotMessageSquare className="size-5" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                    {isOpen ? "Đóng" : "AI Tutor"}{" "}
                    <kbd className="ml-1 rounded bg-zinc-700 px-1 py-0.5 text-[9px] text-zinc-300">
                        Ctrl+Shift+T
                    </kbd>
                </TooltipContent>
            </Tooltip>

            {/* ═══ Panel ═══ */}
            {isOpen && (
                <div
                    className={cn(
                        "fixed right-6 z-[9997] overflow-hidden rounded-2xl border-0 shadow-2xl transition-all duration-300",
                        "bg-zinc-950",
                        isMinimized
                            ? "bottom-[7.5rem] h-14 w-80"
                            : isExpanded
                              ? "bottom-[7.5rem] h-[calc(100vh-7rem)] w-[30rem]"
                              : "bottom-[7.5rem] h-[40rem] w-[26rem]",
                    )}
                >
                    {isMinimized ? (
                        <button
                            type="button"
                            onClick={() => setIsMinimized(false)}
                            className="flex h-full w-full items-center justify-between px-4 text-left transition-colors hover:bg-zinc-900"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15">
                                    <BotMessageSquare className="size-4 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-zinc-100">
                                        AI Tutor
                                    </p>
                                    <p className="text-[11px] text-zinc-500">
                                        Nhấn để tiếp tục
                                    </p>
                                </div>
                            </div>
                            <Maximize2 className="size-3.5 text-zinc-600" />
                        </button>
                    ) : (
                        <div className="flex h-full flex-col">
                            {/* Window Controls */}
                            <div className="flex items-center justify-end gap-0.5 px-2 py-1.5">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                setIsExpanded((v) => !v)
                                            }
                                            className="size-6 rounded-md text-zinc-600 hover:text-zinc-300"
                                        >
                                            {isExpanded ? (
                                                <Minimize2 className="size-3" />
                                            ) : (
                                                <Maximize2 className="size-3" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        {isExpanded ? "Thu gọn" : "Mở rộng"}
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setIsMinimized(true)}
                                            className="size-6 rounded-md text-zinc-600 hover:text-zinc-300"
                                        >
                                            <Minus className="size-3" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        Thu nhỏ
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setIsOpen(false)}
                                            className="size-6 rounded-md text-zinc-600 hover:text-zinc-300"
                                        >
                                            <X className="size-3" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        Đóng
                                    </TooltipContent>
                                </Tooltip>
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
        </TooltipProvider>
    );
}
