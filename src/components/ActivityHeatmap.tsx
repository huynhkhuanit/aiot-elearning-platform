"use client";

import { useState, useMemo, useCallback, useEffect } from "react";

/* ─── Constants ─── */

const LEVEL_COLORS = [
    "#ebedf0", // 0 — no activity
    "#9be9a8", // 1
    "#40c463", // 2
    "#30a14e", // 3
    "#216e39", // 4
] as const;

const MONTH_LABELS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

const DAY_LABELS: [number, string][] = [
    [1, "Mon"],
    [3, "Wed"],
    [5, "Fri"],
];

function getLevel(count: number, max: number): number {
    if (count === 0 || max === 0) return 0;
    const ratio = count / max;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
}

/* ─── Types ─── */

interface DayCell {
    date: Date;
    dateStr: string;
    count: number;
    level: number;
}

interface ActivityResponse {
    success: boolean;
    data: Record<string, number>;
    totalActivities: number;
    breakdown: Record<string, number>;
    joinedAt: string;
}

interface Props {
    username: string;
}

/* ─── Component ─── */

export default function ActivityHeatmap({ username }: Props) {
    const [dailyCounts, setDailyCounts] = useState<Record<string, number>>({});
    const [totalActivities, setTotalActivities] = useState(0);
    const [joinedYear, setJoinedYear] = useState<number | null>(null);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [tooltip, setTooltip] = useState<{
        text: string;
        sub: string;
        x: number;
        y: number;
    } | null>(null);

    const currentYear = new Date().getFullYear();

    // Fetch activity data
    useEffect(() => {
        const cleanName = username.replace(/^@/, "");
        const yearQuery = selectedYear ? `?year=${selectedYear}` : "";
        setLoaded(false);

        fetch(`/api/profiles/${cleanName}/activity${yearQuery}`)
            .then((r) => r.json())
            .then((json: ActivityResponse) => {
                if (json.success) {
                    setDailyCounts(json.data);
                    setTotalActivities(json.totalActivities);
                    if (json.joinedAt && !joinedYear) {
                        setJoinedYear(new Date(json.joinedAt).getFullYear());
                    }
                }
            })
            .catch(() => {})
            .finally(() => setLoaded(true));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username, selectedYear]);

    // Build year list from joinedYear to current year
    const yearList = useMemo(() => {
        const from = joinedYear ?? currentYear;
        const years: number[] = [];
        for (let y = currentYear; y >= from; y--) {
            years.push(y);
        }
        return years;
    }, [joinedYear, currentYear]);

    // Build grid cells
    const { weeks, monthLabels, maxCount } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let rangeStart: Date;
        let rangeEnd: Date;

        if (selectedYear && selectedYear !== currentYear) {
            rangeStart = new Date(selectedYear, 0, 1);
            rangeEnd = new Date(selectedYear, 11, 31);
        } else if (selectedYear && selectedYear === currentYear) {
            rangeEnd = today;
            rangeStart = new Date(today);
            rangeStart.setFullYear(rangeStart.getFullYear() - 1);
            rangeStart.setDate(rangeStart.getDate() + 1);
        } else {
            // Default: last 12 months
            rangeEnd = today;
            rangeStart = new Date(today);
            rangeStart.setFullYear(rangeStart.getFullYear() - 1);
            rangeStart.setDate(rangeStart.getDate() + 1);
        }

        // Align start to Sunday
        const startDay = rangeStart.getDay();
        const alignedStart = new Date(rangeStart);
        alignedStart.setDate(alignedStart.getDate() - startDay);

        // Calculate max count for level scaling
        const counts = Object.values(dailyCounts);
        const mc = counts.length > 0 ? Math.max(...counts) : 0;

        const weeks: DayCell[][] = [];
        const monthLabelsArr: { label: string; colIndex: number }[] = [];
        let lastMonth = -1;
        const cursor = new Date(alignedStart);

        let weekIdx = 0;
        while (cursor <= rangeEnd || weeks.length === 0) {
            const col: DayCell[] = [];
            for (let d = 0; d < 7; d++) {
                const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
                const count =
                    cursor >= rangeStart && cursor <= rangeEnd
                        ? dailyCounts[dateStr] || 0
                        : -1; // -1 = out of range

                const month = cursor.getMonth();
                if (d === 0 && month !== lastMonth && cursor >= rangeStart) {
                    monthLabelsArr.push({
                        label: MONTH_LABELS[month],
                        colIndex: weekIdx,
                    });
                    lastMonth = month;
                }

                col.push({
                    date: new Date(cursor),
                    dateStr,
                    count,
                    level: count < 0 ? -1 : getLevel(count, mc),
                });
                cursor.setDate(cursor.getDate() + 1);
            }
            weeks.push(col);
            weekIdx++;

            // Safety limit
            if (weeks.length > 55) break;
        }

        return { weeks, monthLabels: monthLabelsArr, maxCount: mc };
    }, [dailyCounts, selectedYear, currentYear]);

    // Handlers
    const handleMouseEnter = useCallback(
        (day: DayCell, e: React.MouseEvent) => {
            if (day.count < 0) return;
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
                sub: dateText,
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

    // Layout constants
    const CELL = 11;
    const GAP = 3;
    const COL_W = CELL + GAP;
    const LABEL_W = 36;

    const headerText = selectedYear
        ? `${totalActivities.toLocaleString("vi-VN")} hoạt động trong năm ${selectedYear}`
        : `${totalActivities.toLocaleString("vi-VN")} hoạt động trong 12 tháng qua`;

    return (
        <div className="w-full rounded-xl border border-gray-200 bg-white p-5">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-sm font-medium text-gray-700">
                    {loaded ? (
                        headerText
                    ) : (
                        <span className="inline-block h-4 w-56 animate-pulse rounded bg-gray-200" />
                    )}
                </h3>
            </div>

            {/* Body: heatmap + year sidebar */}
            <div className="flex gap-4">
                {/* Heatmap */}
                <div
                    className="flex-1 overflow-x-auto pb-1"
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
                                height: 16,
                                marginLeft: LABEL_W,
                                marginBottom: 4,
                                width: weeks.length * COL_W,
                            }}
                        >
                            {monthLabels.map((m, i) => {
                                const prev =
                                    i > 0 ? monthLabels[i - 1].colIndex : -4;
                                if (m.colIndex - prev < 3) return null;
                                return (
                                    <span
                                        key={`${m.label}-${m.colIndex}`}
                                        className="absolute text-[11px] text-gray-500 select-none"
                                        style={{ left: m.colIndex * COL_W }}
                                    >
                                        {m.label}
                                    </span>
                                );
                            })}
                        </div>

                        {/* Grid */}
                        <div className="flex">
                            {/* Day labels */}
                            <div
                                className="flex flex-col shrink-0"
                                style={{ width: LABEL_W, gap: GAP }}
                            >
                                {Array.from({ length: 7 }).map((_, i) => {
                                    const label =
                                        DAY_LABELS.find(
                                            ([idx]) => idx === i,
                                        )?.[1] ?? "";
                                    return (
                                        <div
                                            key={i}
                                            className="text-[11px] text-gray-500 select-none flex items-center"
                                            style={{ height: CELL }}
                                        >
                                            {label}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Cells */}
                            <div
                                className="flex transition-opacity duration-500"
                                style={{ gap: GAP, opacity: loaded ? 1 : 0.4 }}
                            >
                                {weeks.map((week, wi) => (
                                    <div
                                        key={wi}
                                        className="flex flex-col"
                                        style={{ gap: GAP }}
                                    >
                                        {week.map((day, di) => {
                                            const outOfRange = day.count < 0;
                                            const isToday =
                                                day.dateStr === todayStr;

                                            return (
                                                <div
                                                    key={di}
                                                    onMouseEnter={(e) =>
                                                        !outOfRange &&
                                                        handleMouseEnter(day, e)
                                                    }
                                                    onMouseLeave={
                                                        handleMouseLeave
                                                    }
                                                    className={
                                                        outOfRange
                                                            ? ""
                                                            : "transition-colors duration-200"
                                                    }
                                                    style={{
                                                        width: CELL,
                                                        height: CELL,
                                                        borderRadius: 2,
                                                        backgroundColor:
                                                            outOfRange
                                                                ? "transparent"
                                                                : LEVEL_COLORS[
                                                                      day.level
                                                                  ],
                                                        outline:
                                                            isToday &&
                                                            !outOfRange
                                                                ? "2px solid #1d4ed8"
                                                                : undefined,
                                                        outlineOffset: isToday
                                                            ? -1
                                                            : undefined,
                                                        cursor: outOfRange
                                                            ? "default"
                                                            : "pointer",
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer legend */}
                    <div className="flex items-center justify-end mt-3 pt-2 border-t border-gray-100">
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
                </div>

                {/* Year sidebar */}
                <div className="flex flex-col items-end gap-1 shrink-0 pt-5">
                    {yearList.map((year) => {
                        const isActive =
                            selectedYear === year ||
                            (!selectedYear && year === currentYear);
                        return (
                            <button
                                key={year}
                                onClick={() =>
                                    setSelectedYear(
                                        year === currentYear && !selectedYear
                                            ? null
                                            : year === selectedYear
                                              ? null
                                              : year,
                                    )
                                }
                                className={`
                                    px-2 py-0.5 text-[13px] font-medium rounded transition-colors
                                    ${
                                        isActive
                                            ? "text-blue-700 bg-blue-50"
                                            : "text-gray-400 hover:text-gray-700"
                                    }
                                `}
                            >
                                {year}
                            </button>
                        );
                    })}
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
                            {tooltip.sub}
                        </div>
                    </div>
                    <div
                        className="mx-auto"
                        style={{
                            width: 0,
                            height: 0,
                            borderLeft: "5px solid transparent",
                            borderRight: "5px solid transparent",
                            borderTop: "5px solid #1f2937",
                            margin: "0 auto",
                        }}
                    />
                </div>
            )}
        </div>
    );
}
