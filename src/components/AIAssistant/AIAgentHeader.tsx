"use client";

import { useState, useRef, useEffect } from "react";
import {
    Plus,
    History,
    ChevronDown,
    Zap,
    MessageCircle,
    Wifi,
    WifiOff,
    Loader2,
} from "lucide-react";
import type { AIServerStatus, AIAgentMode, AIModel } from "./types";
import { AI_MODELS, AI_MODE_CONFIG } from "./types";

interface AIAgentHeaderProps {
    onNewChat: () => void;
    onToggleHistory: () => void;
    showHistory: boolean;
    aiStatus: AIServerStatus;
    theme?: "light" | "dark";
    mode: AIAgentMode;
    onModeChange: (mode: AIAgentMode) => void;
    selectedModel: AIModel;
    onModelChange: (model: AIModel) => void;
}

const MODE_ICONS: Record<
    AIAgentMode,
    React.ComponentType<{ className?: string }>
> = {
    agent: Zap,
    ask: MessageCircle,
};

export default function AIAgentHeader({
    onNewChat,
    onToggleHistory,
    showHistory,
    aiStatus,
    theme = "dark",
    mode,
    onModeChange,
    selectedModel,
    onModelChange,
}: AIAgentHeaderProps) {
    const isDark = theme === "dark";
    const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setModelDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div
            className={`border-b ${
                isDark ? "border-[#2d2d44]" : "border-gray-200"
            }`}
        >
            {/* Row 1: Model selector + Actions */}
            <div
                className={`flex items-center justify-between px-3 py-2 ${
                    isDark ? "bg-[#16162a]" : "bg-gray-50"
                }`}
            >
                {/* Model Selector */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            isDark
                                ? "hover:bg-white/[0.06] text-gray-200"
                                : "hover:bg-gray-100 text-gray-700"
                        }`}
                    >
                        {/* Status dot */}
                        <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                aiStatus === "connected"
                                    ? "bg-emerald-400"
                                    : aiStatus === "checking"
                                      ? "bg-amber-400 animate-pulse"
                                      : "bg-red-400"
                            }`}
                        />
                        <span>{selectedModel.name}</span>
                        <ChevronDown
                            className={`w-3 h-3 transition-transform ${
                                modelDropdownOpen ? "rotate-180" : ""
                            } ${isDark ? "text-gray-500" : "text-gray-400"}`}
                        />
                    </button>

                    {/* Dropdown */}
                    {modelDropdownOpen && (
                        <div
                            className={`absolute top-full left-0 mt-1 w-56 rounded-xl border shadow-xl z-50 overflow-hidden ${
                                isDark
                                    ? "bg-[#1e1e34] border-[#3d3d55]"
                                    : "bg-white border-gray-200"
                            }`}
                        >
                            <div
                                className={`px-3 py-2 text-[10px] uppercase tracking-wider font-medium ${
                                    isDark ? "text-gray-500" : "text-gray-400"
                                }`}
                            >
                                Select Model
                            </div>
                            {AI_MODELS.map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => {
                                        onModelChange(model);
                                        setModelDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer ${
                                        model.id === selectedModel.id
                                            ? isDark
                                                ? "bg-cyan-500/10 text-cyan-300"
                                                : "bg-blue-50 text-blue-700"
                                            : isDark
                                              ? "text-gray-300 hover:bg-white/[0.06]"
                                              : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                            {model.name}
                                        </span>
                                    </div>
                                    <span
                                        className={`text-[10px] ${
                                            isDark
                                                ? "text-gray-500"
                                                : "text-gray-400"
                                        }`}
                                    >
                                        {model.provider}
                                    </span>
                                </button>
                            ))}

                            {/* Connection status */}
                            <div
                                className={`flex items-center gap-1.5 px-3 py-2 border-t text-[10px] ${
                                    isDark
                                        ? "border-[#3d3d55] text-gray-500"
                                        : "border-gray-100 text-gray-400"
                                }`}
                            >
                                {aiStatus === "connected" ? (
                                    <Wifi className="w-3 h-3 text-emerald-400" />
                                ) : aiStatus === "checking" ? (
                                    <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                                ) : (
                                    <WifiOff className="w-3 h-3 text-red-400" />
                                )}
                                <span>
                                    {aiStatus === "connected"
                                        ? "Connected"
                                        : aiStatus === "checking"
                                          ? "Connecting..."
                                          : "Disconnected"}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={onToggleHistory}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            showHistory
                                ? isDark
                                    ? "bg-cyan-500/15 text-cyan-400"
                                    : "bg-blue-100 text-blue-600"
                                : isDark
                                  ? "hover:bg-white/[0.06] text-gray-400"
                                  : "hover:bg-gray-200 text-gray-500"
                        }`}
                        title="Chat History"
                    >
                        <History className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={onNewChat}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDark
                                ? "hover:bg-white/[0.06] text-gray-400 hover:text-gray-200"
                                : "hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                        }`}
                        title="New Chat"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Row 2: Mode Tabs */}
            <div
                className={`flex items-center px-2 py-1 gap-0.5 ${
                    isDark ? "bg-[#1a1a2e]" : "bg-white"
                }`}
            >
                {(Object.keys(AI_MODE_CONFIG) as AIAgentMode[]).map((m) => {
                    const Icon = MODE_ICONS[m];
                    const config = AI_MODE_CONFIG[m];
                    const isActive = mode === m;
                    const accent = config.accent; // amber | blue

                    return (
                        <button
                            key={m}
                            onClick={() => onModeChange(m)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                                isActive
                                    ? accent === "amber"
                                        ? isDark
                                            ? "bg-amber-500/15 text-amber-400 shadow-sm border border-amber-500/20"
                                            : "bg-amber-50 text-amber-700 shadow-sm border border-amber-200"
                                        : isDark
                                          ? "bg-blue-500/15 text-blue-400 shadow-sm border border-blue-500/20"
                                          : "bg-blue-50 text-blue-700 shadow-sm border border-blue-200"
                                    : isDark
                                      ? "text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]"
                                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                            }`}
                            title={config.description}
                        >
                            <Icon className="w-3 h-3" />
                            <span>{config.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
