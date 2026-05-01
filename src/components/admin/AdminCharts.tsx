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
    XAxis,
    YAxis,
} from "recharts";
import {
    type ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

const CHART_COLORS = ["#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af"];

interface EnrollmentsChartProps {
    data: Array<{ name: string; enrollments: number }>;
}

const enrollmentsChartConfig = {
    enrollments: {
        label: "Ghi danh",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig;

const courseContentChartConfig = {
    lessons: {
        label: "Tổng bài",
        color: "var(--chart-3)",
    },
    published: {
        label: "Đã xuất bản",
        color: "var(--chart-1)",
    },
    content: {
        label: "Có nội dung",
        color: "var(--chart-5)",
    },
} satisfies ChartConfig;

export function EnrollmentsByCourseChart({ data }: EnrollmentsChartProps) {
    return (
        <ChartContainer
            config={enrollmentsChartConfig}
            className="h-full w-full"
        >
            <BarChart data={data} barSize={32}>
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    vertical={false}
                />
                <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#cbd5e1" }}
                />
                <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                />
                <ChartTooltip
                    content={
                        <ChartTooltipContent
                            hideLabel
                            className="border-slate-200 bg-white shadow-lg"
                        />
                    }
                    cursor={{ fill: "rgba(37, 99, 235, 0.06)" }}
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
        </ChartContainer>
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
        <ChartContainer
            config={courseContentChartConfig}
            className="h-full w-full"
        >
            <BarChart data={data} barSize={14}>
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    vertical={false}
                />
                <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#cbd5e1" }}
                />
                <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                />
                <ChartTooltip
                    content={
                        <ChartTooltipContent
                            indicator="dashed"
                            className="border-slate-200 bg-white shadow-lg"
                        />
                    }
                    cursor={{ fill: "rgba(37, 99, 235, 0.06)" }}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                    dataKey="lessons"
                    name="Tổng bài"
                    fill="var(--color-lessons)"
                    radius={[4, 4, 0, 0]}
                />
                <Bar
                    dataKey="published"
                    name="Đã xuất bản"
                    fill="var(--color-published)"
                    radius={[4, 4, 0, 0]}
                />
                <Bar
                    dataKey="content"
                    name="Có nội dung"
                    fill="var(--color-content)"
                    radius={[4, 4, 0, 0]}
                />
            </BarChart>
        </ChartContainer>
    );
}
