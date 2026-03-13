"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Copy,
    Check,
    RotateCcw,
    Undo2,
    Redo2,
    X,
    Settings2,
} from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

/* ────────────────────────────── types ────────────────────────────── */

type TrackUnit =
    | "fr"
    | "px"
    | "%"
    | "em"
    | "min-content"
    | "max-content"
    | "auto";

type TrackDef = { value: number; unit: TrackUnit };

type GridState = {
    columns: TrackDef[];
    rows: TrackDef[];
    columnGap: { value: number; unit: "px" | "%" | "em" };
    rowGap: { value: number; unit: "px" | "%" | "em" };
    areas: string[][]; // areas[row][col] — area name or "."
    containerClass: string;
};

type HistoryState = {
    stack: GridState[];
    index: number;
};

type CopyTarget = "html" | "css" | null;

type ExportSettings = {
    useRepeat: boolean;
    useAreas: boolean;
};

/** Selection rectangle while dragging: { fromRow, fromCol, toRow, toCol } */
type DragSelection = {
    fromRow: number;
    fromCol: number;
    toRow: number;
    toCol: number;
};

/* ────────────────────────────── constants ────────────────────────── */

const TRACK_UNITS: TrackUnit[] = [
    "fr",
    "px",
    "%",
    "em",
    "min-content",
    "max-content",
    "auto",
];
const GAP_UNITS: ("px" | "%" | "em")[] = ["px", "%", "em"];
const DEFAULT_TRACK: TrackDef = { value: 1, unit: "fr" };

/* ── Area color palette for visual distinction ── */
const AREA_COLORS = [
    {
        bg: "bg-cyan-500/18",
        border: "border-cyan-400/40",
        text: "text-cyan-200",
    },
    {
        bg: "bg-emerald-500/18",
        border: "border-emerald-400/40",
        text: "text-emerald-200",
    },
    {
        bg: "bg-amber-500/18",
        border: "border-amber-400/40",
        text: "text-amber-200",
    },
    {
        bg: "bg-rose-500/18",
        border: "border-rose-400/40",
        text: "text-rose-200",
    },
    {
        bg: "bg-violet-500/18",
        border: "border-violet-400/40",
        text: "text-violet-200",
    },
    { bg: "bg-sky-500/18", border: "border-sky-400/40", text: "text-sky-200" },
    {
        bg: "bg-orange-500/18",
        border: "border-orange-400/40",
        text: "text-orange-200",
    },
    {
        bg: "bg-pink-500/18",
        border: "border-pink-400/40",
        text: "text-pink-200",
    },
];

function createDefaultState(): GridState {
    return {
        columns: [
            { value: 1, unit: "fr" },
            { value: 1, unit: "fr" },
            { value: 1, unit: "fr" },
        ],
        rows: [
            { value: 1, unit: "fr" },
            { value: 1, unit: "fr" },
            { value: 1, unit: "fr" },
        ],
        columnGap: { value: 0, unit: "px" },
        rowGap: { value: 0, unit: "px" },
        areas: [
            [".", ".", "."],
            [".", ".", "."],
            [".", ".", "."],
        ],
        containerClass: ".container",
    };
}

function deepClone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}

function syncAreas(areas: string[][], rows: number, cols: number): string[][] {
    const result: string[][] = [];
    for (let r = 0; r < rows; r++) {
        const row: string[] = [];
        for (let c = 0; c < cols; c++) {
            row.push(areas[r]?.[c] ?? ".");
        }
        result.push(row);
    }
    return result;
}

/** Normalise a drag selection so that from <= to */
function normaliseDragSelection(sel: DragSelection) {
    return {
        fromRow: Math.min(sel.fromRow, sel.toRow),
        fromCol: Math.min(sel.fromCol, sel.toCol),
        toRow: Math.max(sel.fromRow, sel.toRow),
        toCol: Math.max(sel.fromCol, sel.toCol),
    };
}

function isCellInSelection(
    row: number,
    col: number,
    sel: DragSelection | null,
): boolean {
    if (!sel) return false;
    const n = normaliseDragSelection(sel);
    return (
        row >= n.fromRow && row <= n.toRow && col >= n.fromCol && col <= n.toCol
    );
}

/* ────────────────────────── code generation ──────────────────────── */

