"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { ClipPathPreset } from "./clipPathData";
import { clipPathPresets } from "./clipPathData";
import { ClipPathCanvasPanel } from "./ClipPathCanvasPanel";
import { ClipPathInspectorPanel } from "./ClipPathInspectorPanel";
import { ClipPathPresetRail } from "./ClipPathPresetRail";
import type { CodeFormat, CopyState, FilterCategory, PreviewMode } from "./clipPathStudioTypes";
import {
    clonePoints,
    getSymmetryPairs,
    insertPointAfter,
    makeSymmetric,
    normalizePoint,
    normalizePoints,
    pointsEqual,
    pointsToPolygon,
    pointsToSvgPath,
    randomizePoints,
    removePointAt,
    sanitizeClassName,
    scalePoints,
    snapPoint,
    toTailwindClipPathValue,
    updatePointAt,
    type Point,
} from "./clipPathUtils";

type HistoryState = {
    stack: Point[][];
    index: number;
};

const CUSTOM_PRESET_STORAGE_KEY = "clip-path-market-custom-presets-v2";
const SNAP_STEP = 5;

function getDefaultCustomPresetName(preset: ClipPathPreset) {
    return preset.category === "custom" ? preset.name : `${preset.name} Custom`;
}

function getReadableModeLabel(preset: ClipPathPreset, points: Point[]) {
    if (preset.category === "custom") {
        return "Custom";
    }

    return pointsEqual(points, preset.points) ? "Preset" : "Dang custom";
}

