"use client";

import { X, FileCode, FileType, Braces } from "lucide-react";
import type { LanguageType } from "./useIDEState";

interface TabBarProps {
    activeTab: LanguageType;
    onTabChange: (tab: LanguageType) => void;
}

const TABS: { id: LanguageType; label: string; icon: string; color: string }[] =
    [
        { id: "html", label: "index.html", icon: "html", color: "#e44d26" },
        { id: "css", label: "style.css", icon: "css", color: "#264de4" },
        { id: "javascript", label: "app.js", icon: "js", color: "#f7df1e" },
        { id: "cpp", label: "main.cpp", icon: "cpp", color: "#649ad2" },
    ];

function FileIcon({ type, color }: { type: string; color: string }) {
    return (
        <span className="text-[11px] font-bold font-mono" style={{ color }}>
            {type === "html"
                ? "H"
                : type === "css"
                  ? "C"
                  : type === "js"
                    ? "JS"
                    : "C+"}
        </span>
    );
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
    return (
        <div className="ide-tabbar">
            {TABS.map((tab) => (
                <div
                    key={tab.id}
                    className={`ide-tab ${activeTab === tab.id ? "active" : ""}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    <FileIcon type={tab.icon} color={tab.color} />
                    <span>{tab.label}</span>
                    <div
                        className="tab-close"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <X className="w-3 h-3" />
                    </div>
                </div>
            ))}
        </div>
    );
}
