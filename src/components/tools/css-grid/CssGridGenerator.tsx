"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Check, RotateCcw, Undo2, Redo2, Plus, X } from "lucide-react";
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

    // Try to collapse into repeat()
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
        // Replace last line's ending to add semicolon
        lines[lines.length - 1] = lines[lines.length - 1] + ";";
    }

    lines.push(`}`);

    // Generate area classes
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

/* ────────────────────── main component ────────────────────────────── */

export function CssGridGenerator() {
    const [state, setState] = useState<GridState>(createDefaultState);
    const [history, setHistory] = useState<HistoryState>(() => ({
        stack: [deepClone(createDefaultState())],
        index: 0,
    }));
    const [editingCell, setEditingCell] = useState<{
        row: number;
        col: number;
    } | null>(null);
    const [editingValue, setEditingValue] = useState("");
    const [copyState, setCopyState] = useState<CopyTarget>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState<ExportSettings>({
        useRepeat: true,
        useAreas: true,
    });

    const editInputRef = useRef<HTMLInputElement>(null);

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
        setEditingCell(null);
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

    // ─── area editing ───
    const startEditingCell = (row: number, col: number) => {
        setEditingCell({ row, col });
        setEditingValue(
            state.areas[row]?.[col] === "."
                ? ""
                : (state.areas[row]?.[col] ?? ""),
        );
    };

    const saveEditingCell = () => {
        if (!editingCell) return;
        const next = deepClone(state);
        const sanitized =
            editingValue.trim().replace(/[^a-zA-Z0-9_-]/g, "") || ".";
        next.areas[editingCell.row][editingCell.col] = sanitized;
        commit(next);
        setEditingCell(null);
        setEditingValue("");
    };

    const cancelEditing = () => {
        setEditingCell(null);
        setEditingValue("");
    };

    // Focus input on edit
    useEffect(() => {
        if (editingCell && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingCell]);

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

    const handleCopy = async (target: CopyTarget, text: string) => {
        await navigator.clipboard.writeText(text);
        setCopyState(target);
    };

    // ─── grid canvas template ───
    const gridTemplateColumns = state.columns.map(trackToString).join(" ");
    const gridTemplateRows = state.rows.map(trackToString).join(" ");

    return (
        <div className="flex h-[calc(100vh-56px)] min-h-[600px] select-none overflow-hidden bg-[#1e1e2e] text-sm text-slate-200">
            {/* ═══════════ LEFT SIDEBAR ═══════════ */}
            <aside className="flex w-[260px] shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-[#252536]">
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

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                    {/* — Explicit Grid — */}
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
            </aside>

            {/* ═══════════ CENTER CANVAS ═══════════ */}
            <main className="relative flex flex-1 flex-col overflow-hidden bg-[#1e1e2e]">
                {/* Grid line numbers — columns (top) */}
                <div
                    className="flex shrink-0"
                    style={{
                        paddingLeft: 32,
                        paddingRight: 16,
                    }}
                >
                    {/* Line numbers for columns: 1..N+1 */}
                    <div
                        className="relative flex w-full"
                        style={{
                            display: "grid",
                            gridTemplateColumns: gridTemplateColumns,
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

                {/* Grid area + row line numbers */}
                <div className="flex flex-1 overflow-auto p-4 pt-0">
                    {/* Row line numbers (left) */}
                    <div
                        className="mr-2 flex shrink-0 flex-col"
                        style={{
                            display: "grid",
                            gridTemplateRows: gridTemplateRows,
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

                    {/* The actual grid */}
                    <div
                        className="relative flex-1 rounded-lg border border-dashed border-slate-600/50"
                        style={{
                            display: "grid",
                            gridTemplateColumns: gridTemplateColumns,
                            gridTemplateRows: gridTemplateRows,
                            gap: `${state.rowGap.value}${state.rowGap.unit} ${state.columnGap.value}${state.columnGap.unit}`,
                        }}
                    >
                        {state.areas.map((row, rIdx) =>
                            row.map((cell, cIdx) => {
                                const isEditing =
                                    editingCell?.row === rIdx &&
                                    editingCell?.col === cIdx;
                                const hasArea = cell !== ".";

                                return (
                                    <div
                                        key={`${rIdx}-${cIdx}`}
                                        className={cn(
                                            "relative flex items-center justify-center border border-dashed transition-colors cursor-pointer",
                                            hasArea
                                                ? "border-cyan-500/40 bg-cyan-500/12"
                                                : "border-slate-600/40 bg-white/[0.02] hover:bg-white/[0.06]",
                                            isEditing &&
                                                "ring-2 ring-cyan-400/60",
                                        )}
                                        onClick={() => {
                                            if (!isEditing)
                                                startEditingCell(rIdx, cIdx);
                                        }}
                                    >
                                        {isEditing ? (
                                            <input
                                                ref={editInputRef}
                                                type="text"
                                                value={editingValue}
                                                onChange={(e) =>
                                                    setEditingValue(
                                                        e.target.value,
                                                    )
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter")
                                                        saveEditingCell();
                                                    if (e.key === "Escape")
                                                        cancelEditing();
                                                }}
                                                onBlur={saveEditingCell}
                                                className="h-7 w-full max-w-[120px] rounded border border-cyan-400/50 bg-slate-900 px-2 text-center text-xs text-white outline-none"
                                                placeholder="area name"
                                            />
                                        ) : hasArea ? (
                                            <span className="text-xs font-medium text-cyan-200">
                                                {cell}
                                            </span>
                                        ) : null}
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
                            gridTemplateColumns: gridTemplateColumns,
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

                {/* Row track labels (right edge) — Positioned absolutely */}
                <div
                    className="pointer-events-none absolute right-1 top-6 bottom-8 flex flex-col"
                    style={{
                        display: "grid",
                        gridTemplateRows: gridTemplateRows,
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
            </main>

            {/* ═══════════ RIGHT PANEL ═══════════ */}
            <aside className="flex w-[300px] shrink-0 flex-col overflow-hidden border-l border-white/10 bg-[#252536]">
                {/* Toolbar */}
                <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={undo}
                            disabled={history.index <= 0}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-white/8 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Undo"
                        >
                            <Undo2 className="size-4" />
                        </button>
                        <button
                            type="button"
                            onClick={redo}
                            disabled={history.index >= history.stack.length - 1}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-white/8 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Redo"
                        >
                            <Redo2 className="size-4" />
                        </button>
                        <button
                            type="button"
                            onClick={restart}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-white/8 hover:text-white"
                            title="Restart"
                        >
                            <RotateCcw className="size-4" />
                        </button>
                    </div>
                </div>

                {/* Code output */}
                <div className="flex-1 overflow-y-auto">
                    {/* HTML */}
                    <section className="border-b border-white/8">
                        <div className="flex items-center justify-between px-4 py-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                HTML
                            </span>
                            <button
                                type="button"
                                onClick={() => handleCopy("html", htmlOutput)}
                                className="flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-white"
                            >
                                {copyState === "html" ? (
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
                            </button>
                        </div>
                        <pre className="overflow-x-auto px-4 pb-3 font-mono text-[12px] leading-5 text-emerald-300/90">
                            {htmlOutput}
                        </pre>
                    </section>

                    {/* CSS */}
                    <section>
                        <div className="flex items-center justify-between px-4 py-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                CSS
                            </span>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowSettings(!showSettings)
                                    }
                                    className={cn(
                                        "text-xs transition-colors",
                                        showSettings
                                            ? "text-cyan-400"
                                            : "text-slate-400 hover:text-white",
                                    )}
                                >
                                    Settings
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCopy("css", cssOutput)}
                                    className="flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-white"
                                >
                                    {copyState === "css" ? (
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
                                </button>
                            </div>
                        </div>

                        {/* Settings panel */}
                        {showSettings && (
                            <div className="space-y-2 border-y border-white/8 bg-white/[0.03] px-4 py-3">
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

                        <pre className="overflow-x-auto px-4 pb-4 font-mono text-[12px] leading-5 text-emerald-300/90">
                            {cssOutput}
                        </pre>
                    </section>
                </div>

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
