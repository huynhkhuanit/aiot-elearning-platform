"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";

interface StreakIndicatorProps {
    isDarkTheme?: boolean;
}

export default function StreakIndicator({
    isDarkTheme = true,
}: StreakIndicatorProps) {
    const [streak, setStreak] = useState(0);
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        const fetchAndUpdateStreak = async () => {
            try {
                // POST to update streak for today
                const postRes = await fetch("/api/gamification/stats", {
                    method: "POST",
                    credentials: "include",
                });
                const postData = await postRes.json();
                if (postData.success) {
                    const newStreak = postData.data.currentStreak;
                    setStreak(newStreak);
                    if (newStreak > 0) {
                        setPulse(true);
                        setTimeout(() => setPulse(false), 1000);
                    }
                }
            } catch (error) {
                console.error("Error updating streak:", error);
            }
        };

        fetchAndUpdateStreak();
    }, []);

    if (streak === 0) return null;

    return (
        <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-semibold transition-all ${
                pulse ? "scale-110" : "scale-100"
            } ${
                isDarkTheme
                    ? "bg-orange-500/10 text-orange-400"
                    : "bg-orange-50 text-orange-600"
            }`}
        >
            <Flame
                className={`w-4 h-4 ${pulse ? "animate-bounce" : ""}`}
                style={{ color: streak >= 7 ? "#ff6b35" : undefined }}
            />
            <span>{streak}</span>
        </div>
    );
}
