import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const readSource = (...segments: string[]) =>
    readFileSync(join(process.cwd(), ...segments), "utf8");

const targetSources = {
    layout: readSource("src", "app", "admin", "layout.tsx"),
    page: readSource("src", "app", "admin", "page.tsx"),
    loading: readSource("src", "app", "admin", "loading.tsx"),
    lessons: readSource("src", "app", "admin", "lessons", "page.tsx"),
    lessonEdit: readSource(
        "src",
        "app",
        "admin",
        "lessons",
        "[lessonId]",
        "edit",
        "page.tsx",
    ),
    settings: readSource("src", "app", "admin", "settings", "page.tsx"),
    charts: readSource("src", "components", "admin", "AdminCharts.tsx"),
    reviewQueue: readSource(
        "src",
        "components",
        "admin",
        "ProfileReviewQueue.tsx",
    ),
};

test("admin dashboard shell uses the planned light theme surfaces", () => {
    assert.match(targetSources.layout, /min-h-screen bg-slate-50 flex/);
    assert.match(
        targetSources.layout,
        /bg-white border-r border-slate-200/,
    );
    assert.match(
        targetSources.layout,
        /bg-blue-50 text-blue-700 border border-blue-200/,
    );
    assert.match(
        targetSources.page,
        /bg-white border border-slate-200 shadow-sm/,
    );
    assert.match(
        targetSources.page,
        /bg-blue-50 border border-blue-200 rounded-xl/,
    );
    assert.match(
        targetSources.reviewQueue,
        /border border-slate-200 bg-white p-6 shadow-sm/,
    );
});

test("admin dashboard chart palette is calibrated for light mode", () => {
    const chartComponent = readSource("src", "components", "ui", "chart.tsx");

    assert.match(chartComponent, /function ChartContainer/);
    assert.match(targetSources.charts, /@\/components\/ui\/chart/);
    assert.match(targetSources.charts, /<ChartContainer/);
    assert.match(targetSources.charts, /<ChartTooltip/);
    assert.match(targetSources.charts, /<ChartLegend/);
    assert.match(targetSources.charts, /<ChartLegendContent/);
    assert.doesNotMatch(
        readSource("src", "components", "charts", "bar-active.tsx"),
        /~\/components/,
    );
    assert.doesNotMatch(
        readSource("src", "components", "charts", "bar-multiple.tsx"),
        /~\/components/,
    );
    assert.match(
        targetSources.charts,
        /const CHART_COLORS = \["#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af"\]/,
    );
    assert.match(targetSources.charts, /stroke="#e2e8f0"/);
    assert.match(targetSources.charts, /axisLine=\{\{ stroke: "#cbd5e1" \}\}/);
    assert.doesNotMatch(targetSources.charts, /function CustomTooltip/);
});

test("admin lessons and settings pages share the light admin surface system", () => {
    assert.match(targetSources.lessons, /bg-white border border-slate-200/);
    assert.match(targetSources.lessons, /text-slate-900/);
    assert.match(targetSources.lessons, /bg-slate-50/);
    assert.match(targetSources.lessons, /focus:ring-blue-500/);

    assert.match(targetSources.settings, /bg-white border border-slate-200/);
    assert.match(targetSources.settings, /text-slate-900/);
    assert.match(targetSources.settings, /bg-slate-50/);
    assert.match(targetSources.settings, /bg-blue-600 hover:bg-blue-700/);
});

test("admin target files no longer use dark admin theme tokens", () => {
    const combinedSource = Object.entries(targetSources)
        .map(([name, source]) => `\n/* ${name} */\n${source}`)
        .join("\n");

    const forbiddenPatterns = [
        /\bbg-gradient-to-br from-slate-8\d{2}/,
        /\bto-slate-9\d{2}/,
        /\bbg-slate-[89]\d{2}(?:\/\d+)?\b/,
        /\bborder-slate-[78]\d{2}(?:\/\d+)?\b/,
        /\btext-slate-(?:100|200)\b/,
        /\b(?:bg|text|border|hover:bg|hover:border|focus:ring|accent)-indigo-\d{2,3}(?:\/\d+)?\b/,
        /\b(?:bg|text|border|hover:bg|hover:border)-purple-\d{2,3}(?:\/\d+)?\b/,
    ];

    for (const pattern of forbiddenPatterns) {
        assert.doesNotMatch(combinedSource, pattern);
    }
});
