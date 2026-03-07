"use client";

import { useState, useEffect, useCallback } from "react";
import { Bot, Maximize2, Minimize2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import AIAgentPanel from "./AIAgentPanel";

export default function AIGlobalPanel() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

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

        setIsOpen((value) => !value);
        setIsMinimized(false);
    }, [isOpen, isMinimized]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.shiftKey && event.key === "A") {
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
            <button
                type="button"
                onClick={togglePanel}
                className={cn(
                    "group fixed bottom-6 right-6 z-[9998] flex h-14 w-14 items-center justify-center rounded-3xl border border-white/15 bg-zinc-950 text-white shadow-[0_20px_40px_-20px_rgba(14,165,233,0.65)] transition-transform duration-200 hover:-translate-y-0.5",
                    !isOpen &&
                        "bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500",
                )}
                title={isOpen ? "Đóng trợ lý AI (Ctrl+Shift+A)" : "Mở trợ lý AI (Ctrl+Shift+A)"}
                aria-label="AI Agent"
            >
                {isOpen ? (
                    <X className="size-5" />
                ) : (
                    <>
                        <Bot className="size-5" />
                        <span className="absolute inset-0 rounded-3xl bg-white/20 opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
                    </>
                )}
            </button>

            {isOpen && (
                <div
                    className={cn(
                        "fixed right-6 z-[9997] overflow-hidden rounded-[36px] border border-white/10 bg-black/70 shadow-[0_35px_90px_-45px_rgba(15,23,42,0.95)] backdrop-blur-2xl transition-all duration-300",
                        isMinimized
                            ? "bottom-24 h-20 w-[22rem]"
                            : isExpanded
                              ? "bottom-24 h-[calc(100vh-7rem)] w-[30rem]"
                              : "bottom-24 h-[42rem] w-[27rem]",
                    )}
                >
                    {isMinimized ? (
                        <button
                            type="button"
                            onClick={() => setIsMinimized(false)}
                            className="flex h-full w-full items-center justify-between px-5 text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex size-11 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-white shadow-lg">
                                    <Bot className="size-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">
                                        Trợ lý AI toàn cục
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-400">
                                        Tiếp tục cuộc trò chuyện gần nhất
                                    </p>
                                </div>
                            </div>
                            <Maximize2 className="size-4 text-zinc-400" />
                        </button>
                    ) : (
                        <div className="flex h-full flex-col">
                            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-white">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 shadow-lg">
                                        <Bot className="size-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium">
                                                Trợ lý AI toàn cục
                                            </p>
                                            <Badge className="rounded-full border-0 bg-white/10 px-2 py-0.5 text-[10px] text-zinc-200">
                                                <Sparkles className="size-3" />
                                                AI
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-xs text-zinc-400">
                                            Dùng Ctrl+Shift+A để bật hoặc tắt ở mọi nơi
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => setIsExpanded((value) => !value)}
                                        className="rounded-full text-zinc-300 hover:bg-white/10 hover:text-white"
                                        title={isExpanded ? "Thu gọn" : "Mở rộng"}
                                    >
                                        {isExpanded ? (
                                            <Minimize2 className="size-4" />
                                        ) : (
                                            <Maximize2 className="size-4" />
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => setIsMinimized(true)}
                                        className="rounded-full text-zinc-300 hover:bg-white/10 hover:text-white"
                                        title="Thu nhỏ"
                                    >
                                        <Minimize2 className="size-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => setIsOpen(false)}
                                        className="rounded-full text-zinc-300 hover:bg-white/10 hover:text-white"
                                        title="Đóng"
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="min-h-0 flex-1 p-4">
                                <AIAgentPanel className="h-full rounded-[28px]" theme="dark" />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
