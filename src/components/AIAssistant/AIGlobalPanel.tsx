"use client";

import { useState, useEffect, useCallback } from "react";
import { Bot, X, Minimize2, Maximize2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AIAgentPanel from "./AIAgentPanel";

/**
 * Global floating AI Agent Panel accessible from any page.
 * Only visible to authenticated users.
 */
export default function AIGlobalPanel() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen]);

    // Toggle panel
    const togglePanel = useCallback(() => {
        if (isOpen && isMinimized) {
            setIsMinimized(false);
        } else {
            setIsOpen(!isOpen);
            setIsMinimized(false);
        }
    }, [isOpen, isMinimized]);

    // Keyboard shortcut: Ctrl+Shift+A
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === "A") {
                e.preventDefault();
                togglePanel();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [togglePanel]);

    // Don't render for unauthenticated users
    if (authLoading || !isAuthenticated) return null;

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={togglePanel}
                className={`fixed bottom-6 right-6 z-[9998] w-13 h-13 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-300 group ${
                    isOpen
                        ? "bg-gray-700 hover:bg-gray-600 scale-90"
                        : "bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 scale-100 hover:scale-105"
                }`}
                title={
                    isOpen
                        ? "Close AI Agent (Ctrl+Shift+A)"
                        : "Open AI Agent (Ctrl+Shift+A)"
                }
                aria-label="AI Agent"
                style={{ width: 52, height: 52 }}
            >
                {isOpen ? (
                    <X className="w-5 h-5 text-white" />
                ) : (
                    <>
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 8V4H8" />
                            <rect width="16" height="12" x="4" y="8" rx="2" />
                            <path d="m2 14 6-6" />
                            <path d="m14 16 6-6" />
                        </svg>
                        {/* Pulse animation */}
                        <span className="absolute inset-0 rounded-2xl bg-cyan-400 animate-ping opacity-15 group-hover:opacity-0" />
                    </>
                )}
            </button>

            {/* Agent Panel */}
            {isOpen && (
                <div
                    className={`fixed right-6 z-[9997] bg-[#1e1e2e] rounded-xl shadow-2xl border border-[#3d3d55] overflow-hidden transition-all duration-300 ${
                        isMinimized
                            ? "bottom-24 w-80 h-12"
                            : isExpanded
                              ? "bottom-24 w-[440px] h-[calc(100vh-120px)]"
                              : "bottom-24 w-[400px] h-[560px]"
                    }`}
                >
                    {isMinimized ? (
                        /* Minimized bar */
                        <button
                            onClick={() => setIsMinimized(false)}
                            className="w-full h-full flex items-center justify-between px-4 hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                    <Bot className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm font-medium text-gray-200">
                                    AI Agent
                                </span>
                            </div>
                            <Maximize2 className="w-4 h-4 text-gray-400" />
                        </button>
                    ) : (
                        /* Full panel */
                        <div className="flex flex-col h-full">
                            {/* Panel controls */}
                            <div className="flex items-center justify-end px-2 py-1 border-b border-[#3d3d55] bg-[#1a1a2e]">
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="p-1 rounded hover:bg-white/10 text-gray-400 transition-colors"
                                    title={isExpanded ? "Collapse" : "Expand"}
                                >
                                    {isExpanded ? (
                                        <Minimize2 className="w-3.5 h-3.5" />
                                    ) : (
                                        <Maximize2 className="w-3.5 h-3.5" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setIsMinimized(true)}
                                    className="p-1 rounded hover:bg-white/10 text-gray-400 transition-colors"
                                    title="Minimize"
                                >
                                    <Minimize2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 rounded hover:bg-white/10 text-gray-400 transition-colors"
                                    title="Close"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Agent content */}
                            <div className="flex-1 min-h-0">
                                <AIAgentPanel theme="dark" />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
