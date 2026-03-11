"use client";

import type { RefObject } from "react";
import { Image, Layers3, Monitor, Shuffle, Sparkles, Square } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import type { ClipPathPreset } from "./clipPathData";
import type { PreviewMode } from "./clipPathStudioTypes";
import { formatPoint, pointsToPolygon, type Point } from "./clipPathUtils";

type ClipPathCanvasPanelProps = {
    activePreset: ClipPathPreset;
    currentModeLabel: string;
    editorSurfaceRef: RefObject<SVGSVGElement | null>;
    onCanvasKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
    onPreviewModeChange: (mode: PreviewMode) => void;
    onRandomize: () => void;
    onSelectPoint: (index: number) => void;
    onSetShowGrid: (checked: boolean) => void;
    onSetSnapToGrid: (checked: boolean) => void;
    onSetSymmetryLock: (checked: boolean) => void;
    onStartDrag: (index: number) => void;
    points: Point[];
    previewMode: PreviewMode;
    selectedPointIndex: number;
    showGrid: boolean;
    snapLabel: string;
    snapToGrid: boolean;
    symmetryLock: boolean;
};

export function ClipPathCanvasPanel({
    activePreset,
    currentModeLabel,
    editorSurfaceRef,
    onCanvasKeyDown,
    onPreviewModeChange,
    onRandomize,
    onSelectPoint,
    onSetShowGrid,
    onSetSnapToGrid,
    onSetSymmetryLock,
    onStartDrag,
    points,
    previewMode,
    selectedPointIndex,
    showGrid,
    snapLabel,
    snapToGrid,
    symmetryLock,
}: ClipPathCanvasPanelProps) {
    const currentPoint = points[selectedPointIndex] ?? points[0];
    const clipPath = pointsToPolygon(points);

    return (
        <Card className="overflow-hidden rounded-[34px] border-[#d5ebe7] bg-white shadow-[0_28px_80px_rgba(15,118,110,0.12)]">
            <CardHeader className="border-b border-[#e5f3f0] pb-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-[#d9f4ef] text-[#0f766e]">
                            <Sparkles className="size-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl text-slate-950">
                                Canvas chinh polygon truc tiep
                            </CardTitle>
                            <CardDescription className="mt-1 text-slate-500">
                                Click diem, drag tren canvas hoac dung phim mui ten
                                de canh tung toa do.
                            </CardDescription>
                        </div>
                    </div>

                    <Tabs
                        value={previewMode}
                        onValueChange={(value) => onPreviewModeChange(value as PreviewMode)}
                        className="w-full lg:w-auto"
                    >
                        <TabsList
                            variant="line"
                            className="grid w-full grid-cols-3 rounded-2xl border border-[#d7ebe7] bg-[#f7fbfa] p-1 lg:w-[290px]"
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
                <div className="flex flex-wrap items-center gap-3">
                    <Badge className="rounded-full border border-[#cde8e3] bg-[#f2fbf9] px-3 py-1 text-[#0f766e] hover:bg-[#f2fbf9]">
                        {activePreset.name}
                    </Badge>
                    <Badge className="rounded-full border border-[#f5d2bf] bg-[#fff5ee] px-3 py-1 text-[#c2410c] hover:bg-[#fff5ee]">
                        {currentModeLabel}
                    </Badge>
                    <span className="rounded-full border border-[#e1eeeb] bg-white px-3 py-1 text-sm text-slate-500">
                        {snapLabel}
                    </span>
                    <span className="rounded-full border border-[#e1eeeb] bg-white px-3 py-1 text-sm text-slate-500">
                        #{selectedPointIndex + 1} - {formatPoint(currentPoint)}
                    </span>
                </div>

                <div
                    className="rounded-[30px] border border-[#d9ece8] bg-[linear-gradient(180deg,_#f7fdfc_0%,_#edf9f6_100%)] p-4 sm:p-6"
                    onKeyDown={onCanvasKeyDown}
                    role="application"
                    tabIndex={0}
                >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-950">
                                Preview + editor
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                Drag point truc tiep tren canvas. Giu{" "}
                                <span className="font-semibold text-slate-900">
                                    Shift
                                </span>{" "}
                                de di nhanh hon khi dung phim mui ten.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={onRandomize}
                                className="rounded-xl border-[#cde8e3] bg-white text-slate-900 hover:bg-[#f1fbf8]"
                            >
                                <Shuffle className="mr-1.5 size-4" />
                                Ngau nhien
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => onSetSymmetryLock(!symmetryLock)}
                                className={cn(
                                    "rounded-xl border-[#cde8e3] bg-white text-slate-900 hover:bg-[#f1fbf8]",
                                    symmetryLock &&
                                        "border-[#0d9488] bg-[#eefbf8] text-[#0f766e]",
                                )}
                            >
                                <Layers3 className="mr-1.5 size-4" />
                                Doi xung
                            </Button>
                        </div>
                    </div>

                    <div className="relative aspect-[16/10] overflow-hidden rounded-[28px] border border-[#cfe8e3] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                        {showGrid ? (
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,_rgba(15,118,110,0.08)_1px,_transparent_1px),linear-gradient(to_bottom,_rgba(15,118,110,0.08)_1px,_transparent_1px)] [background-size:10%_10%]" />
                        ) : null}
                        <div className="absolute inset-5 overflow-hidden rounded-[24px] border border-white/80 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                            <div
                                className="absolute inset-0 bg-[linear-gradient(135deg,_#0f766e_0%,_#14b8a6_52%,_#f97316_110%)]"
                                style={{
                                    WebkitClipPath: clipPath,
                                    clipPath,
                                }}
                            >
                                {previewMode === "hero" ? (
                                    <div className="flex h-full flex-col justify-between p-5 text-white sm:p-6">
                                        <div className="flex items-center justify-between gap-3">
                                            <Badge className="rounded-full border border-white/20 bg-white/12 px-3 py-1 text-white hover:bg-white/12">
                                                Clip Path Market
                                            </Badge>
                                            <span className="text-sm font-medium text-white/80">
                                                {currentModeLabel}
                                            </span>
                                        </div>

                                        <div className="max-w-sm">
                                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
                                                Creative layout
                                            </p>
                                            <h3 className="mt-3 text-3xl font-black leading-tight text-white">
                                                Hero co shape la mat nhung van de doc
                                                va de dung.
                                            </h3>
                                            <p className="mt-3 text-sm leading-6 text-white/85">
                                                Doi tu preset sang custom nhanh, giu
                                                duoc nhac do thiet ke ma khong can mo
                                                them cong cu khac.
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950">
                                                Save custom
                                            </span>
                                            <span className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80">
                                                Export CSS / JSX
                                            </span>
                                        </div>
                                    </div>
                                ) : null}

                                {previewMode === "card" ? (
                                    <div className="flex h-full flex-col justify-between p-5 text-white sm:p-6">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-[#d1fae5]">
                                                    Feature card
                                                </p>
                                                <h3 className="mt-2 text-2xl font-black leading-tight">
                                                    Card noi bat ma van gon va de dat
                                                    text.
                                                </h3>
                                            </div>
                                            <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white/80">
                                                {points.length} points
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            <p className="max-w-sm text-sm leading-6 text-white/85">
                                                Dung cho feature card, testimonial,
                                                project tile hoac bat ky block nao can
                                                dang cat rieng.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {activePreset.bestFor.slice(0, 3).map((item) => (
                                                    <span
                                                        key={item}
                                                        className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white/80"
                                                    >
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {previewMode === "media" ? (
                                    <div className="relative h-full">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.28),_transparent_30%),linear-gradient(180deg,_rgba(15,23,42,0)_0%,_rgba(15,23,42,0.22)_100%)]" />
                                        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                                                Media crop
                                            </p>
                                            <h3 className="mt-2 text-3xl font-black leading-tight">
                                                Crop image theo shape tu nhien cho
                                                thumb va cover.
                                            </h3>
                                            <p className="mt-3 max-w-md text-sm leading-6 text-white/85">
                                                Huu ich cho thumbnail, hero art,
                                                creator card va gallery preview.
                                            </p>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <svg
                                ref={editorSurfaceRef}
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                                className="absolute inset-0 h-full w-full touch-none cursor-crosshair"
                                aria-label="Canvas chinh polygon"
                            >
                                <polygon
                                    points={points
                                        .map((point) => `${point.x},${point.y}`)
                                        .join(" ")}
                                    fill="rgba(15,118,110,0.05)"
                                    stroke="#0d9488"
                                    strokeWidth="1.2"
                                    strokeLinejoin="round"
                                    vectorEffect="non-scaling-stroke"
                                />

                                {points.map((point, index) => (
                                    <g key={`${point.x}-${point.y}-${index}`}>
                                        <circle
                                            cx={point.x}
                                            cy={point.y}
                                            r={selectedPointIndex === index ? 2.1 : 1.45}
                                            fill={
                                                selectedPointIndex === index
                                                    ? "#f97316"
                                                    : "#0d9488"
                                            }
                                            stroke="white"
                                            strokeWidth="0.85"
                                            vectorEffect="non-scaling-stroke"
                                            onPointerDown={(event) => {
                                                event.preventDefault();
                                                onStartDrag(index);
                                            }}
                                        />
                                        {selectedPointIndex === index ? (
                                            <>
                                                <rect
                                                    x={Math.min(point.x + 2, 80)}
                                                    y={Math.max(point.y - 8, 4)}
                                                    width="16"
                                                    height="7"
                                                    rx="3.5"
                                                    fill="rgba(15,23,42,0.88)"
                                                />
                                                <text
                                                    x={Math.min(point.x + 10, 88)}
                                                    y={Math.max(point.y - 3.3, 8)}
                                                    textAnchor="middle"
                                                    fontSize="3.2"
                                                    fill="white"
                                                >
                                                    #{index + 1}
                                                </text>
                                            </>
                                        ) : null}
                                    </g>
                                ))}
                            </svg>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                        <div className="rounded-2xl border border-[#e1eeeb] bg-white p-4">
                            <p className="text-sm font-semibold text-slate-950">
                                Polygon hien tai
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Chon mot diem ben duoi de canh tung toa do hoac them
                                diem giua canh dang chon.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {points.map((point, index) => (
                                    <button
                                        key={`${point.x}-${point.y}-${index}`}
                                        type="button"
                                        onClick={() => onSelectPoint(index)}
                                        className={cn(
                                            "cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                                            selectedPointIndex === index
                                                ? "border-[#0d9488] bg-[#eefbf8] text-[#0f766e]"
                                                : "border-[#d7ebe7] bg-white text-slate-600 hover:border-[#0d9488] hover:text-[#0d9488]",
                                        )}
                                    >
                                        #{index + 1} {formatPoint(point)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[#e1eeeb] bg-white p-4">
                            <p className="text-sm font-semibold text-slate-950">
                                Hien thi
                            </p>
                            <div className="mt-3 space-y-3">
                                <label className="flex items-center gap-3 text-sm text-slate-600">
                                    <Checkbox
                                        checked={showGrid}
                                        onCheckedChange={(checked) =>
                                            onSetShowGrid(checked === true)
                                        }
                                    />
                                    Show grid
                                </label>
                                <label className="flex items-center gap-3 text-sm text-slate-600">
                                    <Checkbox
                                        checked={snapToGrid}
                                        onCheckedChange={(checked) =>
                                            onSetSnapToGrid(checked === true)
                                        }
                                    />
                                    Snap to grid
                                </label>
                                <label className="flex items-center gap-3 text-sm text-slate-600">
                                    <Checkbox
                                        checked={symmetryLock}
                                        onCheckedChange={(checked) =>
                                            onSetSymmetryLock(checked === true)
                                        }
                                    />
                                    Khoa doi xung
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