function trackToString(track: TrackDef): string {
    if (
        track.unit === "min-content" ||
        track.unit === "max-content" ||
        track.unit === "auto"
    ) {
        return track.unit;
    }
    return `${track.value}${track.unit}`;
}

function tracksToTemplate(tracks: TrackDef[], useRepeat: boolean): string {
    if (!useRepeat) {
        return tracks.map(trackToString).join(" ");
    }
    const allSame = tracks.every(
        (t) => t.value === tracks[0].value && t.unit === tracks[0].unit,
    );
    if (allSame && tracks.length > 1) {
        return `repeat(${tracks.length}, ${trackToString(tracks[0])})`;
    }
    return tracks.map(trackToString).join(" ");
}

function hasNamedAreas(areas: string[][]): boolean {
    return areas.some((row) => row.some((cell) => cell !== "."));
}

function generateCss(state: GridState, settings: ExportSettings): string {
    const lines: string[] = [];
    lines.push(`${state.containerClass} {`);
    lines.push(`  display: grid;`);
    lines.push(
        `  grid-template-columns: ${tracksToTemplate(state.columns, settings.useRepeat)};`,
    );
    lines.push(
        `  grid-template-rows: ${tracksToTemplate(state.rows, settings.useRepeat)};`,
    );
    lines.push(
        `  gap: ${state.rowGap.value}${state.rowGap.unit} ${state.columnGap.value}${state.columnGap.unit};`,
    );

    if (settings.useAreas && hasNamedAreas(state.areas)) {
        lines.push(`  grid-template-areas:`);
        for (const row of state.areas) {
            lines.push(`    "${row.join(" ")}"`);
        }
        lines[lines.length - 1] = lines[lines.length - 1] + ";";
    }
    lines.push(`}`);

    if (settings.useAreas && hasNamedAreas(state.areas)) {
        const uniqueAreas = new Set<string>();
        for (const row of state.areas) {
            for (const cell of row) {
                if (cell !== ".") uniqueAreas.add(cell);
            }
        }
        lines.push("");
        for (const area of uniqueAreas) {
            lines.push(`.${area} { grid-area: ${area}; }`);
        }
    }
    return lines.join("\n");
}

function generateHtml(state: GridState, settings: ExportSettings): string {
    const uniqueAreas: string[] = [];
    if (settings.useAreas && hasNamedAreas(state.areas)) {
        const seen = new Set<string>();
        for (const row of state.areas) {
            for (const cell of row) {
                if (cell !== "." && !seen.has(cell)) {
                    seen.add(cell);
                    uniqueAreas.push(cell);
                }
            }
        }
    }

    const lines: string[] = [];
    const containerTag = state.containerClass.replace(/^\./, "");
    lines.push(`<div class="${containerTag}">`);

    if (uniqueAreas.length > 0) {
        for (const area of uniqueAreas) {
            lines.push(`  <div class="${area}"></div>`);
        }
    } else {
        const totalCells = state.rows.length * state.columns.length;
        for (let i = 1; i <= totalCells; i++) {
            lines.push(`  <div class="item-${i}"></div>`);
        }
    }
    lines.push(`</div>`);
    return lines.join("\n");
}

/* ────────────────────── helper: area color map ────────────────────── */

function getAreaColorMap(areas: string[][]) {
    const map = new Map<string, (typeof AREA_COLORS)[number]>();
    let idx = 0;
    for (const row of areas) {
        for (const cell of row) {
            if (cell !== "." && !map.has(cell)) {
                map.set(cell, AREA_COLORS[idx % AREA_COLORS.length]);
                idx++;
            }
        }
    }
    return map;
}

/* ────────────────────────── sub-components ───────────────────────── */

