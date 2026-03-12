"use client";

import type { RefObject } from "react";
import {
    Grid3x3,
    Layers3,
    Magnet,
    Redo2,
    RotateCcw,
    Undo2,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { ClipPathPreset } from "./clipPathData";
import type { PreviewMode } from "./clipPathStudioTypes";
import { formatPoint, pointsToPolygon, type Point } from "./clipPathUtils";

/* ─── Color palette for unique point colors (like clippy.f8.edu.vn) ─── */
const POINT_COLORS = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#14b8a6", // teal
    "#f59e0b", // amber
    "#10b981", // emerald
    "#6366f1", // indigo
];

function getPointColor(index: number) {
    return POINT_COLORS[index % POINT_COLORS.length];
}

/* ─── Canvas sizing constants ─── */
// The SVG viewBox adds padding around the 0-100 shape area so edge dots aren't clipped
const PAD = 8; // padding in SVG units
const VB_MIN = -PAD;
const VB_SIZE = 100 + PAD * 2; // total viewBox dimension

type ClipPathCanvasPanelProps = {
    activePreset: ClipPathPreset;
    currentModeLabel: string;
    editorSurfaceRef: RefObject<SVGSVGElement | null>;
    onCanvasKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
    onPreviewModeChange: (mode: PreviewMode) => void;
    onRandomize: () => void;
    onRedo: () => void;
    onReset: () => void;
    onSelectPoint: (index: number) => void;
    onSetShowGrid: (checked: boolean) => void;
    onSetSnapToGrid: (checked: boolean) => void;
    onSetSymmetryLock: (checked: boolean) => void;
    onStartDrag: (index: number) => void;
    onUndo: () => void;
    canRedo: boolean;
    canUndo: boolean;
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
    onRedo,
    onReset,
    onSelectPoint,
    onSetShowGrid,
    onSetSnapToGrid,
    onSetSymmetryLock,
    onStartDrag,
    onUndo,
    canRedo,
    canUndo,
    points,
    selectedPointIndex,
    showGrid,
    snapToGrid,
    symmetryLock,
}: ClipPathCanvasPanelProps) {
    const currentPoint = points[selectedPointIndex] ?? points[0];
    const clipPath = pointsToPolygon(points);

    return (
        <div
            className="clip-path-panel clip-path-stagger-in order-1 flex flex-col gap-0 overflow-hidden rounded-[28px] border border-[#d5ebe7] bg-white shadow-[0_28px_80px_rgba(15,118,110,0.12)] xl:order-2"
            data-stagger="1"
        >
            {/* ── Compact top bar ── */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#e5f3f0] px-4 py-3">
                <span className="rounded-full border border-[#cde8e3] bg-[#f2fbf9] px-3 py-1 text-xs font-semibold text-[#0f766e]">
                    {activePreset.name}
                </span>
                <span className="rounded-full border border-[#f5d2bf] bg-[#fff5ee] px-3 py-1 text-xs font-semibold text-[#c2410c]">
                    {currentModeLabel}
                </span>

                <div className="ml-auto flex items-center gap-1.5">
                    <ToolToggle
                        active={showGrid}
                        icon={<Grid3x3 className="size-3.5" />}
                        label="Lưới"
                        onClick={() => onSetShowGrid(!showGrid)}
                    />
                    <ToolToggle
                        active={snapToGrid}
                        icon={<Magnet className="size-3.5" />}
                        label="Snap"
                        onClick={() => onSetSnapToGrid(!snapToGrid)}
                    />
                    <ToolToggle
                        active={symmetryLock}
                        icon={<Layers3 className="size-3.5" />}
                        label="Đối xứng"
                        onClick={() => onSetSymmetryLock(!symmetryLock)}
                    />

                    <span className="mx-1 h-5 w-px bg-[#d7ebe7]" />

                    <IconButton
                        disabled={!canUndo}
                        icon={<Undo2 className="size-3.5" />}
                        label="Hoàn tác"
                        onClick={onUndo}
                    />
                    <IconButton
                        disabled={!canRedo}
                        icon={<Redo2 className="size-3.5" />}
                        label="Làm lại"
                        onClick={onRedo}
                    />
                    <IconButton
                        icon={<RotateCcw className="size-3.5" />}
                        label="Đặt lại"
                        onClick={onReset}
                    />
                </div>
            </div>

            {/* ── Canvas workspace — centered, constrained shape ── */}
            <div
                className="relative flex min-h-[460px] flex-1 items-center justify-center bg-[#f4faf9] p-6"
                onKeyDown={onCanvasKeyDown}
                role="application"
                tabIndex={0}
            >
                {/* Centered shape container with max-size constraint */}
                <div
                    className="relative w-full"
                    style={{ maxWidth: 420, aspectRatio: "1 / 1" }}
                >
                    {/* Inner working area — the "demo box" like clippy */}
                    <div className="absolute inset-0 overflow-visible rounded-lg border border-dashed border-[#b0d8d0] bg-white shadow-[0_4px_24px_rgba(15,118,110,0.08)]">
                        {/* Grid overlay inside working area */}
                        {showGrid ? (
                            <div className="pointer-events-none absolute inset-0 z-[1] rounded-lg bg-[linear-gradient(to_right,_rgba(15,118,110,0.06)_1px,_transparent_1px),linear-gradient(to_bottom,_rgba(15,118,110,0.06)_1px,_transparent_1px)] [background-size:10%_10%]" />
                        ) : null}

                        {/* Shape preview fill with gradient */}
                        <div
                            className="absolute inset-0 rounded-lg bg-[linear-gradient(135deg,_#0f766e_0%,_#14b8a6_52%,_#f97316_110%)] opacity-20 transition-[clip-path] duration-200 ease-out"
                            style={{
                                WebkitClipPath: clipPath,
                                clipPath,
                            }}
                        />

                        {/* Checkerboard pattern background for transparency indication */}
                        <div className="pointer-events-none absolute inset-0 rounded-lg opacity-[0.03] [background-image:repeating-conic-gradient(#0f766e_0%_25%,transparent_0%_50%)] [background-size:16px_16px]" />
                    </div>

                    {/* SVG editor surface — with overflow visible for edge handles */}
                    <svg
                        ref={editorSurfaceRef}
                        viewBox={`${VB_MIN} ${VB_MIN} ${VB_SIZE} ${VB_SIZE}`}
                        preserveAspectRatio="xMidYMid meet"
                        className="absolute inset-0 z-10 h-full w-full touch-none cursor-crosshair"
                        style={{ overflow: "visible" }}
                        aria-label="Canvas chỉnh polygon"
                    >
                        {/* Working area boundary rect (0-100 range) */}
                        <rect
                            x={0}
                            y={0}
                            width={100}
                            height={100}
                            fill="none"
                            stroke="transparent"
                            strokeWidth={0}
                        />

                        {/* Filled polygon shape */}
                        <polygon
                            points={points
                                .map((point) => `${point.x},${point.y}`)
                                .join(" ")}
                            fill="rgba(15,118,110,0.06)"
                            stroke="#0d9488"
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                        />

                        {/* Edge lines between consecutive points */}
                        {points.map((point, index) => {
                            const next = points[(index + 1) % points.length];
                            return (
                                <line
                                    key={`edge-${index}`}
                                    x1={point.x}
                                    y1={point.y}
                                    x2={next.x}
                                    y2={next.y}
                                    stroke="#0d9488"
                                    strokeWidth="1"
                                    strokeDasharray="4 3"
                                    vectorEffect="non-scaling-stroke"
                                    opacity={0.35}
                                />
                            );
                        })}

                        {/* Draggable control points with unique colors */}
                        {points.map((point, index) => {
                            const isSelected = selectedPointIndex === index;
                            const color = getPointColor(index);

                            return (
                                <g key={`pt-${index}`}>
                                    {/* Invisible larger hit area for easy grabbing */}
                                    <circle
                                        cx={point.x}
                                        cy={point.y}
                                        r={isSelected ? 5 : 4}
                                        fill="transparent"
                                        className="cursor-grab active:cursor-grabbing"
                                        onPointerDown={(event) => {
                                            event.preventDefault();
                                            onStartDrag(index);
                                        }}
                                    />
                                    {/* Outer glow ring for selected point */}
                                    {isSelected ? (
                                        <circle
                                            cx={point.x}
                                            cy={point.y}
                                            r={3.6}
                                            fill="none"
                                            stroke={color}
                                            strokeWidth="2"
                                            vectorEffect="non-scaling-stroke"
                                            opacity={0.25}
                                            className="clip-path-active-point"
                                        />
                                    ) : null}
                                    {/* Visible dot — fixed visual size via vectorEffect */}
                                    <circle
                                        cx={point.x}
                                        cy={point.y}
                                        r={isSelected ? 2 : 1.6}
                                        className="pointer-events-none transition-all duration-150"
                                        fill={color}
                                        stroke="white"
                                        strokeWidth={isSelected ? 2 : 1.5}
                                        vectorEffect="non-scaling-stroke"
                                    />
                                    {/* Point index label — positioned smartly near edges */}
                                    <text
                                        x={point.x}
                                        y={
                                            point.y > 88
                                                ? point.y - 5
                                                : point.y + 6.5
                                        }
                                        textAnchor="middle"
                                        fontSize="3"
                                        fontWeight="700"
                                        fill={color}
                                        opacity={isSelected ? 1 : 0.7}
                                        className="pointer-events-none select-none"
                                    >
                                        {index + 1}
                                    </text>
                                    {/* Tooltip badge for selected point */}
                                    {isSelected ? (
                                        <>
                                            <rect
                                                x={
                                                    point.x > 75
                                                        ? point.x - 28
                                                        : point.x + 4
                                                }
                                                y={
                                                    point.y > 12
                                                        ? point.y - 9
                                                        : point.y + 4
                                                }
                                                width="24"
                                                height="7"
                                                rx="3.5"
                                                fill="rgba(15,23,42,0.88)"
                                            />
                                            <text
                                                x={
                                                    point.x > 75
                                                        ? point.x - 16
                                                        : point.x + 16
                                                }
                                                y={
                                                    point.y > 12
                                                        ? point.y - 4.2
                                                        : point.y + 9
                                                }
                                                textAnchor="middle"
                                                fontSize="2.8"
                                                fontWeight="500"
                                                fill="white"
                                                className="pointer-events-none"
                                            >
                                                {Math.round(point.x)}% ·{" "}
                                                {Math.round(point.y)}%
                                            </text>
                                        </>
                                    ) : null}
                                </g>
                            );
                        })}
                    </svg>

                    {/* Coordinate axis labels on edges */}
                    <div className="pointer-events-none absolute -left-5 top-1/2 z-20 -translate-y-1/2 -rotate-90 text-[10px] font-medium tracking-wide text-[#0d9488]/40">
                        Y
                    </div>
                    <div className="pointer-events-none absolute -bottom-5 left-1/2 z-20 -translate-x-1/2 text-[10px] font-medium tracking-wide text-[#0d9488]/40">
                        X
                    </div>

                    {/* Corner labels 0% / 100% */}
                    <div className="pointer-events-none absolute -left-1 -top-4 z-20 text-[9px] font-semibold text-[#0d9488]/30">
                        0,0
                    </div>
                    <div className="pointer-events-none absolute -bottom-4 -right-1 z-20 text-[9px] font-semibold text-[#0d9488]/30">
                        100,100
                    </div>
                </div>

                {/* Selected point info badge — floating bottom-left */}
                <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-2">
                    <span
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur"
                    >
                        <span
                            className="inline-block size-2 rounded-full"
                            style={{
                                backgroundColor: getPointColor(selectedPointIndex),
                            }}
                        />
                        Điểm #{selectedPointIndex + 1}
                    </span>
                    <span className="rounded-full border border-[#f5d2bf] bg-[#fff6ef]/90 px-3 py-1 text-xs font-semibold text-[#c2410c] shadow-sm backdrop-blur">
                        X: {Math.round(currentPoint.x)}% · Y:{" "}
                        {Math.round(currentPoint.y)}%
                    </span>
                </div>

                {/* Total points badge — floating top-right */}
                <div className="pointer-events-none absolute right-3 top-3 z-20">
                    <span className="rounded-full border border-[#d5ebe7] bg-white/90 px-3 py-1 text-[10px] font-semibold text-[#0f766e] shadow-sm backdrop-blur">
                        {points.length} điểm
                    </span>
                </div>
            </div>

            {/* ── Point selector strip ── */}
            <div className="border-t border-[#e5f3f0] px-4 py-3">
                <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-700">
                        Các điểm ({points.length})
                    </p>
                    <p className="text-xs text-slate-400">
                        Nhấn chọn để canh tọa độ · Shift + mũi tên di nhanh
                    </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {points.map((point, index) => (
                        <button
                            key={`sel-${index}`}
                            type="button"
                            onClick={() => onSelectPoint(index)}
                            className={cn(
                                "cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all duration-150",
                                selectedPointIndex === index
                                    ? "border-[#0d9488] bg-[#eefbf8] text-[#0f766e] shadow-sm"
                                    : "border-[#e5f0ed] bg-white text-slate-500 hover:border-[#0d9488]/50 hover:text-[#0d9488]",
                            )}
                        >
                            <span
                                className="mr-1 inline-block size-1.5 rounded-full"
                                style={{
                                    backgroundColor: getPointColor(index),
                                }}
                            />
                            #{index + 1}{" "}
                            <span className="opacity-70">
                                {formatPoint(point)}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ─── Tiny internal components ─── */

function ToolToggle({
    active,
    icon,
    label,
    onClick,
}: {
    active: boolean;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-150",
                active
                    ? "border-[#0d9488] bg-[#eefbf8] text-[#0f766e]"
                    : "border-[#e1eeeb] bg-white text-slate-500 hover:border-[#0d9488]/40 hover:text-[#0d9488]",
            )}
            title={label}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}

function IconButton({
    disabled,
    icon,
    label,
    onClick,
}: {
    disabled?: boolean;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg border border-[#e1eeeb] bg-white text-slate-500 transition-all duration-150 hover:border-[#0d9488]/40 hover:text-[#0d9488] disabled:cursor-not-allowed disabled:opacity-35"
            title={label}
        >
            {icon}
        </button>
    );
}
