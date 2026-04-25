"use client";

/**
 * Recharts wrapper for the admin dashboard.
 *
 * Recharts (~400KB gzipped) is heavy and only needed on /admin. This file is
 * loaded via `next/dynamic` from `app/admin/page.tsx` so it never enters the
 * shared chunk.
 */

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const CHART_COLORS = ["#818cf8", "#6366f1", "#4f46e5", "#4338ca", "#3730a3"];

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            {payload.map((entry: any, idx: number) => (
                <p key={idx} className="text-sm font-medium text-slate-100">
                    <span style={{ color: entry.color }}>● </span>
                    {entry.name}:{" "}
                    <span className="font-semibold">{entry.value}</span>
                </p>
            ))}
        </div>
    );
}

interface EnrollmentsChartProps {
    data: Array<{ name: string; enrollments: number }>;
}

export function EnrollmentsByCourseChart({ data }: EnrollmentsChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={32}>
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    vertical={false}
                />
                <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#334155" }}
                />
                <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                />
                <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
                />
                <Bar
                    dataKey="enrollments"
                    name="Ghi danh"
                    radius={[6, 6, 0, 0]}
                >
                    {data.map((_, index) => (
                        <Cell
                            key={index}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

interface CourseContentChartProps {
    data: Array<{
        name: string;
        lessons: number;
        published: number;
        content: number;
    }>;
}

export function CourseContentStatsChart({ data }: CourseContentChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={14}>
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    vertical={false}
                />
                <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#334155" }}
                />
                <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                />
                <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
                />
                <Legend
                    wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
                    iconSize={8}
                    iconType="circle"
                />
                <Bar
                    dataKey="lessons"
                    name="Tổng bài"
                    fill="#818cf8"
                    radius={[4, 4, 0, 0]}
                />
                <Bar
                    dataKey="published"
                    name="Đã xuất bản"
                    fill="#34d399"
                    radius={[4, 4, 0, 0]}
                />
                <Bar
                    dataKey="content"
                    name="Có nội dung"
                    fill="#fbbf24"
                    radius={[4, 4, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