function TrackInput({
    track,
    onChange,
    onRemove,
}: {
    track: TrackDef;
    onChange: (t: TrackDef) => void;
    onRemove: () => void;
}) {
    const needsValue = !["min-content", "max-content", "auto"].includes(
        track.unit,
    );

    return (
        <div className="flex items-center gap-1.5">
            {needsValue && (
                <input
                    type="number"
                    min={0}
                    step={track.unit === "fr" ? 1 : 10}
                    value={track.value}
                    onChange={(e) =>
                        onChange({
                            ...track,
                            value: Math.max(0, Number(e.target.value) || 0),
                        })
                    }
                    className="h-8 w-16 rounded-md border border-white/15 bg-white/8 px-2 text-center text-sm text-white outline-none focus:border-cyan-400/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
            )}
            <select
                value={track.unit}
                onChange={(e) => {
                    const nextUnit = e.target.value as TrackUnit;
                    const nextValue = [
                        "min-content",
                        "max-content",
                        "auto",
                    ].includes(nextUnit)
                        ? 0
                        : track.value || 1;
                    onChange({ value: nextValue, unit: nextUnit });
                }}
                className="h-8 min-w-[60px] rounded-md border border-white/15 bg-white/8 px-1.5 text-sm text-white outline-none focus:border-cyan-400/50"
            >
                {TRACK_UNITS.map((u) => (
                    <option key={u} value={u}>
                        {u}
                    </option>
                ))}
            </select>
            <button
                type="button"
                onClick={onRemove}
                className="flex size-8 items-center justify-center rounded-md bg-pink-600/80 text-white transition-colors hover:bg-pink-500"
                title="remove"
            >
                <X className="size-3.5" />
            </button>
        </div>
    );
}

/** Syntax-highlighted code block with Prism.js */
function HighlightedCodeBlock({
    code,
    language,
    label,
    copied,
    onCopy,
}: {
    code: string;
    language: "markup" | "css";
    label: string;
    copied: boolean;
    onCopy: () => void;
}) {
    const highlighted = useMemo(() => {
        try {
            return Prism.highlight(code, Prism.languages[language], language);
        } catch {
            return code;
        }
    }, [code, language]);

    return (
        <div className="flex flex-col overflow-hidden rounded-lg border border-white/8 bg-[#0d0d1a]">
            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-white/6 bg-white/[0.03] px-3 py-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {label}
                </span>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onCopy}
                    className="h-6 gap-1 rounded px-1.5 text-[10px] font-medium text-slate-500 hover:bg-white/8 hover:text-white"
                >
                    {copied ? (
                        <>
                            <Check className="size-3" />
                            Copied
                        </>
                    ) : (
                        <>
                            <Copy className="size-3" />
                            Copy
                        </>
                    )}
                </Button>
            </div>
            {/* Code body */}
            <ScrollArea className="max-h-[260px]">
                <pre className="overflow-x-auto p-3 font-mono text-[12px] leading-[1.7]">
                    <code
                        className="prism-code"
                        dangerouslySetInnerHTML={{ __html: highlighted }}
                    />
                </pre>
            </ScrollArea>
        </div>
    );
}

/* ────────────────────── main component ────────────────────────────── */

