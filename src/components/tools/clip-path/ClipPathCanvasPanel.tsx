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

            {/* ── Full-size canvas ── */}
            <div
                className="relative min-h-[420px] flex-1"
                onKeyDown={onCanvasKeyDown}
                role="application"
                tabIndex={0}
            >
                {/* Grid overlay */}
                {showGrid ? (
                    <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(to_right,_rgba(15,118,110,0.06)_1px,_transparent_1px),linear-gradient(to_bottom,_rgba(15,118,110,0.06)_1px,_transparent_1px)] [background-size:10%_10%]" />
                ) : null}

                {/* Shape preview fill */}
                <div className="absolute inset-0 bg-[#f7fdfc]">
                    <div
                        className="absolute inset-0 bg-[linear-gradient(135deg,_#0f766e_0%,_#14b8a6_52%,_#f97316_110%)] opacity-20 transition-[clip-path] duration-200 ease-out"
                        style={{
                            WebkitClipPath: clipPath,
                            clipPath,
                        }}
                    />
                </div>

                {/* SVG editor surface */}
                <svg
                    ref={editorSurfaceRef}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="absolute inset-0 z-10 h-full w-full touch-none cursor-crosshair"
                    aria-label="Canvas chỉnh polygon"
                >
                    {/* Filled polygon */}
                    <polygon
                        points={points
                            .map((point) => `${point.x},${point.y}`)
                            .join(" ")}
                        fill="rgba(15,118,110,0.08)"
                        stroke="#0d9488"
                        strokeWidth="1.4"
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
                                strokeWidth="0.6"
                                strokeDasharray="1.5 1"
                                vectorEffect="non-scaling-stroke"
                                opacity={0.4}
                            />
                        );
                    })}

                    {/* Draggable control points */}
                    {points.map((point, index) => {
                        const isSelected = selectedPointIndex === index;
                        return (
                            <g key={`pt-${index}`}>
                                {/* Larger invisible hit area */}
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r={4}
                                    fill="transparent"
                                    className="cursor-grab active:cursor-grabbing"
                                    onPointerDown={(event) => {
                                        event.preventDefault();
                                        onStartDrag(index);
                                    }}
                                />
                                {/* Visible point */}
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r={isSelected ? 2.4 : 1.6}
                                    className={cn(
                                        "pointer-events-none transition-all duration-150",
                                        isSelected && "clip-path-active-point",
                                    )}
                                    fill={isSelected ? "#f97316" : "#0d9488"}
                                    stroke="white"
                                    strokeWidth={isSelected ? 1 : 0.7}
                                    vectorEffect="non-scaling-stroke"
                                />
                                {/* Point index label */}
                                <text
                                    x={point.x}
                                    y={
                                        point.y > 90
                                            ? point.y - 4
                                            : point.y + 5.5
                                    }
                                    textAnchor="middle"
                                    fontSize="2.8"
                                    fontWeight="600"
                                    fill={isSelected ? "#f97316" : "#0d9488"}
                                    opacity={isSelected ? 1 : 0.6}
                                    className="pointer-events-none select-none"
                                >
                                    {index + 1}
                                </text>
                                {/* Tooltip for selected point */}
                                {isSelected ? (
                                    <>
                                        <rect
                                            x={Math.min(point.x + 3, 74)}
                                            y={Math.max(point.y - 8, 2)}
                                            width="24"
                                            height="6.5"
                                            rx="3"
                                            fill="rgba(15,23,42,0.88)"
                                        />
                                        <text
                                            x={Math.min(point.x + 15, 86)}
                                            y={Math.max(point.y - 3.5, 7)}
                                            textAnchor="middle"
                                            fontSize="2.5"
                                            fill="white"
                                            className="pointer-events-none"
                                        >
                                            {point.x}% · {point.y}%
                                        </text>
                                    </>
                                ) : null}
                            </g>
                        );
                    })}
                </svg>

                {/* Selected point info badge */}
                <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-2">
                    <span className="rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
                        Điểm #{selectedPointIndex + 1}
                    </span>
                    <span className="rounded-full border border-[#f5d2bf] bg-[#fff6ef]/90 px-3 py-1 text-xs font-semibold text-[#c2410c] shadow-sm backdrop-blur">
                        X: {currentPoint.x}% · Y: {currentPoint.y}%
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
