"use client";

import { Files, Search, Bot, Settings } from "lucide-react";
import type { ActivityView } from "./useIDEState";

interface ActivityBarProps {
    activeView: ActivityView;
    onToggleView: (view: ActivityView) => void;
    agentOpen: boolean;
    hideAIAgent?: boolean;
}

export default function ActivityBar({
    activeView,
    onToggleView,
    agentOpen,
    hideAIAgent,
}: ActivityBarProps) {
    const allItems: { id: ActivityView; icon: typeof Files; label: string }[] =
        [
            { id: "explorer", icon: Files, label: "Explorer" },
            { id: "search", icon: Search, label: "Search" },
            { id: "ai", icon: Bot, label: "AI Agent" },
        ];

    const items = hideAIAgent
        ? allItems.filter((i) => i.id !== "ai")
        : allItems;

    return (
        <div className="ide-activitybar">
            <div className="flex flex-col items-center gap-0 flex-1">
                {items.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onToggleView(item.id)}
                        className={`${
                            item.id === "ai"
                                ? agentOpen
                                    ? "active"
                                    : ""
                                : activeView === item.id
                                  ? "active"
                                  : ""
                        }`}
                        title={item.label}
                    >
                        <item.icon className="w-5 h-5" />
                    </button>
                ))}
            </div>
            <div className="pb-2">
                <button
                    className="w-[48px] h-[48px] flex items-center justify-center text-[var(--ide-text-muted)] hover:text-[var(--ide-text)] transition-colors"
                    title="Settings"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