export function CssGridGenerator() {
    const [state, setState] = useState<GridState>(createDefaultState);
    const [history, setHistory] = useState<HistoryState>(() => ({
        stack: [deepClone(createDefaultState())],
        index: 0,
    }));
    const [copyState, setCopyState] = useState<CopyTarget>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState<ExportSettings>({
        useRepeat: true,
        useAreas: true,
    });

    /* ── Drag selection state ── */
    const [dragSelection, setDragSelection] = useState<DragSelection | null>(
        null,
    );
    const [isDragging, setIsDragging] = useState(false);
    const [namingSelection, setNamingSelection] =
        useState<DragSelection | null>(null);
    const [namingValue, setNamingValue] = useState("");
    const namingInputRef = useRef<HTMLInputElement>(null);

    // ─── history helpers ───
    const commit = useCallback((next: GridState) => {
        setState(next);
        setHistory((h) => {
            const newStack = h.stack
                .slice(0, h.index + 1)
                .concat(deepClone(next))
                .slice(-50);
            return { stack: newStack, index: newStack.length - 1 };
        });
    }, []);

    const undo = useCallback(() => {
        setHistory((h) => {
            if (h.index <= 0) return h;
            const nextIndex = h.index - 1;
            setState(deepClone(h.stack[nextIndex]));
            return { ...h, index: nextIndex };
        });
    }, []);

    const redo = useCallback(() => {
        setHistory((h) => {
            if (h.index >= h.stack.length - 1) return h;
            const nextIndex = h.index + 1;
            setState(deepClone(h.stack[nextIndex]));
            return { ...h, index: nextIndex };
        });
    }, []);

    const restart = useCallback(() => {
        const fresh = createDefaultState();
        setState(fresh);
        setHistory({ stack: [deepClone(fresh)], index: 0 });
        setDragSelection(null);
        setNamingSelection(null);
    }, []);

    // ─── track mutation helpers ───
    const updateColumn = (index: number, track: TrackDef) => {
        const next = deepClone(state);
        next.columns[index] = track;
        commit(next);
    };

    const addColumn = () => {
        const next = deepClone(state);
        next.columns.push({ ...DEFAULT_TRACK });
        next.areas = syncAreas(
            next.areas,
            next.rows.length,
            next.columns.length,
        );
        commit(next);
    };

    const removeColumn = (index: number) => {
        if (state.columns.length <= 1) return;
        const next = deepClone(state);
        next.columns.splice(index, 1);
        next.areas = next.areas.map((row) => {
            const r = [...row];
            r.splice(index, 1);
            return r;
        });
        commit(next);
    };

    const updateRow = (index: number, track: TrackDef) => {
        const next = deepClone(state);
        next.rows[index] = track;
        commit(next);
    };

    const addRow = () => {
        const next = deepClone(state);
        next.rows.push({ ...DEFAULT_TRACK });
        next.areas = syncAreas(
            next.areas,
            next.rows.length,
            next.columns.length,
        );
        commit(next);
    };

    const removeRow = (index: number) => {
        if (state.rows.length <= 1) return;
        const next = deepClone(state);
        next.rows.splice(index, 1);
        next.areas.splice(index, 1);
        commit(next);
    };

    // ─── gap helpers ───
    const updateRowGap = (value: number) => {
        const next = deepClone(state);
        next.rowGap.value = Math.max(0, value);
        commit(next);
    };
    const updateColumnGap = (value: number) => {
        const next = deepClone(state);
        next.columnGap.value = Math.max(0, value);
        commit(next);
    };
    const updateRowGapUnit = (unit: "px" | "%" | "em") => {
        const next = deepClone(state);
        next.rowGap.unit = unit;
        commit(next);
    };
    const updateColumnGapUnit = (unit: "px" | "%" | "em") => {
        const next = deepClone(state);
        next.columnGap.unit = unit;
        commit(next);
    };

    /* ══════════════════════════════════════════════════════════════════
       DRAG-TO-SELECT AREA
       ══════════════════════════════════════════════════════════════════ */

    const handleCellPointerDown = (row: number, col: number) => {
        // If the cell already belongs to a named area, click to rename / clear
        const existing = state.areas[row]?.[col];
        if (existing && existing !== ".") {
            // Open renaming dialog for this area
            // Find the full rect of this area
            let minR = row,
                maxR = row,
                minC = col,
                maxC = col;
            for (let r = 0; r < state.rows.length; r++) {
                for (let c = 0; c < state.columns.length; c++) {
                    if (state.areas[r][c] === existing) {
                        minR = Math.min(minR, r);
                        maxR = Math.max(maxR, r);
                        minC = Math.min(minC, c);
                        maxC = Math.max(maxC, c);
                    }
                }
            }
            setNamingSelection({
                fromRow: minR,
                fromCol: minC,
                toRow: maxR,
                toCol: maxC,
            });
            setNamingValue(existing);
            return;
        }

        setIsDragging(true);
        setDragSelection({
            fromRow: row,
            fromCol: col,
            toRow: row,
            toCol: col,
        });
        setNamingSelection(null);
    };

    const handleCellPointerEnter = (row: number, col: number) => {
        if (!isDragging) return;
        setDragSelection((prev) =>
            prev ? { ...prev, toRow: row, toCol: col } : null,
        );
    };

    const handlePointerUp = () => {
        if (!isDragging || !dragSelection) {
            setIsDragging(false);
            return;
        }
        setIsDragging(false);

        const sel = normaliseDragSelection(dragSelection);
        // Check if the rectangle is unoccupied
        let canPlace = true;
        for (let r = sel.fromRow; r <= sel.toRow; r++) {
            for (let c = sel.fromCol; c <= sel.toCol; c++) {
                if (state.areas[r]?.[c] !== ".") {
                    canPlace = false;
                    break;
                }
            }
            if (!canPlace) break;
        }

        if (!canPlace) {
            setDragSelection(null);
            return;
        }

        // Show naming input for this rectangle
        setNamingSelection(sel);
        setNamingValue("");
        setDragSelection(null);
    };

    const saveNaming = () => {
        if (!namingSelection) return;
        const sanitized = namingValue.trim().replace(/[^a-zA-Z0-9_-]/g, "");
        const sel = normaliseDragSelection(namingSelection);
        const next = deepClone(state);

        if (!sanitized) {
            // Clear: set cells back to "."
            for (let r = sel.fromRow; r <= sel.toRow; r++) {
                for (let c = sel.fromCol; c <= sel.toCol; c++) {
                    next.areas[r][c] = ".";
                }
            }
        } else {
            // First clear any old cells with the same name (prevent duplication)
            for (let r = 0; r < next.areas.length; r++) {
                for (let c = 0; c < next.areas[r].length; c++) {
                    if (next.areas[r][c] === sanitized) {
                        next.areas[r][c] = ".";
                    }
                }
            }
            // Also clear the old area name in the selection region
            const oldName = state.areas[sel.fromRow]?.[sel.fromCol];
            if (oldName && oldName !== ".") {
                for (let r = 0; r < next.areas.length; r++) {
                    for (let c = 0; c < next.areas[r].length; c++) {
                        if (next.areas[r][c] === oldName) {
                            next.areas[r][c] = ".";
                        }
                    }
                }
            }

            for (let r = sel.fromRow; r <= sel.toRow; r++) {
                for (let c = sel.fromCol; c <= sel.toCol; c++) {
                    next.areas[r][c] = sanitized;
                }
            }
        }

        commit(next);
        setNamingSelection(null);
        setNamingValue("");
    };

    const cancelNaming = () => {
        setNamingSelection(null);
        setNamingValue("");
    };

    // Global pointer up listener for drag release even outside grid
    useEffect(() => {
        if (!isDragging) return;
        const up = () => handlePointerUp();
        window.addEventListener("pointerup", up);
        return () => window.removeEventListener("pointerup", up);
    });

    // Focus naming input
    useEffect(() => {
        if (namingSelection && namingInputRef.current) {
            namingInputRef.current.focus();
            namingInputRef.current.select();
        }
    }, [namingSelection]);

    // Clear copy state
    useEffect(() => {
        if (!copyState) return;
        const timer = setTimeout(() => setCopyState(null), 2000);
        return () => clearTimeout(timer);
    }, [copyState]);

    // ─── generated code ───
    const cssOutput = useMemo(
        () => generateCss(state, settings),
        [state, settings],
    );
    const htmlOutput = useMemo(
        () => generateHtml(state, settings),
        [state, settings],
    );
    const areaColorMap = useMemo(
        () => getAreaColorMap(state.areas),
        [state.areas],
    );

    const handleCopy = async (target: CopyTarget, text: string) => {
        await navigator.clipboard.writeText(text);
        setCopyState(target);
    };

    const gridTemplateColumns = state.columns.map(trackToString).join(" ");
    const gridTemplateRows = state.rows.map(trackToString).join(" ");

    /* ══════════════════════════════════════════════════════════════════
       RENDER
       ══════════════════════════════════════════════════════════════════ */
    return (
        <div className="flex h-[calc(100vh-56px)] min-h-[600px] select-none overflow-hidden bg-[#1e1e2e] text-sm text-slate-200">
            {/* ═══════════ LEFT SIDEBAR ═══════════ */}
            <aside className="flex w-[260px] shrink-0 flex-col border-r border-white/10 bg-[#252536]">
                {/* Container class name */}
                <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
                    <input
                        type="text"
                        value={state.containerClass}
                        onChange={(e) => {
                            const next = deepClone(state);
                            next.containerClass =
                                e.target.value || ".container";
                            commit(next);
                        }}
                        className="h-8 flex-1 rounded-md border border-white/15 bg-white/8 px-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
                    />
                </div>

                <ScrollArea className="flex-1">
                    <div className="px-4 py-4 space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            Explicit Grid
                        </h3>

                        {/* Columns */}
                        <section>
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-semibold text-cyan-300">
                                    grid-template-columns
                                </span>
                                <button
                                    type="button"
                                    onClick={addColumn}
                                    className="rounded-md bg-cyan-600 px-2 py-1 text-[11px] font-bold text-white transition-colors hover:bg-cyan-500"
                                >
                                    add
                                </button>
                            </div>
                            <div className="space-y-2">
                                {state.columns.map((col, i) => (
                                    <TrackInput
                                        key={`col-${i}`}
                                        track={col}
                                        onChange={(t) => updateColumn(i, t)}
                                        onRemove={() => removeColumn(i)}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* Rows */}
                        <section>
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-semibold text-cyan-300">
                                    grid-template-rows
                                </span>
                                <button
                                    type="button"
                                    onClick={addRow}
                                    className="rounded-md bg-cyan-600 px-2 py-1 text-[11px] font-bold text-white transition-colors hover:bg-cyan-500"
                                >
                                    add
                                </button>
                            </div>
                            <div className="space-y-2">
                                {state.rows.map((row, i) => (
                                    <TrackInput
                                        key={`row-${i}`}
                                        track={row}
                                        onChange={(t) => updateRow(i, t)}
                                        onRemove={() => removeRow(i)}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* Gap */}
                        <section>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <span className="mb-1.5 block text-xs text-slate-400">
                                        row-gap
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min={0}
                                            value={state.rowGap.value}
                                            onChange={(e) =>
                                                updateRowGap(
                                                    Number(e.target.value) || 0,
                                                )
                                            }
                                            className="h-8 w-14 rounded-md border border-white/15 bg-white/8 px-2 text-center text-sm text-white outline-none focus:border-cyan-400/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        />
                                        <select
                                            value={state.rowGap.unit}
                                            onChange={(e) =>
                                                updateRowGapUnit(
                                                    e.target.value as
                                                        | "px"
                                                        | "%"
                                                        | "em",
                                                )
                                            }
                                            className="h-8 rounded-md border border-white/15 bg-white/8 px-1 text-sm text-white outline-none"
                                        >
                                            {GAP_UNITS.map((u) => (
                                                <option key={u} value={u}>
                                                    {u}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <span className="mb-1.5 block text-xs text-slate-400">
                                        column-gap
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min={0}
                                            value={state.columnGap.value}
                                            onChange={(e) =>
                                                updateColumnGap(
                                                    Number(e.target.value) || 0,
                                                )
                                            }
                                            className="h-8 w-14 rounded-md border border-white/15 bg-white/8 px-2 text-center text-sm text-white outline-none focus:border-cyan-400/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        />
                                        <select
                                            value={state.columnGap.unit}
                                            onChange={(e) =>
                                                updateColumnGapUnit(
                                                    e.target.value as
                                                        | "px"
                                                        | "%"
                                                        | "em",
                                                )
                                            }
                                            className="h-8 rounded-md border border-white/15 bg-white/8 px-1 text-sm text-white outline-none"
                                        >
                                            {GAP_UNITS.map((u) => (
                                                <option key={u} value={u}>
                                                    {u}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </ScrollArea>
            </aside>

            {/* ═══════════ CENTER CANVAS ═══════════ */}
            <main
                className="relative flex flex-1 flex-col overflow-hidden bg-[#1e1e2e]"
                onPointerUp={handlePointerUp}
            >
                {/* Column line numbers (top) */}
                <div
                    className="flex shrink-0"
                    style={{ paddingLeft: 32, paddingRight: 16 }}
                >
                    <div
                        className="relative flex w-full"
                        style={{
                            display: "grid",
                            gridTemplateColumns,
                            gap: `0 ${state.columnGap.value}${state.columnGap.unit}`,
                        }}
                    >
                        {state.columns.map((_, i) => (
                            <div key={`cn-${i}`} className="relative h-6">
                                <span className="absolute -left-1.5 top-0 text-[11px] text-slate-500">
                                    {i + 1}
                                </span>
                                {i === state.columns.length - 1 && (
                                    <span className="absolute -right-1.5 top-0 text-[11px] text-slate-500">
                                        {i + 2}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Grid + row numbers */}
                <div className="flex flex-1 overflow-auto p-4 pt-0">
                    {/* Row line numbers (left) */}
                    <div
                        className="mr-2 flex shrink-0 flex-col"
                        style={{
                            display: "grid",
                            gridTemplateRows,
                            gap: `${state.rowGap.value}${state.rowGap.unit} 0`,
                        }}
                    >
                        {state.rows.map((_, i) => (
                            <div key={`rn-${i}`} className="relative">
                                <span className="absolute -top-1.5 right-1 text-[11px] text-slate-500">
                                    {i + 1}
                                </span>
                                {i === state.rows.length - 1 && (
                                    <span className="absolute -bottom-1.5 right-1 text-[11px] text-slate-500">
                                        {i + 2}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Grid canvas */}
                    <div
                        className="relative flex-1 rounded-lg border border-dashed border-slate-600/50"
                        style={{
                            display: "grid",
                            gridTemplateColumns,
                            gridTemplateRows,
                            gap: `${state.rowGap.value}${state.rowGap.unit} ${state.columnGap.value}${state.columnGap.unit}`,
                        }}
                    >
                        {state.areas.map((row, rIdx) =>
                            row.map((cell, cIdx) => {
                                const hasArea = cell !== ".";
                                const inSelection = isCellInSelection(
                                    rIdx,
                                    cIdx,
                                    dragSelection,
                                );
                                const inNaming = isCellInSelection(
                                    rIdx,
                                    cIdx,
                                    namingSelection,
                                );
                                const color = hasArea
                                    ? areaColorMap.get(cell)
                                    : null;

                                // Show naming input at center of the naming selection range
                                const namingSel = namingSelection
                                    ? normaliseDragSelection(namingSelection)
                                    : null;
                                const isCenterOfNaming =
                                    namingSel &&
                                    rIdx ===
                                        Math.floor(
                                            (namingSel.fromRow +
                                                namingSel.toRow) /
                                                2,
                                        ) &&
                                    cIdx ===
                                        Math.floor(
                                            (namingSel.fromCol +
                                                namingSel.toCol) /
                                                2,
                                        );

                                return (
                                    <div
                                        key={`${rIdx}-${cIdx}`}
                                        className={cn(
                                            "relative flex items-center justify-center border transition-colors",
                                            hasArea
                                                ? cn(
                                                      "border-solid",
                                                      color?.bg ??
                                                          "bg-cyan-500/18",
                                                      color?.border ??
                                                          "border-cyan-400/40",
                                                  )
                                                : "border-dashed border-slate-600/40 bg-white/[0.02]",
                                            !hasArea &&
                                                !inSelection &&
                                                !inNaming &&
                                                "hover:bg-white/[0.06]",
                                            inSelection &&
                                                "bg-cyan-500/25 border-cyan-400/50",
                                            inNaming &&
                                                "bg-cyan-500/20 border-cyan-400/40 ring-1 ring-cyan-400/30",
                                            isDragging
                                                ? "cursor-crosshair"
                                                : "cursor-pointer",
                                        )}
                                        onPointerDown={(e) => {
                                            e.preventDefault();
                                            handleCellPointerDown(rIdx, cIdx);
                                        }}
                                        onPointerEnter={() =>
                                            handleCellPointerEnter(rIdx, cIdx)
                                        }
                                    >
                                        {/* Area label */}
                                        {hasArea && !inNaming && (
                                            <span
                                                className={cn(
                                                    "text-xs font-medium select-none",
                                                    color?.text ??
                                                        "text-cyan-200",
                                                )}
                                            >
                                                {cell}
                                            </span>
                                        )}

                                        {/* Naming input — rendered at the center cell of the naming selection */}
                                        {isCenterOfNaming && (
                                            <div
                                                className="absolute inset-0 z-20 flex items-center justify-center"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                onPointerDown={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <input
                                                    ref={namingInputRef}
                                                    type="text"
                                                    value={namingValue}
                                                    onChange={(e) =>
                                                        setNamingValue(
                                                            e.target.value,
                                                        )
                                                    }
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter")
                                                            saveNaming();
                                                        if (e.key === "Escape")
                                                            cancelNaming();
                                                    }}
                                                    onBlur={saveNaming}
                                                    className="h-8 w-full max-w-[140px] rounded-md border border-cyan-400/60 bg-[#1a1a2e] px-3 text-center text-xs font-medium text-white shadow-lg shadow-cyan-500/10 outline-none placeholder:text-slate-500"
                                                    placeholder="area name"
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            }),
                        )}
                    </div>
                </div>

                {/* Column track labels (bottom) */}
                <div
                    className="flex shrink-0 px-4 pb-2"
                    style={{ paddingLeft: 48 }}
                >
                    <div
                        className="flex w-full"
                        style={{
                            display: "grid",
                            gridTemplateColumns,
                            gap: `0 ${state.columnGap.value}${state.columnGap.unit}`,
                        }}
                    >
                        {state.columns.map((col, i) => (
                            <div
                                key={`cl-${i}`}
                                className="flex items-center justify-center"
                            >
                                <span className="text-[11px] text-slate-500">
                                    {trackToString(col)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Row track labels (right edge) */}
                <div
                    className="pointer-events-none absolute right-1 top-6 bottom-8 flex flex-col"
                    style={{
                        display: "grid",
                        gridTemplateRows,
                        gap: `${state.rowGap.value}${state.rowGap.unit} 0`,
                    }}
                >
                    {state.rows.map((row, i) => (
                        <div
                            key={`rl-${i}`}
                            className="flex items-center justify-center"
                        >
                            <span className="text-[11px] text-slate-500">
                                {trackToString(row)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Drag hint */}
                {!isDragging &&
                    !namingSelection &&
                    !hasNamedAreas(state.areas) && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <p className="rounded-lg bg-white/5 px-4 py-2 text-xs text-slate-500 backdrop-blur-sm">
                                Kéo chuột qua các ô để tạo area · Click ô có tên
                                để đổi tên
                            </p>
                        </div>
                    )}
            </main>

            {/* ═══════════ RIGHT PANEL ═══════════ */}
            <aside className="flex w-[320px] shrink-0 flex-col overflow-hidden border-l border-white/10 bg-[#252536]">
                {/* Toolbar */}
                <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
                    <div className="flex items-center gap-1">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={undo}
                            disabled={history.index <= 0}
                            className="h-8 w-8 p-0 text-slate-400 hover:bg-white/8 hover:text-white disabled:opacity-30"
                            title="Undo"
                        >
                            <Undo2 className="size-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={redo}
                            disabled={history.index >= history.stack.length - 1}
                            className="h-8 w-8 p-0 text-slate-400 hover:bg-white/8 hover:text-white disabled:opacity-30"
                            title="Redo"
                        >
                            <Redo2 className="size-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={restart}
                            className="h-8 w-8 p-0 text-slate-400 hover:bg-white/8 hover:text-white"
                            title="Restart"
                        >
                            <RotateCcw className="size-4" />
                        </Button>
                    </div>

                    {/* Settings toggle */}
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowSettings(!showSettings)}
                        className={cn(
                            "h-8 w-8 p-0 transition-colors",
                            showSettings
                                ? "text-cyan-400 hover:bg-white/8 hover:text-cyan-300"
                                : "text-slate-400 hover:bg-white/8 hover:text-white",
                        )}
                        title="Settings"
                    >
                        <Settings2 className="size-4" />
                    </Button>
                </div>

                {/* Settings panel */}
                {showSettings && (
                    <div className="space-y-2.5 border-b border-white/8 bg-white/[0.03] px-4 py-3">
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.useRepeat}
                                onChange={(e) =>
                                    setSettings((s) => ({
                                        ...s,
                                        useRepeat: e.target.checked,
                                    }))
                                }
                                className="accent-cyan-500"
                            />
                            Use repeat() function
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.useAreas}
                                onChange={(e) =>
                                    setSettings((s) => ({
                                        ...s,
                                        useAreas: e.target.checked,
                                    }))
                                }
                                className="accent-cyan-500"
                            />
                            Use grid-template-areas for positioning
                        </label>
                    </div>
                )}

                {/* Code blocks — both HTML and CSS visible */}
                <ScrollArea className="flex-1">
                    <div className="space-y-3 px-3 pt-3 pb-3">
                        <HighlightedCodeBlock
                            code={htmlOutput}
                            language="markup"
                            label="HTML"
                            copied={copyState === "html"}
                            onCopy={() => handleCopy("html", htmlOutput)}
                        />
                        <HighlightedCodeBlock
                            code={cssOutput}
                            language="css"
                            label="CSS"
                            copied={copyState === "css"}
                            onCopy={() => handleCopy("css", cssOutput)}
                        />
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="flex items-center justify-center gap-2 border-t border-white/8 px-4 py-3 text-[11px] text-slate-500">
                    <span>CSS Grid Generator</span>
                    <span>•</span>
                    <span>CodeSense AIoT</span>
                </div>
            </aside>
        </div>
    );
}