function createCustomPreset(
    name: string,
    points: Point[],
    referencePreset: ClipPathPreset,
    id?: string,
): ClipPathPreset {
    return {
        id: id ?? `custom-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
        name,
        category: "custom",
        summary: "Shape tu luu de tai su dung trong project.",
        tags: ["custom", referencePreset.tags[0] ?? "saved", "editable"],
        bestFor: ["Tai su dung", "Thu nghiem", "Bo suu tap rieng"],
        points: clonePoints(points),
    };
}

function normalizeStoredPresets(value: unknown): ClipPathPreset[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((item) => {
        if (!item || typeof item !== "object") {
            return [];
        }

        const preset = item as Partial<ClipPathPreset>;
        if (!preset.id || !preset.name || !Array.isArray(preset.points)) {
            return [];
        }

        const points = normalizePoints(
            preset.points.map((point) =>
                normalizePoint({
                    x: Number(point?.x ?? 0),
                    y: Number(point?.y ?? 0),
                }),
            ),
        );

        if (points.length < 3) {
            return [];
        }

        return [
            {
                id: preset.id,
                name: preset.name,
                category: "custom",
                summary:
                    preset.summary ?? "Shape tu luu de tai su dung trong project.",
                tags: Array.isArray(preset.tags)
                    ? preset.tags.slice(0, 3)
                    : ["custom", "saved", "editable"],
                bestFor: Array.isArray(preset.bestFor)
                    ? preset.bestFor.slice(0, 3)
                    : ["Tai su dung", "Thu nghiem", "Bo suu tap rieng"],
                points,
            },
        ];
    });
}

export function ClipPathStudioWorkspace() {
    const initialPreset = clipPathPresets[0];
    const [customPresets, setCustomPresets] = useState<ClipPathPreset[]>([]);
    const [activePresetId, setActivePresetId] = useState(initialPreset.id);
    const [points, setPoints] = useState<Point[]>(clonePoints(initialPreset.points));
    const [historyState, setHistoryState] = useState<HistoryState>({
        stack: [clonePoints(initialPreset.points)],
        index: 0,
    });
    const [selectedPointIndex, setSelectedPointIndex] = useState(0);
    const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
    const [previewMode, setPreviewMode] = useState<PreviewMode>("hero");
    const [codeFormat, setCodeFormat] = useState<CodeFormat>("css");
    const [classNameInput, setClassNameInput] = useState("clip-shape");
    const [customPresetName, setCustomPresetName] = useState(
        getDefaultCustomPresetName(initialPreset),
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");
    const [showGrid, setShowGrid] = useState(true);
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [symmetryLock, setSymmetryLock] = useState(false);
    const [copiedState, setCopiedState] = useState<CopyState>(null);
    const [statusMessage, setStatusMessage] = useState("");

    const pointsRef = useRef(points);
    const symmetryPairsRef = useRef<number[]>([]);
    const editorSurfaceRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        pointsRef.current = points;
    }, [points]);

    useEffect(() => {
        const raw = window.localStorage.getItem(CUSTOM_PRESET_STORAGE_KEY);
        if (!raw) {
            return;
        }

        try {
            setCustomPresets(normalizeStoredPresets(JSON.parse(raw)));
        } catch {
            setCustomPresets([]);
        }
    }, []);

    useEffect(() => {
        window.localStorage.setItem(
            CUSTOM_PRESET_STORAGE_KEY,
            JSON.stringify(customPresets),
        );
    }, [customPresets]);

    useEffect(() => {
        if (!copiedState) {
            return;
        }

        const timeoutId = window.setTimeout(() => setCopiedState(null), 1800);
        return () => window.clearTimeout(timeoutId);
    }, [copiedState]);

    useEffect(() => {
        if (selectedPointIndex <= points.length - 1) {
            return;
        }

        setSelectedPointIndex(Math.max(points.length - 1, 0));
    }, [points.length, selectedPointIndex]);

    const allPresets = useMemo(
        () => [...clipPathPresets, ...customPresets],
        [customPresets],
    );
    const activePreset =
        allPresets.find((preset) => preset.id === activePresetId) ?? initialPreset;
    const symmetryPairs = useMemo(() => getSymmetryPairs(points), [points]);

    useEffect(() => {
        symmetryPairsRef.current = symmetryPairs;
    }, [symmetryPairs]);

    const filteredPresets = useMemo(() => {
        const keyword = searchQuery.trim().toLowerCase();

        return allPresets.filter((preset) => {
            const matchesCategory =
                activeCategory === "all" || preset.category === activeCategory;
            const matchesKeyword =
                keyword.length === 0 ||
                preset.name.toLowerCase().includes(keyword) ||
                preset.summary.toLowerCase().includes(keyword) ||
                preset.tags.some((tag) => tag.toLowerCase().includes(keyword));

            return matchesCategory && matchesKeyword;
        });
    }, [activeCategory, allPresets, searchQuery]);

    const safeClassName = sanitizeClassName(classNameInput);
    const clipPath = pointsToPolygon(points);
    const svgPath = pointsToSvgPath(points);
    const snippets: Record<CodeFormat, string> = {
        css: `.${safeClassName} {\n  -webkit-clip-path: ${clipPath};\n  clip-path: ${clipPath};\n}`,
        tailwind: `<div className="[clip-path:${toTailwindClipPathValue(clipPath)}]">\n  ...\n</div>`,
        jsx: `<div\n  style={{\n    WebkitClipPath: "${clipPath}",\n    clipPath: "${clipPath}",\n  }}\n>\n  ...\n</div>`,
        svg: `<svg viewBox="0 0 100 100" preserveAspectRatio="none">\n  <path d="${svgPath}" />\n</svg>`,
    };
    const previewStats = [
        { label: "Preset", value: `${allPresets.length}` },
        { label: "Custom", value: `${customPresets.length}` },
        { label: "Points", value: `${points.length}` },
        { label: "Mode", value: getReadableModeLabel(activePreset, points) },
    ];

    function resetHistory(nextPoints: Point[]) {
        const normalized = normalizePoints(nextPoints);
        setPoints(normalized);
        setHistoryState({ stack: [clonePoints(normalized)], index: 0 });
    }

    function commitPoints(nextPoints: Point[]) {
        const normalized = normalizePoints(nextPoints);
        setPoints(normalized);
        setHistoryState((current) => {
            const truncated = current.stack.slice(0, current.index + 1);
            const snapshot = truncated[truncated.length - 1];
            if (snapshot && pointsEqual(snapshot, normalized)) {
                return current;
            }
            return {
                stack: [...truncated, clonePoints(normalized)],
                index: truncated.length,
            };
        });
    }

    function applyPreset(presetId: string) {
        const preset = allPresets.find((item) => item.id === presetId);
        if (!preset) {
            return;
        }

        setActivePresetId(preset.id);
        setSelectedPointIndex(0);
        setSymmetryLock(false);
        setCustomPresetName(getDefaultCustomPresetName(preset));
        setStatusMessage(`Da chuyen sang preset ${preset.name}.`);
        resetHistory(preset.points);
    }

    function handlePointUpdate(index: number, nextPoint: Point) {
        setPoints((current) =>
            updatePointAt(
                current,
                index,
                nextPoint,
                symmetryLock ? symmetryPairsRef.current : undefined,
            ),
        );
    }

    function handleSymmetryLockChange(checked: boolean) {
        if (checked) {
            commitPoints(makeSymmetric(pointsRef.current));
        }
        setSymmetryLock(checked);
    }

    useEffect(() => {
        if (draggingPointIndex === null) {
            return;
        }

        const activeDragIndex = draggingPointIndex;

        function handlePointerMove(event: PointerEvent) {
            const bounds = editorSurfaceRef.current?.getBoundingClientRect();
            if (!bounds) {
                return;
            }

            const nextPoint = {
                x: ((event.clientX - bounds.left) / bounds.width) * 100,
                y: ((event.clientY - bounds.top) / bounds.height) * 100,
            };

            handlePointUpdate(
                activeDragIndex,
                snapToGrid ? snapPoint(nextPoint, SNAP_STEP) : normalizePoint(nextPoint),
            );
        }

        function handlePointerUp() {
            setDraggingPointIndex(null);
            commitPoints(pointsRef.current);
        }

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [draggingPointIndex, snapToGrid, symmetryLock]);

    async function handleCopy(text: string, state: CopyState) {
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

        setCopiedState(state);
        setStatusMessage("Da sao chep vao clipboard.");
    }

    return (
        <section
            id="clip-path-maker-workspace"
            className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.1),_transparent_28%)] py-16"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <span className="inline-flex rounded-full border border-[#b7e3dd] bg-white px-3 py-1 text-sm font-semibold text-[#0f766e]">
                            Clip Path Studio
                        </span>
                        <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                            Chon preset, keo diem, luu shape rieng va xuat code ngay
                        </h2>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                            Workspace moi tap trung vao 3 viec quan trong: duyet thu
                            vien shape, chinh polygon truc tiep tren canvas, va xuat
                            code sach de dua vao du an ma khong can doi cong cu.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-4">
                        {previewStats.map((item) => (
                            <div
                                key={item.label}
                                className="rounded-2xl border border-[#d7ebe7] bg-white/95 px-4 py-3 shadow-sm"
                            >
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    {item.label}
                                </p>
                                <p className="mt-1 text-2xl font-black text-slate-950">
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
                    <ClipPathPresetRail
                        activeCategory={activeCategory}
                        activePresetId={activePreset.id}
                        filteredPresets={filteredPresets}
                        onApplyPreset={applyPreset}
                        onCategoryChange={setActiveCategory}
                        onSearchChange={setSearchQuery}
                        searchQuery={searchQuery}
                    />
                    <ClipPathCanvasPanel
                        activePreset={activePreset}
                        currentModeLabel={getReadableModeLabel(activePreset, points)}
                        editorSurfaceRef={editorSurfaceRef}
                        onCanvasKeyDown={(event) => {
                            const point = points[selectedPointIndex] ?? points[0];
                            if (!point) {
                                return;
                            }
                            const step = event.shiftKey ? SNAP_STEP : 1;
                            const deltas: Record<string, Point> = {
                                ArrowLeft: { x: point.x - step, y: point.y },
                                ArrowRight: { x: point.x + step, y: point.y },
                                ArrowUp: { x: point.x, y: point.y - step },
                                ArrowDown: { x: point.x, y: point.y + step },
                            };
                            const nextPoint = deltas[event.key];
                            if (!nextPoint) {
                                return;
                            }
                            event.preventDefault();
                            commitPoints(
                                updatePointAt(
                                    pointsRef.current,
                                    selectedPointIndex,
                                    nextPoint,
                                    symmetryLock ? symmetryPairsRef.current : undefined,
                                ),
                            );
                        }}
                        onPreviewModeChange={setPreviewMode}
                        onRandomize={() =>
                            commitPoints(randomizePoints(pointsRef.current, 6))
                        }
                        onSelectPoint={setSelectedPointIndex}
                        onSetShowGrid={setShowGrid}
                        onSetSnapToGrid={setSnapToGrid}
                        onSetSymmetryLock={handleSymmetryLockChange}
                        onStartDrag={(index) => {
                            setSelectedPointIndex(index);
                            setDraggingPointIndex(index);
                        }}
                        points={points}
                        previewMode={previewMode}
                        selectedPointIndex={selectedPointIndex}
                        showGrid={showGrid}
                        snapLabel={snapToGrid ? `Snap ${SNAP_STEP}%` : "Free move"}
                        snapToGrid={snapToGrid}
                        symmetryLock={symmetryLock}
                    />
                    <ClipPathInspectorPanel
                        activePreset={activePreset}
                        classNameInput={classNameInput}
                        codeFormat={codeFormat}
                        copiedState={copiedState}
                        currentPoint={points[selectedPointIndex] ?? points[0]}
                        customPresetName={customPresetName}
                        historyIndex={historyState.index}
                        historyLength={historyState.stack.length}
                        onAddPoint={() => {
                            const next = insertPointAfter(
                                pointsRef.current,
                                selectedPointIndex,
                            );
                            setSelectedPointIndex(
                                Math.min(selectedPointIndex + 1, next.length - 1),
                            );
                            commitPoints(next);
                        }}
                        onClassNameChange={setClassNameInput}
                        onCodeFormatChange={setCodeFormat}
                        onCopy={handleCopy}
                        onCurrentPointChange={(axis, value) => {
                            const point = pointsRef.current[selectedPointIndex];
                            if (!point) {
                                return;
                            }
                            handlePointUpdate(selectedPointIndex, {
                                ...point,
                                [axis]: value,
                            });
                        }}
                        onCurrentPointCommit={() => commitPoints(pointsRef.current)}
                        onExpand={() =>
                            commitPoints(scalePoints(pointsRef.current, 1.06, 1.06))
                        }
                        onJitter={() => commitPoints(randomizePoints(pointsRef.current, 5))}
                        onMakeSymmetric={() =>
                            commitPoints(makeSymmetric(pointsRef.current))
                        }
                        onNarrow={() =>
                            commitPoints(scalePoints(pointsRef.current, 0.92, 1))
                        }
                        onRandomize={() =>
                            commitPoints(randomizePoints(pointsRef.current, 6))
                        }
                        onRedo={() => {
                            if (historyState.index >= historyState.stack.length - 1) {
                                return;
                            }
                            const nextIndex = historyState.index + 1;
                            setHistoryState((current) => ({
                                ...current,
                                index: nextIndex,
                            }));
                            setPoints(clonePoints(historyState.stack[nextIndex]));
                        }}
                        onRemovePoint={() => {
                            if (pointsRef.current.length <= 3) {
                                return;
                            }
                            const next = removePointAt(
                                pointsRef.current,
                                selectedPointIndex,
                            );
                            setSelectedPointIndex(
                                Math.min(selectedPointIndex, next.length - 1),
                            );
                            commitPoints(next);
                        }}
                        onReset={() => applyPreset(activePreset.id)}
                        onSaveCustomPreset={() => {
                            const trimmedName =
                                customPresetName.trim() ||
                                getDefaultCustomPresetName(activePreset);
                            const nextPreset = createCustomPreset(
                                trimmedName,
                                pointsRef.current,
                                activePreset,
                                activePreset.category === "custom"
                                    ? activePreset.id
                                    : undefined,
                            );
                            setCustomPresets((current) => {
                                const withoutCurrent = current.filter(
                                    (preset) => preset.id !== nextPreset.id,
                                );
                                return [nextPreset, ...withoutCurrent];
                            });
                            setActivePresetId(nextPreset.id);
                            setActiveCategory("custom");
                            setCustomPresetName(nextPreset.name);
                            resetHistory(pointsRef.current);
                            setStatusMessage(`Da luu shape ${nextPreset.name}.`);
                        }}
                        onShrink={() =>
                            commitPoints(scalePoints(pointsRef.current, 0.94, 0.94))
                        }
                        onStretchHorizontal={() =>
                            commitPoints(scalePoints(pointsRef.current, 1.08, 1))
                        }
                        onStretchVertical={() =>
                            commitPoints(scalePoints(pointsRef.current, 1, 1.08))
                        }
                        onUndo={() => {
                            if (historyState.index === 0) {
                                return;
                            }
                            const nextIndex = historyState.index - 1;
                            setHistoryState((current) => ({
                                ...current,
                                index: nextIndex,
                            }));
                            setPoints(clonePoints(historyState.stack[nextIndex]));
                        }}
                        onUpdateCustomPresetName={setCustomPresetName}
                        points={points}
                        safeClassName={safeClassName}
                        selectedPointIndex={selectedPointIndex}
                        snippets={snippets}
                        svgPath={svgPath}
                    />
                </div>
            </div>

            <p className="sr-only" aria-live="polite">
                {statusMessage}
            </p>
        </section>
    );
}
