"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Trophy, Medal, Flame, TrendingUp, Crown } from "lucide-react";
import LevelBadge from "./LevelBadge";

interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
    totalXp: number;
    level: number;
    currentStreak: number;
}

interface LeaderboardData {
    type: string;
    leaderboard: LeaderboardEntry[];
    currentUser: {
        totalXp: number;
        level: number;
        currentStreak: number;
        rank: number;
    } | null;
}

type TabType = "global" | "weekly" | "monthly";

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: "global", label: "Tổng", icon: <Trophy className="w-3.5 h-3.5" /> },
    {
        key: "weekly",
        label: "Tuần",
        icon: <TrendingUp className="w-3.5 h-3.5" />,
    },
    {
        key: "monthly",
        label: "Tháng",
        icon: <Medal className="w-3.5 h-3.5" />,
    },
];

function getRankBadge(rank: number) {
    if (rank === 1)
        return (
            <span className="text-lg" title="Top 1">
                🥇
            </span>
        );
    if (rank === 2)
        return (
            <span className="text-lg" title="Top 2">
                🥈
            </span>
        );
    if (rank === 3)
        return (
            <span className="text-lg" title="Top 3">
                🥉
            </span>
        );
    return (
        <span className="text-sm font-semibold text-gray-500 w-6 text-center">
            {rank}
        </span>
    );
}

export default function Leaderboard() {
    const [activeTab, setActiveTab] = useState<TabType>("global");
    const [data, setData] = useState<LeaderboardData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = useCallback(async (type: TabType) => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/gamification/leaderboard?type=${type}&limit=10`,
                { credentials: "include" },
            );
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            }
        } catch (error) {
            console.error("Failed to fetch leaderboard:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaderboard(activeTab);
    }, [activeTab, fetchLeaderboard]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-3">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Crown className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">
                        Bảng xếp hạng
                    </h3>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                                activeTab === tab.key
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Leaderboard List */}
            <div className="px-3 pb-3">
                {loading ? (
                    <div className="space-y-2 py-2">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 px-3 py-2.5 animate-pulse"
                            >
                                <div className="w-6 h-6 bg-gray-200 rounded-full" />
                                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="w-24 h-3 bg-gray-200 rounded" />
                                    <div className="w-16 h-2.5 bg-gray-200 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : data?.leaderboard.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        Chưa có dữ liệu xếp hạng
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {data?.leaderboard.map((entry) => (
                            <div
                                key={entry.userId}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                                    entry.rank <= 3
                                        ? "bg-gradient-to-r from-amber-50/60 to-transparent"
                                        : "hover:bg-gray-50"
                                }`}
                            >
                                {getRankBadge(entry.rank)}

                                {/* Avatar */}
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                                    {entry.avatarUrl ? (
                                        <Image
                                            src={entry.avatarUrl}
                                            alt={entry.username}
                                            width={32}
                                            height={32}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        entry.username?.[0]?.toUpperCase() || "?"
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-semibold text-gray-900 truncate">
                                            {entry.fullName || entry.username}
                                        </span>
                                        <LevelBadge
                                            level={entry.level}
                                            size="sm"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span className="font-medium text-indigo-600">
                                            {entry.totalXp.toLocaleString()} XP
                                        </span>
                                        {entry.currentStreak > 0 && (
                                            <span className="flex items-center gap-0.5 text-orange-500">
                                                <Flame className="w-3 h-3" />
                                                {entry.currentStreak}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Current User Footer */}
            {data?.currentUser && data.currentUser.rank > 0 && (
                <div className="border-t border-gray-100 px-5 py-3 bg-indigo-50/50">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-600">
                            Xếp hạng của bạn
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-bold text-indigo-600">
                                #{data.currentUser.rank}
                            </span>
                            <span className="text-gray-500">·</span>
                            <span className="font-medium text-gray-700">
                                {data.currentUser.totalXp.toLocaleString()} XP
                            </span>
                            <LevelBadge
                                level={data.currentUser.level}
                                size="sm"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
