"use client";

import { type CSSProperties, useEffect, useState } from "react";
import {
    ArrowRight,
    Check,
    Code2,
    Copy,
    Flag,
    Hexagon,
    Image,
    Monitor,
    RotateCcw,
    Scissors,
    Shuffle,
    Sparkles,
    Square,
    Ticket,
    Wand2,
    type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ClipPathPresetId =
    | "diagonal"
    | "hexagon"
    | "chevron"
    | "ticket"
    | "ribbon";
type ControlKey = "depth" | "balance" | "inset";
type PreviewMode = "hero" | "card" | "media";
type CodeFormat = "css" | "tailwind" | "jsx";

type ControlValues = Record<ControlKey, number>;
type ControlConfig = {
    label: string;
    description: string;
    min: number;
    max: number;
    step: number;
};
type Point = [number, number];
type ClipPathPreset = {
    id: ClipPathPresetId;
    name: string;
    summary: string;
    bestFor: [string, string, string];
    icon: LucideIcon;
    defaults: ControlValues;
    controls: Record<ControlKey, ControlConfig>;
    generate: (values: ControlValues) => Point[];
};

const previewStats = [
    { label: "Preset sẵn", value: "5" },
    { label: "Bối cảnh preview", value: "3" },
    { label: "Định dạng code", value: "3" },
];

const clipPathPresets: ClipPathPreset[] = [
    {
        id: "diagonal",
        name: "Diagonal",
        summary: "Khối cắt chéo nhanh cho hero, CTA hoặc banner nổi bật.",
        bestFor: ["Hero landing", "CTA block", "Promo banner"],
        icon: Scissors,
        defaults: { depth: 22, balance: 8, inset: 6 },
        controls: {
            depth: {
                label: "Độ cắt đáy",
                description: "Tăng độ dốc ở cạnh dưới bên trái.",
                min: 8,
                max: 34,
                step: 1,
            },
            balance: {
                label: "Độ hạ đỉnh trái",
                description: "Điều chỉnh điểm bắt đầu của đường chéo phía trên.",
                min: 0,
                max: 18,
                step: 1,
            },
            inset: {
                label: "Độ nâng cạnh phải",
                description: "Làm gọn góc dưới bên phải để cân bố cục.",
                min: 0,
                max: 18,
                step: 1,
            },
        },
        generate: ({ depth, balance, inset }) => [
            [0, balance],
            [100, 0],
            [100, 100 - inset],
            [0, 100 - depth],
        ],
    },
    {
        id: "hexagon",
        name: "Hexagon",
        summary: "Lục giác mềm phù hợp card tính năng và nhãn nội dung.",
        bestFor: ["Feature card", "Thumbnail", "Info tile"],
        icon: Hexagon,
        defaults: { depth: 16, balance: 0, inset: 4 },
        controls: {
            depth: {
                label: "Độ vát cạnh",
                description: "Điều khiển chiều sâu của hai cạnh chéo bên hông.",
                min: 8,
                max: 24,
                step: 1,
            },
            balance: {
                label: "Cân tâm",
                description: "Dịch điểm giữa lên hoặc xuống để đổi trọng tâm.",
                min: -12,
                max: 12,
                step: 1,
            },
            inset: {
                label: "Khoảng lùi",
                description: "Tăng khoảng thở để shape bớt gắt trên mobile.",
                min: 0,
                max: 12,
                step: 1,
            },
        },
        generate: ({ depth, balance, inset }) => {
            const shoulder = clamp(depth + inset, 8, 32);
            const center = clamp(50 + balance, 35, 65);

            return [
                [shoulder, 0],
                [100 - shoulder, 0],
                [100, center],
                [100 - shoulder, 100],
                [shoulder, 100],
                [0, center],
            ];
        },
    },
    {
        id: "chevron",
        name: "Chevron",
        summary: "Mũi tên phải phù hợp khối chuyển hướng hoặc bước tiếp theo.",
        bestFor: ["Next step", "Process card", "Highlight panel"],
        icon: ArrowRight,
        defaults: { depth: 22, balance: 0, inset: 6 },
        controls: {
            depth: {
                label: "Độ nhọn",
                description: "Tăng chiều sâu mũi nhọn ở cạnh phải.",
                min: 10,
                max: 28,
                step: 1,
            },
            balance: {
                label: "Lệch tâm",
                description: "Kéo tâm mũi tên lên hoặc xuống để hợp nội dung.",
                min: -16,
                max: 16,
                step: 1,
            },
            inset: {
                label: "Độ vát đầu",
                description: "Làm mềm cạnh trái để shape gọn hơn khi đặt text.",
                min: 0,
                max: 16,
                step: 1,
            },
        },
        generate: ({ depth, balance, inset }) => {
            const center = clamp(50 + balance, 34, 66);
            const inner = clamp(Math.round(depth * 0.72), 8, 24);

            return [
                [0, inset],
                [100 - depth, 0],
                [100, center],
                [100 - depth, 100],
                [0, 100 - inset],
                [inner, center],
            ];
        },
    },
    {
        id: "ticket",
        name: "Ticket",
        summary: "Khối vé có rãnh hai bên cho coupon, nhãn hoặc teaser card.",
        bestFor: ["Coupon", "Pricing teaser", "Event badge"],
        icon: Ticket,
        defaults: { depth: 12, balance: 0, inset: 5 },
        controls: {
            depth: {
                label: "Độ sâu rãnh",
                description: "Điều chỉnh độ lõm ở hai cạnh giữa.",
                min: 8,
                max: 20,
                step: 1,
            },
            balance: {
                label: "Cân thân",
                description: "Dịch vị trí rãnh lên hoặc xuống để cân chữ.",
                min: -12,
                max: 12,
                step: 1,
            },
            inset: {
                label: "Vát góc",
                description: "Làm sạch bốn góc để nhìn hiện đại hơn.",
                min: 0,
                max: 10,
                step: 1,
            },
        },
        generate: ({ depth, balance, inset }) => {
            const center = clamp(50 + balance, 38, 62);
            const upper = clamp(center - depth, inset + 4, 46);
            const lower = clamp(center + depth, 54, 100 - inset - 4);
            const inner = clamp(Math.max(inset / 2, 2), 2, 6);

            return [
                [inset, 0],
                [100 - inset, 0],
                [100, inset],
                [100, upper],
                [100 - inner, center],
                [100, lower],
                [100, 100 - inset],
                [100 - inset, 100],
                [inset, 100],
                [0, 100 - inset],
                [0, lower],
                [inner, center],
                [0, upper],
                [0, inset],
            ];
        },
    },
    {
        id: "ribbon",
        name: "Ribbon",
        summary: "Dải nhãn có đuôi gọn, hợp card tin tức và khối giới thiệu.",
        bestFor: ["News card", "Project badge", "Section label"],
        icon: Flag,
        defaults: { depth: 18, balance: 0, inset: 4 },
        controls: {
            depth: {
                label: "Độ dài đuôi",
                description: "Tăng phần đuôi để tạo cảm giác chuyển động.",
                min: 10,
                max: 28,
                step: 1,
            },
            balance: {
                label: "Vị trí đuôi",
                description: "Dời điểm đặt đuôi để hợp với nội dung ở dưới.",
                min: -18,
                max: 12,
                step: 1,
            },
            inset: {
                label: "Lùi mép",
                description: "Tăng khoảng lùi ở viền trên dưới để dễ đặt text.",
                min: 0,
                max: 14,
                step: 1,
            },
        },
        generate: ({ depth, balance, inset }) => {
            const anchor = clamp(74 + balance, 48, 86);
            const cut = clamp(Math.round(depth * 0.65), 6, 18);

            return [
                [inset, 0],
                [100 - inset, 0],
                [100, 100 - inset],
                [anchor, 100 - inset],
                [anchor - cut, 100],
                [anchor - depth, 100 - inset],
                [inset, 100 - inset],
                [0, 30 + inset],
            ];
        },
    },
];

const clipPathPresetMap = clipPathPresets.reduce(
    (acc, preset) => {
        acc[preset.id] = preset;
        return acc;
    },
    {} as Record<ClipPathPresetId, ClipPathPreset>,
);

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function formatPercent(value: number) {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

function pointsToPolygon(points: Point[]) {
    return `polygon(${points
        .map(([x, y]) => `${formatPercent(x)}% ${formatPercent(y)}%`)
        .join(", ")})`;
}

function formatPoint(point: Point) {
    return `${formatPercent(point[0])}% ${formatPercent(point[1])}%`;
}

function toTailwindClipPathValue(clipPath: string) {
    return clipPath.replace(/ /g, "_").replace(/,/g, ",_");
}

function sanitizeClassName(value: string) {
    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-+|-+$/g, "");

    return normalized || "clip-shape";
}

function randomInRange(config: ControlConfig) {
    const steps = Math.round((config.max - config.min) / config.step);
    return config.min + Math.round(Math.random() * steps) * config.step;
}

function formatControlValue(config: ControlConfig, value: number) {
    if (config.min < 0 && value > 0) {
        return `+${value}%`;
    }

    return `${value}%`;
}

export function ClipPathMakerTool() {
    const [activePresetId, setActivePresetId] =
        useState<ClipPathPresetId>("diagonal");
    const [controls, setControls] = useState<ControlValues>(
        clipPathPresetMap.diagonal.defaults,
    );
    const [previewMode, setPreviewMode] = useState<PreviewMode>("hero");
    const [codeFormat, setCodeFormat] = useState<CodeFormat>("css");
    const [classNameInput, setClassNameInput] = useState("clip-shape");
    const [copiedState, setCopiedState] = useState<CodeFormat | "polygon" | null>(
        null,
    );

    useEffect(() => {
        if (!copiedState) {
            return;
        }

        const timeoutId = window.setTimeout(() => setCopiedState(null), 1800);
        return () => window.clearTimeout(timeoutId);
    }, [copiedState]);

    const activePreset = clipPathPresetMap[activePresetId];
    const points = activePreset.generate(controls);
    const clipPath = pointsToPolygon(points);
    const tailwindClipPath = toTailwindClipPathValue(clipPath);
    const safeClassName = sanitizeClassName(classNameInput);
    const clipStyle: CSSProperties = {
        clipPath,
        WebkitClipPath: clipPath,
    };

    const snippets: Record<CodeFormat, string> = {
        css: `.${safeClassName} {\n  -webkit-clip-path: ${clipPath};\n  clip-path: ${clipPath};\n}`,
        tailwind: `<div className="[clip-path:${tailwindClipPath}]">\n  ...\n</div>`,
        jsx: `<div\n  style={{\n    WebkitClipPath: "${clipPath}",\n    clipPath: "${clipPath}",\n  }}\n>\n  ...\n</div>`,
    };

    async function copyText(text: string, type: CodeFormat | "polygon") {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.setAttribute("readonly", "");
            textarea.style.position = "absolute";
            textarea.style.left = "-9999px";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
        }

        setCopiedState(type);
    }

    function updateControl(key: ControlKey, nextValue: number) {
        setControls((current) => ({
            ...current,
            [key]: nextValue,
        }));
    }

    function applyPreset(presetId: ClipPathPresetId) {
        setActivePresetId(presetId);
        setControls(clipPathPresetMap[presetId].defaults);
    }

    function randomizeShape() {
        const { controls: activeControls } = activePreset;

        setControls({
            depth: randomInRange(activeControls.depth),
            balance: randomInRange(activeControls.balance),
            inset: randomInRange(activeControls.inset),
        });
    }

    return (
        <section
            id="clip-path-maker"
            className="border-y border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.16),_transparent_28%),linear-gradient(to_bottom,_#ffffff,_#fff7ed)] py-24"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <Badge className="mb-4 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 hover:bg-amber-50">
                            Frontend Tool
                        </Badge>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                            Clip-path maker trực quan, đủ nhanh để dùng ngay
                        </h2>
                        <p className="mt-4 text-base leading-7 text-slate-600">
                            Chọn preset, tinh chỉnh độ cắt và sao chép mã CSS
                            hoặc JSX ngay trên cùng trang. Maker ưu tiên thao tác
                            ít bước, preview rõ ràng và phù hợp các bối cảnh
                            hero, card, thumbnail trong khu công cụ.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {previewStats.map((item) => (
                            <div
                                key={item.label}
                                className="rounded-2xl border border-amber-100 bg-white/90 px-4 py-3 shadow-sm"
                            >
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    {item.label}
                                </p>
                                <p className="mt-1 text-2xl font-black text-slate-900">
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)_360px]">
                    <Card className="overflow-hidden rounded-[28px] border-slate-200 bg-white/90 shadow-xl shadow-amber-100/50">
                        <CardHeader className="border-b border-slate-100 pb-5">
                            <div className="flex items-center gap-3">
                                <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                                    <Wand2 className="size-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl text-slate-900">
                                        Chọn dáng cắt
                                    </CardTitle>
                                    <CardDescription className="mt-1 text-slate-500">
                                        Bắt đầu từ preset gần nhu cầu nhất rồi
                                        tinh chỉnh nhẹ.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6 pt-6">
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                                {clipPathPresets.map((preset) => {
                                    const Icon = preset.icon;
                                    const isActive = preset.id === activePresetId;

                                    return (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => applyPreset(preset.id)}
                                            className={cn(
                                                "cursor-pointer rounded-2xl border px-4 py-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2",
                                                isActive
                                                    ? "border-amber-300 bg-amber-50 shadow-sm"
                                                    : "border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/40",
                                            )}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={cn(
                                                        "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl",
                                                        isActive
                                                            ? "bg-amber-100 text-amber-700"
                                                            : "bg-slate-100 text-slate-600",
                                                    )}
                                                >
                                                    <Icon className="size-[18px]" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-slate-900">
                                                            {preset.name}
                                                        </p>
                                                        {isActive ? (
                                                            <Badge className="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-amber-600">
                                                                Đang dùng
                                                            </Badge>
                                                        ) : null}
                                                    </div>
                                                    <p className="mt-1 text-sm leading-6 text-slate-500">
                                                        {preset.summary}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                                <p className="text-sm font-semibold text-slate-900">
                                    Hợp nhất với
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {activePreset.bestFor.map((item) => (
                                        <span
                                            key={item}
                                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                                        >
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-5">
                                {(
                                    Object.keys(activePreset.controls) as ControlKey[]
                                ).map((key) => {
                                    const config = activePreset.controls[key];
                                    const value = controls[key];

                                    return (
                                        <div key={key} className="space-y-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <Label className="text-sm font-semibold text-slate-900">
                                                        {config.label}
                                                    </Label>
                                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                                        {config.description}
                                                    </p>
                                                </div>
                                                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                                                    {formatControlValue(
                                                        config,
                                                        value,
                                                    )}
                                                </span>
                                            </div>

                                            <Slider
                                                value={[value]}
                                                min={config.min}
                                                max={config.max}
                                                step={config.step}
                                                aria-label={config.label}
                                                onValueChange={(nextValue) =>
                                                    updateControl(
                                                        key,
                                                        nextValue[0] ?? value,
                                                    )
                                                }
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Button
                                    type="button"
                                    onClick={randomizeShape}
                                    variant="outline"
                                    className="cursor-pointer rounded-xl border-amber-200 bg-white text-slate-900 hover:bg-amber-50"
                                >
                                    <Shuffle className="mr-1.5 size-4" />
                                    Thử ngẫu nhiên
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() =>
                                        setControls(activePreset.defaults)
                                    }
                                    variant="secondary"
                                    className="cursor-pointer rounded-xl bg-slate-100 text-slate-900 hover:bg-slate-200"
                                >
                                    <RotateCcw className="mr-1.5 size-4" />
                                    Reset preset
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="overflow-hidden rounded-[32px] border-slate-200 bg-white shadow-2xl shadow-slate-200/70">
                        <CardHeader className="border-b border-slate-100 pb-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                                            <Sparkles className="size-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl text-slate-900">
                                                Preview thời gian thực
                                            </CardTitle>
                                            <CardDescription className="text-slate-500">
                                                Shape cập nhật ngay khi kéo
                                                slider, không cần refresh.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </div>

                                <Tabs
                                    value={previewMode}
                                    onValueChange={(value) =>
                                        setPreviewMode(value as PreviewMode)
                                    }
                                    className="w-full lg:w-auto"
                                >
                                    <TabsList
                                        variant="line"
                                        className="grid w-full grid-cols-3 rounded-2xl border border-slate-200 bg-slate-50 p-1 lg:w-[290px]"
                                    >
                                        <TabsTrigger
                                            value="hero"
                                            className="cursor-pointer rounded-xl data-[state=active]:bg-white"
                                        >
                                            <Monitor className="size-4" />
                                            Hero
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="card"
                                            className="cursor-pointer rounded-xl data-[state=active]:bg-white"
                                        >
                                            <Square className="size-4" />
                                            Card
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="media"
                                            className="cursor-pointer rounded-xl data-[state=active]:bg-white"
                                        >
                                            <Image className="size-4" />
                                            Media
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6 pt-6">
                            <Tabs value={previewMode} className="w-full">
                                <TabsContent value="hero">
                                    <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,_#0f172a_0%,_#1e293b_100%)] p-4 sm:p-6">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.26),_transparent_30%)]" />
                                        <div
                                            className="relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,_#f59e0b_0%,_#f97316_40%,_#0f172a_100%)] p-6 text-white shadow-2xl transition-[clip-path] duration-300 motion-reduce:transition-none"
                                            style={clipStyle}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <Badge className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
                                                    Prototype
                                                </Badge>
                                                <div className="text-right text-xs font-medium text-white/70">
                                                    {activePreset.name}
                                                </div>
                                            </div>

                                            <div className="max-w-sm space-y-4">
                                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-100">
                                                    Clip-path ready
                                                </p>
                                                <h3 className="text-3xl font-black leading-tight">
                                                    Tạo hero lạ mắt mà vẫn dễ
                                                    copy sang dự án.
                                                </h3>
                                                <p className="text-sm leading-6 text-white/80">
                                                    Shape phù hợp cho landing,
                                                    banner và các block nhấn
                                                    mạnh nội dung ngay đầu
                                                    trang.
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-3">
                                                <div className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                                                    Copy CSS
                                                </div>
                                                <div className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80">
                                                    Dùng cho hero
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="card">
                                    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:p-6">
                                        <div className="grid min-h-[300px] place-items-center rounded-[24px] border border-dashed border-slate-200 bg-[linear-gradient(180deg,_rgba(241,245,249,0.7),_rgba(255,255,255,1))] p-5">
                                            <div
                                                className="w-full max-w-md overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,_#0f172a_0%,_#334155_65%,_#f59e0b_120%)] p-6 text-white shadow-2xl transition-[clip-path] duration-300 motion-reduce:transition-none"
                                                style={clipStyle}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-amber-200">
                                                            UI experiment
                                                        </p>
                                                        <h3 className="mt-2 text-2xl font-bold">
                                                            Card nổi bật nhưng
                                                            không rối.
                                                        </h3>
                                                    </div>
                                                    <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                                                        Shape
                                                    </div>
                                                </div>

                                                <p className="mt-4 text-sm leading-6 text-white/75">
                                                    Dùng cho feature card, promo
                                                    card hoặc khối nội dung cần
                                                    nhấn bằng hình khối.
                                                </p>

                                                <div className="mt-6 flex items-center gap-3">
                                                    <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900">
                                                        Xem mã
                                                    </div>
                                                    <div className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/70">
                                                        Responsive
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="media">
                                    <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_#fff7ed_0%,_#ffffff_100%)] p-4 sm:p-6">
                                        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
                                            <div
                                                className="relative aspect-[5/4] overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,_#1e293b_0%,_#334155_55%,_#f59e0b_120%)] shadow-xl transition-[clip-path] duration-300 motion-reduce:transition-none"
                                                style={clipStyle}
                                            >
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_28%)]" />
                                                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">
                                                        Thumbnail
                                                    </p>
                                                    <h3 className="mt-2 text-2xl font-bold">
                                                        Shape cho thumbnail,
                                                        gallery hoặc teaser.
                                                    </h3>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                                    <p className="text-sm font-semibold text-slate-500">
                                                        Tỷ lệ hiện tại
                                                    </p>
                                                    <p className="mt-2 text-3xl font-black text-slate-900">
                                                        {points.length} điểm
                                                    </p>
                                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                                        Số điểm vừa đủ để shape
                                                        khác biệt nhưng vẫn dễ
                                                        maintain trong CSS.
                                                    </p>
                                                </div>

                                                <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
                                                    <p className="text-sm font-semibold text-white/70">
                                                        Gợi ý dùng
                                                    </p>
                                                    <ul className="mt-3 space-y-2 text-sm text-white/85">
                                                        <li>Ảnh cover bài viết</li>
                                                        <li>Thumbnail portfolio</li>
                                                        <li>Khối media trong hero</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            Chuỗi polygon hiện tại
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Dễ kiểm tra lại từng điểm trước khi
                                            copy sang component.
                                        </p>
                                    </div>
                                    <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700 hover:bg-white">
                                        {activePreset.name}
                                    </Badge>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {points.map((point, index) => (
                                        <span
                                            key={`${point[0]}-${point[1]}-${index}`}
                                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                                        >
                                            #{index + 1} {formatPoint(point)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="overflow-hidden rounded-[28px] border-slate-200 bg-white/95 shadow-xl shadow-slate-200/50">
                        <CardHeader className="border-b border-slate-100 pb-5">
                            <div className="flex items-center gap-3">
                                <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                                    <Code2 className="size-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl text-slate-900">
                                        Xuất mã để dùng ngay
                                    </CardTitle>
                                    <CardDescription className="mt-1 text-slate-500">
                                        Có sẵn CSS, Tailwind và JSX để cấy nhanh
                                        vào project.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-2">
                                <Label htmlFor="clip-path-class-name">
                                    Tên class CSS
                                </Label>
                                <Input
                                    id="clip-path-class-name"
                                    value={classNameInput}
                                    onChange={(event) =>
                                        setClassNameInput(event.target.value)
                                    }
                                    placeholder="clip-shape"
                                    className="h-11 rounded-xl border-slate-200"
                                />
                                {safeClassName !==
                                classNameInput.trim().toLowerCase() ? (
                                    <p className="text-xs text-slate-500">
                                        Sẽ được chuẩn hóa thành{" "}
                                        <span className="font-semibold text-slate-900">
                                            .{safeClassName}
                                        </span>
                                        .
                                    </p>
                                ) : null}
                            </div>

                            <Tabs
                                value={codeFormat}
                                onValueChange={(value) =>
                                    setCodeFormat(value as CodeFormat)
                                }
                                className="w-full"
                            >
                                <TabsList
                                    variant="line"
                                    className="grid w-full grid-cols-3 rounded-2xl border border-slate-200 bg-slate-50 p-1"
                                >
                                    <TabsTrigger
                                        value="css"
                                        className="cursor-pointer rounded-xl data-[state=active]:bg-white"
                                    >
                                        CSS
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="tailwind"
                                        className="cursor-pointer rounded-xl data-[state=active]:bg-white"
                                    >
                                        Tailwind
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="jsx"
                                        className="cursor-pointer rounded-xl data-[state=active]:bg-white"
                                    >
                                        JSX
                                    </TabsTrigger>
                                </TabsList>

                                {(Object.keys(snippets) as CodeFormat[]).map(
                                    (format) => (
                                        <TabsContent
                                            key={format}
                                            value={format}
                                            className="mt-4"
                                        >
                                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
                                                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
                                                        {format}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            copyText(
                                                                snippets[
                                                                    format
                                                                ],
                                                                format,
                                                            )
                                                        }
                                                        className="cursor-pointer rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/80 transition-colors hover:border-white/20 hover:bg-white/10"
                                                    >
                                                        {copiedState === format
                                                            ? "Đã sao chép"
                                                            : "Copy đoạn mã"}
                                                    </button>
                                                </div>
                                                <textarea
                                                    readOnly
                                                    spellCheck={false}
                                                    value={snippets[format]}
                                                    className="min-h-[220px] w-full resize-none border-0 bg-transparent px-4 py-4 font-mono text-sm leading-6 text-slate-100 outline-none"
                                                />
                                            </div>
                                        </TabsContent>
                                    ),
                                )}
                            </Tabs>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <Button
                                    type="button"
                                    onClick={() =>
                                        copyText(snippets[codeFormat], codeFormat)
                                    }
                                    className="cursor-pointer rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                                >
                                    {copiedState === codeFormat ? (
                                        <Check className="mr-1.5 size-4" />
                                    ) : (
                                        <Copy className="mr-1.5 size-4" />
                                    )}
                                    Sao chép mã đang chọn
                                </Button>

                                <Button
                                    type="button"
                                    onClick={() => copyText(clipPath, "polygon")}
                                    variant="outline"
                                    className="cursor-pointer rounded-xl border-amber-200 bg-white text-slate-900 hover:bg-amber-50"
                                >
                                    {copiedState === "polygon" ? (
                                        <Check className="mr-1.5 size-4 text-emerald-600" />
                                    ) : (
                                        <Copy className="mr-1.5 size-4" />
                                    )}
                                    Copy polygon(...)
                                </Button>
                            </div>

                            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                                <p className="text-sm font-semibold text-slate-900">
                                    Lưu ý khi dùng thật
                                </p>
                                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                                    <li>
                                        Ưu tiên shape ít điểm cho khối có nhiều
                                        text để tránh cảm giác chật.
                                    </li>
                                    <li>
                                        Trên Safari, dùng snippet CSS hoặc JSX
                                        vì đã kèm cả `WebkitClipPath`.
                                    </li>
                                    <li>
                                        Khi áp dụng cho ảnh, giữ thêm một lớp
                                        `overflow-hidden` nếu cần bo góc ngoài.
                                    </li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
