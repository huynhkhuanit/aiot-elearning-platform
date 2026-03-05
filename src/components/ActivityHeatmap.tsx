"use client";

import { useState, useMemo, useCallback } from "react";
import type { ActivityDay } from "@/types/profile";

interface ActivityHeatmapProps {
    activities: ActivityDay[];
    totalCount: number;
    currentStreak: number;
}

interface DayCell {
    date: Date;
    count: number;
    month: number;
    dateStr: string;
}

// GitHub's exact green contribution colors
const LEVEL_COLORS = [
    "#ebedf0", // 0 - no activity
    "#9be9a8", // 1 - light
    "#40c463", // 2 - medium
    "#30a14e", // 3 - dark
    "#216e39", // 4 - darkest
] as const;

function getLevel(count: number): number {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 9) return 3;
    return 4;
}

export default function ActivityHeatmap({
    activities,
    totalCount,
    currentStreak,
}: ActivityHeatmapProps) {
    const [tooltip, setTooltip] = useState<{
        text: string;
        subtext: string;
        x: number;
        y: number;
    } | null>(null);

    const activityMap = useMemo(() => {
        const map = new Map<string, number>();
        activities.forEach((a) => map.set(a.date, a.count));
        return map;
    }, [activities]);

    // Generate 53 weeks of data (GitHub-style: columns = weeks, rows = days)
    const { weeks, monthLabels } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Start from 52 weeks ago, adjusted to Sunday
        const start = new Date(today);
        start.setDate(start.getDate() - 364);
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);

        const weeks: DayCell[][] = [];
        const monthLabels: { label: string; colIndex: number }[] = [];
        let lastMonth = -1;
        const cursor = new Date(start);

        for (let week = 0; week < 53; week++) {
            const col: DayCell[] = [];
            for (let day = 0; day < 7; day++) {
                const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
                const count = activityMap.get(dateStr) || 0;
                const month = cursor.getMonth();

                // Track month labels at week transitions
                if (day === 0 && month !== lastMonth) {
                    const monthNames = [
                        "Thg 1",
                        "Thg 2",
                        "Thg 3",
                        "Thg 4",
                        "Thg 5",
                        "Thg 6",
                        "Thg 7",
                        "Thg 8",
                        "Thg 9",
                        "Thg 10",
                        "Thg 11",
                        "Thg 12",
                    ];
                    monthLabels.push({
                        label: monthNames[month],
                        colIndex: week,
                    });
                    lastMonth = month;
                }

                col.push({ date: new Date(cursor), count, month, dateStr });
                cursor.setDate(cursor.getDate() + 1);
            }
            weeks.push(col);
        }

        return { weeks, monthLabels };
    }, [activityMap]);

    const handleMouseEnter = useCallback(
        (day: DayCell, e: React.MouseEvent) => {
            if (day.date > new Date()) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const countText =
                day.count === 0
                    ? "Không có hoạt động"
                    : `${day.count} hoạt động`;
            const dateText = day.date.toLocaleDateString("vi-VN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });
            setTooltip({
                text: countText,
                subtext: dateText,
                x: rect.left + rect.width / 2,
                y: rect.top,
            });
        },
        [],
    );

    const handleMouseLeave = useCallback(() => setTooltip(null), []);

    const todayStr = useMemo(() => {
        const t = new Date();
        return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    }, []);

    // Cell size and gap (GitHub uses 11px cells, 2px gap)
    const CELL = 11;
    const GAP = 2;
    const COL_WIDTH = CELL + GAP;
    const DAY_LABEL_WIDTH = 32;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h3 className="text-sm font-medium text-gray-700">
                    {totalCount.toLocaleString("vi-VN")} hoạt động trong năm qua
                </h3>
                {currentStreak > 0 && (
                    <span className="text-sm text-orange-500 font-semibold">
                        🔥 {currentStreak} ngày liên tiếp
                    </span>
                )}
            </div>

            {/* Heatmap */}
            <div
                className="overflow-x-auto pb-1"
                style={{ scrollbarWidth: "none" }}
            >
                <div
                    style={{
                        display: "inline-block",
                        minWidth: "fit-content",
                    }}
                >
                    {/* Month labels */}
                    <div
                        className="relative"
                        style={{
                            height: 15,
                            marginLeft: DAY_LABEL_WIDTH,
                            marginBottom: 4,
                            width: 53 * COL_WIDTH,
                        }}
                    >
                        {monthLabels.map((m, i) => {
                            // Don't render if too close to previous label
                            const prevOffset =
                                i > 0 ? monthLabels[i - 1].colIndex : -4;
                            if (m.colIndex - prevOffset < 3) return null;
                            return (
                                <span
                                    key={`${m.label}-${m.colIndex}`}
                                    className="absolute text-[11px] text-gray-500 select-none"
                                    style={{ left: m.colIndex * COL_WIDTH }}
                                >
                                    {m.label}
                                </span>
                            );
                        })}
                    </div>

                    {/* Grid area */}
                    <div className="flex">
                        {/* Day labels */}
                        <div
                            className="flex flex-col shrink-0"
                            style={{
                                width: DAY_LABEL_WIDTH,
                                gap: GAP,
                            }}
                        >
                            {["", "T2", "", "T4", "", "T6", ""].map(
                                (label, i) => (
                                    <div
                                        key={i}
                                        className="text-[11px] text-gray-500 select-none flex items-center"
                                        style={{ height: CELL }}
                                    >
                                        {label}
                                    </div>
                                ),
                            )}
                        </div>

                        {/* Cells grid */}
                        <div className="flex" style={{ gap: GAP }}>
                            {weeks.map((week, wi) => (
                                <div
                                    key={wi}
                                    className="flex flex-col"
                                    style={{ gap: GAP }}
                                >
                                    {week.map((day, di) => {
                                        const isFuture = day.date > new Date();
                                        const isToday =
                                            day.dateStr === todayStr;
                                        const level = isFuture
                                            ? -1
                                            : getLevel(day.count);

                                        return (
                                            <div
                                                key={di}
                                                onMouseEnter={(e) =>
                                                    handleMouseEnter(day, e)
                                                }
                                                onMouseLeave={handleMouseLeave}
                                                style={{
                                                    width: CELL,
                                                    height: CELL,
                                                    borderRadius: 2,
                                                    backgroundColor:
                                                        level < 0
                                                            ? "transparent"
                                                            : LEVEL_COLORS[
                                                                  level
                                                              ],
                                                    outline: isToday
                                                        ? "2px solid #1d4ed8"
                                                        : undefined,
                                                    outlineOffset: isToday
                                                        ? -1
                                                        : undefined,
                                                    cursor: isFuture
                                                        ? "default"
                                                        : "pointer",
                                                }}
                                                className={
                                                    isFuture
                                                        ? ""
                                                        : "hover:outline hover:outline-1 hover:outline-gray-400 hover:outline-offset-[-1px] transition-[outline] duration-75"
                                                }
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-[11px] text-gray-400 hover:text-indigo-500 cursor-pointer transition-colors">
                    Tìm hiểu cách tính hoạt động
                </span>
                <div className="flex items-center gap-[3px]">
                    <span className="text-[11px] text-gray-500 mr-1">
                        Ít hơn
                    </span>
                    {LEVEL_COLORS.map((color, i) => (
                        <div
                            key={i}
                            style={{
                                width: CELL,
                                height: CELL,
                                borderRadius: 2,
                                backgroundColor: color,
                            }}
                        />
                    ))}
                    <span className="text-[11px] text-gray-500 ml-1">
                        Nhiều hơn
                    </span>
                </div>
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="fixed z-[9999] pointer-events-none"
                    style={{
                        left: tooltip.x,
                        top: tooltip.y - 8,
                        transform: "translate(-50%, -100%)",
                    }}
                >
                    <div className="bg-gray-800 text-white text-[11px] px-3 py-2 rounded-md shadow-xl whitespace-nowrap">
                        <div className="font-semibold">{tooltip.text}</div>
                        <div className="text-gray-300 text-[10px] mt-0.5">
                            {tooltip.subtext}
                        </div>
                    </div>
                    {/* Arrow */}
                    <div
                        className="mx-auto w-0 h-0"
                        style={{
                            borderLeft: "5px solid transparent",
                            borderRight: "5px solid transparent",
                            borderTop: "5px solid #1f2937",
                            width: 0,
                            margin: "0 auto",
                        }}
                    />
                </div>
            )}
        </div>
    );
}
