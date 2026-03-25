"use client";

interface LevelBadgeProps {
    level: number;
    size?: "sm" | "md";
}

const levelColors: Record<number, { from: string; to: string }> = {
    1: { from: "#6b7280", to: "#9ca3af" },
    2: { from: "#22c55e", to: "#4ade80" },
    3: { from: "#3b82f6", to: "#60a5fa" },
    4: { from: "#8b5cf6", to: "#a78bfa" },
    5: { from: "#f59e0b", to: "#fbbf24" },
    6: { from: "#ef4444", to: "#f87171" },
    7: { from: "#ec4899", to: "#f472b6" },
    8: { from: "#6366f1", to: "#818cf8" },
    9: { from: "#f97316", to: "#fb923c" },
    10: { from: "#fbbf24", to: "#fde68a" },
};

export default function LevelBadge({ level, size = "sm" }: LevelBadgeProps) {
    const colors = levelColors[level] || levelColors[1];
    const sizeClasses =
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

    return (
        <span
            className={`inline-flex items-center rounded-full font-bold text-white ${sizeClasses}`}
            style={{
                background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
            }}
        >
            Lv.{level}
        </span>
    );
}
