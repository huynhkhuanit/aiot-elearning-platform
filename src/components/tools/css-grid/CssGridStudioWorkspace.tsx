"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
    type PointerEvent as ReactPointerEvent,
} from "react";
import {
    Blocks,
    Copy,
    Download,
    Grid3X3,
    Laptop,
    Monitor,
    Redo2,
    RotateCcw,
    Share2,
    Smartphone,
    Sparkles,
    Trash2,
    Undo2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { getGridExportBundle } from "./gridExports";
import { GRID_BLOCK_LIBRARY, GRID_PRESETS } from "./gridPresets";
import {
    GRID_DRAFT_STORAGE_KEY,
    buildGridShareHash,
    getGridStateFromHash,
    readGridDraft,
    writeGridDraft,
} from "./gridSerialization";
import type {
    GridBlockDefinition,
    GridBreakpoint,
    GridExportFormat,
    GridHistoryState,
    GridItemState,
    GridResolvedState,
    GridWorkspaceState,
} from "./gridTypes";
import {
    addBlockToWorkspace,
    buildItemClassName,
    clampItemToContainer,
    countBreakpointOverrides,
    deepCloneWorkspace,
    duplicateItemInWorkspace,
    getGridTemplateColumns,
    getGridTemplateRows,
    hasItemCollision,
    normalizeWorkspaceState,
    removeItemFromWorkspace,
    resetBreakpointOverrides,
    resolveBreakpointState,
    sanitizeAreaName,
    setContainerFieldAtBreakpoint,
    setItemFieldsAtBreakpoint,
    setWorkspaceName,
} from "./gridUtils";

type CopyState = "css" | "html" | "tailwind" | "share" | null;
type PreviewMode = "lines" | "areas";
type MobileWorkspaceTab = "presets" | "canvas" | "inspector";
type DragMode = "move" | "resize-x" | "resize-y" | "resize-both";

type DragState = {
    itemId: string;
    mode: DragMode;
    startClientX: number;
    startClientY: number;
    startItem: GridItemState;
    previewItem: GridItemState;
    isValid: boolean;
};

const breakpointLabelMap: Record<GridBreakpoint, string> = {
    desktop: "Desktop",
    tablet: "Tablet",
    mobile: "Mobile",
};

const breakpointIconMap = {
    desktop: Monitor,
    tablet: Laptop,
    mobile: Smartphone,
} satisfies Record<GridBreakpoint, typeof Monitor>;

const ALIGN_OPTIONS = [
    { value: "start", label: "Start" },
    { value: "center", label: "Center" },
    { value: "end", label: "End" },
    { value: "stretch", label: "Stretch" },
] as const;

const CONTENT_ALIGN_OPTIONS = [
    { value: "start", label: "Start" },
    { value: "center", label: "Center" },
    { value: "end", label: "End" },
    { value: "space-between", label: "Space Between" },
    { value: "space-around", label: "Space Around" },
    { value: "space-evenly", label: "Space Evenly" },
    { value: "stretch", label: "Stretch" },
] as const;

const AUTO_FLOW_OPTIONS = [
    { value: "row", label: "row" },
    { value: "column", label: "column" },
    { value: "dense", label: "dense" },
    { value: "row dense", label: "row dense" },
    { value: "column dense", label: "column dense" },
] as const;

const typeToneMap = {
    header:
        "from-emerald-500/45 via-emerald-400/25 to-cyan-400/25 border-emerald-200/30",
    sidebar:
        "from-slate-400/40 via-slate-300/20 to-slate-100/10 border-slate-200/25",
    hero: "from-sky-500/45 via-cyan-400/25 to-emerald-300/20 border-sky-200/30",
    card: "from-amber-400/40 via-orange-300/18 to-white/5 border-amber-200/25",
    chart:
        "from-orange-500/40 via-amber-400/22 to-rose-300/12 border-orange-200/30",
    cta: "from-emerald-500/40 via-teal-400/25 to-cyan-200/14 border-emerald-200/30",
    footer:
        "from-slate-500/45 via-slate-400/18 to-slate-200/10 border-slate-200/25",
    content:
        "from-violet-500/38 via-indigo-400/22 to-slate-100/8 border-violet-200/28",
    nav: "from-cyan-500/35 via-sky-400/18 to-white/8 border-cyan-200/25",
    panel:
        "from-slate-500/38 via-slate-300/18 to-white/10 border-slate-200/30",
} satisfies Record<GridItemState["type"], string>;

function shallowWorkspaceEquals(
    left: GridWorkspaceState,
    right: GridWorkspaceState,
) {
    return JSON.stringify(left) === JSON.stringify(right);
}

function buildInitialWorkspace() {
    return deepCloneWorkspace(GRID_PRESETS[0].workspace);
}

function createHistoryState(workspace: GridWorkspaceState): GridHistoryState {
    return {
        stack: [deepCloneWorkspace(workspace)],
        index: 0,
    };
}

function parseIntegerInput(value: string, fallback: number, min = 1, max = 24) {
    const next = Number(value);
    if (!Number.isFinite(next)) {
        return fallback;
    }

    return Math.min(max, Math.max(min, Math.round(next)));
}

function replaceHistoryState(
    nextWorkspace: GridWorkspaceState,
    setWorkspace: (workspace: GridWorkspaceState) => void,
    setHistory: (value: GridHistoryState) => void,
) {
    const snapshot = deepCloneWorkspace(nextWorkspace);
    setWorkspace(snapshot);
    setHistory(createHistoryState(snapshot));
}

type SelectFieldProps = {
    label: string;
    value: string;
    options: readonly { value: string; label: string }[];
    onChange: (value: string) => void;
};

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-full rounded-xl border-slate-200">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

export function CssGridStudioWorkspace() {
    const defaultWorkspace = useMemo(() => buildInitialWorkspace(), []);
    const [workspace, setWorkspace] = useState<GridWorkspaceState>(defaultWorkspace);
    const [historyState, setHistoryState] = useState<GridHistoryState>(
        createHistoryState(defaultWorkspace),
    );
    const [selectedBreakpoint, setSelectedBreakpoint] =
        useState<GridBreakpoint>("desktop");
    const [selectedItemId, setSelectedItemId] = useState<string | null>(
        defaultWorkspace.base.items[0]?.id ?? null,
    );
    const [selectedExportFormat, setSelectedExportFormat] =
        useState<GridExportFormat>("css");
    const [previewMode, setPreviewMode] = useState<PreviewMode>("lines");
    const [mobileTab, setMobileTab] = useState<MobileWorkspaceTab>("canvas");
    const [copyState, setCopyState] = useState<CopyState>(null);
    const [statusMessage, setStatusMessage] = useState(
        "Grid tự động lưu bản nháp và đồng bộ vào URL hash.",
    );
    const [dragState, setDragState] = useState<DragState | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activePresetCategory, setActivePresetCategory] = useState("all");

    const canvasRef = useRef<HTMLDivElement | null>(null);
    const workspaceRef = useRef(workspace);
    const dragStateRef = useRef<DragState | null>(dragState);
    const resolvedStateRef = useRef<GridResolvedState>(
        resolveBreakpointState(workspace, selectedBreakpoint),
    );

    useEffect(() => {
        workspaceRef.current = workspace;
    }, [workspace]);

    useEffect(() => {
        dragStateRef.current = dragState;
    }, [dragState]);

    const resolvedStates = useMemo(
        () => ({
            desktop: resolveBreakpointState(workspace, "desktop"),
            tablet: resolveBreakpointState(workspace, "tablet"),
            mobile: resolveBreakpointState(workspace, "mobile"),
        }),
        [workspace],
    );

    const currentState = resolvedStates[selectedBreakpoint];

    useEffect(() => {
        resolvedStateRef.current = currentState;
    }, [currentState]);

    const previewItems = useMemo(() => {
        if (!dragState) {
            return currentState.items;
        }

        return currentState.items.map((item) =>
            item.id === dragState.itemId ? dragState.previewItem : item,
        );
    }, [currentState.items, dragState]);

    const selectedItem = useMemo(() => {
        if (!selectedItemId) {
            return null;
        }

        return previewItems.find((item) => item.id === selectedItemId) ?? null;
    }, [previewItems, selectedItemId]);

    const exportBundle = useMemo(
        () => getGridExportBundle(workspace, selectedExportFormat),
        [selectedExportFormat, workspace],
    );

    const presetCategories = useMemo(
        () => ["all", ...new Set(GRID_PRESETS.map((preset) => preset.category))],
        [],
    );

    const filteredPresets = useMemo(() => {
        const keyword = searchQuery.trim().toLowerCase();

        return GRID_PRESETS.filter((preset) => {
            const matchesCategory =
                activePresetCategory === "all" ||
                preset.category === activePresetCategory;
            const matchesKeyword =
                keyword.length === 0 ||
                preset.name.toLowerCase().includes(keyword) ||
                preset.summary.toLowerCase().includes(keyword) ||
                preset.tags.some((tag) => tag.toLowerCase().includes(keyword));

            return matchesCategory && matchesKeyword;
        });
    }, [activePresetCategory, searchQuery]);

    useEffect(() => {
        const nextSelection =
            currentState.items.find((item) => item.id === selectedItemId)?.id ??
            currentState.items[0]?.id ??
            null;

        if (nextSelection !== selectedItemId) {
            setSelectedItemId(nextSelection);
        }
    }, [currentState.items, selectedItemId]);

    useEffect(() => {
        const fallback = buildInitialWorkspace();
        const stateFromHash =
            typeof window !== "undefined"
                ? getGridStateFromHash(window.location.hash, fallback)
                : null;
        const stateFromDraft =
            typeof window !== "undefined"
                ? readGridDraft(window.localStorage, fallback)
                : null;

        const nextWorkspace =
            stateFromHash ??
            stateFromDraft ??
            normalizeWorkspaceState(defaultWorkspace, fallback);

        replaceHistoryState(nextWorkspace, setWorkspace, setHistoryState);
        setSelectedItemId(nextWorkspace.base.items[0]?.id ?? null);
        setIsHydrated(true);
    }, [defaultWorkspace]);

    useEffect(() => {
        if (!isHydrated || typeof window === "undefined") {
            return;
        }

        writeGridDraft(window.localStorage, workspace);
        const nextHash = buildGridShareHash(workspace);
        window.history.replaceState(
            null,
            "",
            `${window.location.pathname}${window.location.search}${nextHash}`,
        );
    }, [isHydrated, workspace]);

    useEffect(() => {
        if (!copyState) {
            return;
        }

        const timeoutId = window.setTimeout(() => setCopyState(null), 1800);
        return () => window.clearTimeout(timeoutId);
    }, [copyState]);

    useEffect(() => {
        if (!statusMessage) {
            return;
        }

        const timeoutId = window.setTimeout(() => setStatusMessage(""), 2800);
        return () => window.clearTimeout(timeoutId);
    }, [statusMessage]);

    useEffect(() => {
        if (!dragState) {
            return;
        }

        function handlePointerMove(event: PointerEvent) {
            const currentDragState = dragStateRef.current;
            const currentResolved = resolvedStateRef.current;
            const surface = canvasRef.current;

            if (!currentDragState || !surface) {
                return;
            }

            const rect = surface.getBoundingClientRect();
            const cellWidth = rect.width / Math.max(currentResolved.container.columns, 1);
            const cellHeight = rect.height / Math.max(currentResolved.container.rows, 1);
            const deltaCols = Math.round(
                (event.clientX - currentDragState.startClientX) / cellWidth,
            );
            const deltaRows = Math.round(
                (event.clientY - currentDragState.startClientY) / cellHeight,
            );

            let nextPreview = currentDragState.startItem;

            if (currentDragState.mode === "move") {
                nextPreview = clampItemToContainer(
                    {
                        ...currentDragState.startItem,
                        colStart: currentDragState.startItem.colStart + deltaCols,
                        rowStart: currentDragState.startItem.rowStart + deltaRows,
                    },
                    currentResolved.container,
                );
            } else if (currentDragState.mode === "resize-x") {
                nextPreview = clampItemToContainer(
                    {
                        ...currentDragState.startItem,
                        colSpan: currentDragState.startItem.colSpan + deltaCols,
                    },
                    currentResolved.container,
                );
            } else if (currentDragState.mode === "resize-y") {
                nextPreview = clampItemToContainer(
                    {
                        ...currentDragState.startItem,
                        rowSpan: currentDragState.startItem.rowSpan + deltaRows,
                    },
                    currentResolved.container,
                );
            } else {
                nextPreview = clampItemToContainer(
                    {
                        ...currentDragState.startItem,
                        colSpan: currentDragState.startItem.colSpan + deltaCols,
                        rowSpan: currentDragState.startItem.rowSpan + deltaRows,
                    },
                    currentResolved.container,
                );
            }

            const isValid = !hasItemCollision(
                nextPreview,
                currentResolved.items,
                currentDragState.itemId,
            );

            setDragState((currentValue) =>
                currentValue
                    ? {
                          ...currentValue,
                          previewItem: nextPreview,
                          isValid,
                      }
                    : currentValue,
            );
        }

        function handlePointerUp() {
            const currentDragState = dragStateRef.current;
            if (!currentDragState) {
                return;
            }

            if (currentDragState.isValid) {
                commitWorkspace(
                    setItemFieldsAtBreakpoint(
                        workspaceRef.current,
                        selectedBreakpoint,
                        currentDragState.itemId,
                        {
                            colStart: currentDragState.previewItem.colStart,
                            colSpan: currentDragState.previewItem.colSpan,
                            rowStart: currentDragState.previewItem.rowStart,
                            rowSpan: currentDragState.previewItem.rowSpan,
                        },
                    ),
                );
            } else {
                setStatusMessage("Thao tác bị hủy vì item chồng lấp lên block khác.");
            }

            setDragState(null);
        }

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [dragState, selectedBreakpoint]);

    function commitWorkspace(nextWorkspace: GridWorkspaceState) {
        const snapshot = deepCloneWorkspace(nextWorkspace);
        setWorkspace(snapshot);
        setHistoryState((currentHistory) => {
            const currentSnapshot = currentHistory.stack[currentHistory.index];
            if (shallowWorkspaceEquals(currentSnapshot, snapshot)) {
                return currentHistory;
            }

            const nextStack = currentHistory.stack
                .slice(0, currentHistory.index + 1)
                .concat(deepCloneWorkspace(snapshot))
                .slice(-40);

            return {
                stack: nextStack,
                index: nextStack.length - 1,
            };
        });
    }

    function undo() {
        setHistoryState((currentHistory) => {
            if (currentHistory.index === 0) {
                return currentHistory;
            }

            const nextIndex = currentHistory.index - 1;
            setWorkspace(deepCloneWorkspace(currentHistory.stack[nextIndex]));
            return {
                ...currentHistory,
                index: nextIndex,
            };
        });
    }

    function redo() {
        setHistoryState((currentHistory) => {
            if (currentHistory.index >= currentHistory.stack.length - 1) {
                return currentHistory;
            }

            const nextIndex = currentHistory.index + 1;
            setWorkspace(deepCloneWorkspace(currentHistory.stack[nextIndex]));
            return {
                ...currentHistory,
                index: nextIndex,
            };
        });
    }

    async function copyText(type: CopyState, value: string) {
        await navigator.clipboard.writeText(value);
        setCopyState(type);
        setStatusMessage(
            type === "share"
                ? "Đã copy link chia sẻ với trạng thái grid hiện tại."
                : `Đã copy ${type?.toUpperCase()} vào clipboard.`,
        );
    }

    async function handleShare() {
        if (typeof window === "undefined") {
            return;
        }

        await copyText("share", window.location.href);
    }

    function applyPreset(presetId: string) {
        const preset = GRID_PRESETS.find((entry) => entry.id === presetId);
        if (!preset) {
            return;
        }

        replaceHistoryState(
            deepCloneWorkspace(preset.workspace),
            setWorkspace,
            setHistoryState,
        );
        setSelectedItemId(preset.workspace.base.items[0]?.id ?? null);
        setSelectedBreakpoint("desktop");
        setStatusMessage(`Đã áp dụng preset "${preset.name}".`);
    }

    function addBlock(block: GridBlockDefinition) {
        const result = addBlockToWorkspace(workspace, block, selectedBreakpoint);
        commitWorkspace(result.workspace);
        setSelectedItemId(result.itemId);
        setMobileTab("canvas");
        setStatusMessage(`Đã thêm block "${block.label}" vào layout.`);
    }

    function duplicateSelectedItem() {
        if (!selectedItemId) {
            return;
        }

        const result = duplicateItemInWorkspace(workspace, selectedItemId);
        commitWorkspace(result.workspace);
        setSelectedItemId(result.itemId);
        setStatusMessage("Đã nhân bản block hiện tại.");
    }

    function deleteSelectedItem() {
        if (!selectedItemId) {
            return;
        }

        commitWorkspace(removeItemFromWorkspace(workspace, selectedItemId));
        setStatusMessage("Đã xóa block khỏi layout.");
    }

    function resetCurrentBreakpoint() {
        if (selectedBreakpoint === "desktop") {
            const preset = GRID_PRESETS.find(
                (entry) => entry.id === workspace.activePresetId,
            );
            if (!preset) {
                return;
            }

            replaceHistoryState(
                deepCloneWorkspace(preset.workspace),
                setWorkspace,
                setHistoryState,
            );
            setSelectedItemId(preset.workspace.base.items[0]?.id ?? null);
            setStatusMessage("Đã khôi phục layout về preset gốc.");
            return;
        }

        commitWorkspace(
            resetBreakpointOverrides(workspace, selectedBreakpoint),
        );
        setStatusMessage(
            `Đã xóa toàn bộ override của breakpoint ${breakpointLabelMap[selectedBreakpoint]}.`,
        );
    }

    function startDrag(
        event: ReactPointerEvent<HTMLElement>,
        item: GridItemState,
        mode: DragMode,
    ) {
        if (item.locked) {
            setStatusMessage("Item đang khóa nên không thể kéo hoặc resize.");
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        setSelectedItemId(item.id);
        setDragState({
            itemId: item.id,
            mode,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startItem: item,
            previewItem: item,
            isValid: true,
        });
    }

    function tryUpdateSelectedItem(nextItem: GridItemState, errorMessage: string) {
        if (!selectedItem) {
            return;
        }

        const clamped = clampItemToContainer(nextItem, currentState.container);
        if (hasItemCollision(clamped, currentState.items, selectedItem.id)) {
            setStatusMessage(errorMessage);
            return;
        }

        commitWorkspace(
            setItemFieldsAtBreakpoint(workspace, selectedBreakpoint, selectedItem.id, {
                rowStart: clamped.rowStart,
                rowSpan: clamped.rowSpan,
                colStart: clamped.colStart,
                colSpan: clamped.colSpan,
                alignSelf: clamped.alignSelf,
                justifySelf: clamped.justifySelf,
            }),
        );
    }

    function handleCanvasKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (!selectedItem) {
            return;
        }

        const targetIsInput = event.target instanceof HTMLElement &&
            ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName);
        if (targetIsInput) {
            return;
        }

        let nextItem = selectedItem;

        switch (event.key) {
            case "ArrowLeft":
                event.preventDefault();
                nextItem = event.shiftKey
                    ? { ...selectedItem, colSpan: selectedItem.colSpan - 1 }
                    : { ...selectedItem, colStart: selectedItem.colStart - 1 };
                break;
            case "ArrowRight":
                event.preventDefault();
                nextItem = event.shiftKey
                    ? { ...selectedItem, colSpan: selectedItem.colSpan + 1 }
                    : { ...selectedItem, colStart: selectedItem.colStart + 1 };
                break;
            case "ArrowUp":
                event.preventDefault();
                nextItem = event.shiftKey
                    ? { ...selectedItem, rowSpan: selectedItem.rowSpan - 1 }
                    : { ...selectedItem, rowStart: selectedItem.rowStart - 1 };
                break;
            case "ArrowDown":
                event.preventDefault();
                nextItem = event.shiftKey
                    ? { ...selectedItem, rowSpan: selectedItem.rowSpan + 1 }
                    : { ...selectedItem, rowStart: selectedItem.rowStart + 1 };
                break;
            default:
                return;
        }

        tryUpdateSelectedItem(
            nextItem,
            "Không thể áp dụng keyboard nudging vì item sẽ chồng lấp.",
        );
    }

    function renderBreakpointSwitcher() {
        return (
            <div className="flex flex-wrap gap-2">
                {(["desktop", "tablet", "mobile"] as const).map((breakpoint) => {
                    const Icon = breakpointIconMap[breakpoint];
                    const isActive = selectedBreakpoint === breakpoint;
                    const overrideCount =
                        breakpoint === "desktop"
                            ? 0
                            : countBreakpointOverrides(workspace, breakpoint);

                    return (
                        <button
                            key={breakpoint}
                            type="button"
                            onClick={() => setSelectedBreakpoint(breakpoint)}
                            className={cn(
                                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors motion-reduce:transition-none",
                                isActive
                                    ? "border-emerald-300 bg-emerald-500/12 text-emerald-100"
                                    : "border-white/10 bg-white/6 text-slate-300 hover:border-white/20 hover:bg-white/10",
                            )}
                        >
                            <Icon className="size-4" />
                            {breakpointLabelMap[breakpoint]}
                            {overrideCount > 0 ? (
                                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">
                                    {overrideCount}
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </div>
        );
    }

    function renderPresetRail() {
        return (
            <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_22px_55px_rgba(15,23,42,0.08)]">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-slate-900">
                            Preset library
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            12+ mẫu dựng sẵn cho dashboard, bento, docs, admin,
                            blog và gallery.
                        </p>
                    </div>
                    <Badge className="rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                        {GRID_PRESETS.length} presets
                    </Badge>
                </div>

                <div className="mt-4 space-y-3">
                    <Input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Tìm theo tên hoặc tag"
                        className="rounded-xl border-slate-200 bg-slate-50"
                    />
                    <div className="flex flex-wrap gap-2">
                        {presetCategories.map((category) => (
                            <button
                                key={category}
                                type="button"
                                onClick={() => setActivePresetCategory(category)}
                                className={cn(
                                    "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors motion-reduce:transition-none",
                                    activePresetCategory === category
                                        ? "border-slate-900 bg-slate-900 text-white"
                                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900",
                                )}
                            >
                                {category === "all" ? "Tất cả" : category}
                            </button>
                        ))}
                    </div>
                </div>

                <ScrollArea className="mt-4 h-[360px] pr-4">
                    <div className="space-y-3">
                        {filteredPresets.map((preset) => {
                            const isActive = workspace.activePresetId === preset.id;
                            return (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => applyPreset(preset.id)}
                                    className={cn(
                                        "group w-full rounded-[22px] border p-4 text-left transition-all motion-reduce:transition-none",
                                        isActive
                                            ? "border-slate-900 bg-slate-950 text-white shadow-[0_20px_44px_rgba(15,23,42,0.18)]"
                                            : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 hover:bg-white",
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold">
                                                {preset.name}
                                            </p>
                                            <p
                                                className={cn(
                                                    "mt-2 text-sm leading-6",
                                                    isActive
                                                        ? "text-slate-300"
                                                        : "text-slate-500",
                                                )}
                                            >
                                                {preset.summary}
                                            </p>
                                        </div>
                                        <div
                                            className="size-3 shrink-0 rounded-full"
                                            style={{ backgroundColor: preset.accent }}
                                        />
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {preset.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className={cn(
                                                    "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                                                    isActive
                                                        ? "bg-white/10 text-slate-200"
                                                        : "bg-slate-100 text-slate-500",
                                                )}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </ScrollArea>

                <div className="mt-5 border-t border-slate-200 pt-5">
                    <div className="flex items-center gap-2">
                        <Blocks className="size-4 text-teal-600" />
                        <p className="text-sm font-semibold text-slate-900">
                            Block library
                        </p>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                        Thêm block mới vào grid hiện tại. Layout sẽ tự tìm vị trí
                        trống đầu tiên và vẫn giữ rule không overlap.
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {GRID_BLOCK_LIBRARY.map((block) => (
                            <button
                                key={block.type}
                                type="button"
                                onClick={() => addBlock(block)}
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition-colors hover:border-slate-300 hover:bg-white"
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className="size-2.5 rounded-full"
                                        style={{ backgroundColor: block.accent }}
                                    />
                                    <span className="text-sm font-semibold text-slate-900">
                                        {block.label}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    {block.description}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    function renderCanvasPanel() {
        return (
            <div className="rounded-[30px] border border-white/10 bg-[#0f172a] p-4 text-white shadow-[0_26px_80px_rgba(2,8,23,0.36)]">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Grid3X3 className="size-4 text-emerald-300" />
                            <p className="text-sm font-semibold text-white">
                                Visual canvas
                            </p>
                        </div>
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
                            Kéo để di chuyển item, dùng handle để resize theo line
                            và giữ <span className="font-semibold text-white">Shift + Arrow</span>{" "}
                            để thay span bằng bàn phím.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={undo}
                            disabled={historyState.index === 0}
                            className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                        >
                            <Undo2 className="mr-2 size-4" />
                            Undo
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={redo}
                            disabled={historyState.index >= historyState.stack.length - 1}
                            className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                        >
                            <Redo2 className="mr-2 size-4" />
                            Redo
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={resetCurrentBreakpoint}
                            className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                        >
                            <RotateCcw className="mr-2 size-4" />
                            Reset
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleShare}
                            className="rounded-full bg-emerald-400 px-4 text-slate-950 hover:bg-emerald-300"
                        >
                            <Share2 className="mr-2 size-4" />
                            {copyState === "share" ? "Đã copy" : "Copy share link"}
                        </Button>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    {renderBreakpointSwitcher()}

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setPreviewMode("lines")}
                            className={cn(
                                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                                previewMode === "lines"
                                    ? "border-emerald-300 bg-emerald-500/12 text-emerald-100"
                                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
                            )}
                        >
                            Line mode
                        </button>
                        <button
                            type="button"
                            onClick={() => setPreviewMode("areas")}
                            className={cn(
                                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                                previewMode === "areas"
                                    ? "border-emerald-300 bg-emerald-500/12 text-emerald-100"
                                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
                            )}
                        >
                            Area mode
                        </button>
                    </div>
                </div>

                <div className="mt-4 rounded-[26px] border border-white/8 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.14),_transparent_22%),linear-gradient(180deg,_rgba(15,23,42,0.88)_0%,_rgba(2,6,23,0.96)_100%)] p-4">
                    <div className="grid grid-cols-[44px_minmax(0,1fr)] grid-rows-[36px_minmax(0,1fr)] gap-3">
                        <div />
                        <div
                            className="grid gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400"
                            style={{
                                gridTemplateColumns: `repeat(${currentState.container.columns}, minmax(0, 1fr))`,
                            }}
                        >
                            {Array.from(
                                { length: currentState.container.columns },
                                (_, index) => (
                                    <span key={index} className="text-center">
                                        {index + 1}
                                    </span>
                                ),
                            )}
                        </div>
                        <div
                            className="grid gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400"
                            style={{
                                gridTemplateRows: `repeat(${currentState.container.rows}, minmax(0, 1fr))`,
                            }}
                        >
                            {Array.from(
                                { length: currentState.container.rows },
                                (_, index) => (
                                    <span key={index} className="flex items-center justify-center">
                                        {index + 1}
                                    </span>
                                ),
                            )}
                        </div>

                        <div
                            ref={canvasRef}
                            tabIndex={0}
                            onKeyDown={handleCanvasKeyDown}
                            className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#07111f] p-2 outline-none ring-0 focus-visible:ring-2 focus-visible:ring-emerald-300/70"
                            style={{
                                minHeight: currentState.container.minHeight,
                            }}
                        >
                            <div
                                className="pointer-events-none absolute inset-2 grid"
                                style={{
                                    gridTemplateColumns: getGridTemplateColumns(
                                        currentState.container,
                                    ),
                                    gridTemplateRows: getGridTemplateRows(
                                        currentState.container,
                                    ),
                                    gap: `${currentState.container.gap}px`,
                                    rowGap: `${currentState.container.rowGap}px`,
                                    columnGap: `${currentState.container.columnGap}px`,
                                }}
                            >
                                {Array.from({
                                    length:
                                        currentState.container.columns *
                                        currentState.container.rows,
                                }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="rounded-xl border border-dashed border-white/8 bg-white/[0.03]"
                                    />
                                ))}
                            </div>

                            <div
                                className="relative z-10 grid"
                                style={{
                                    gridTemplateColumns: getGridTemplateColumns(
                                        currentState.container,
                                    ),
                                    gridTemplateRows: getGridTemplateRows(
                                        currentState.container,
                                    ),
                                    gap: `${currentState.container.gap}px`,
                                    rowGap: `${currentState.container.rowGap}px`,
                                    columnGap: `${currentState.container.columnGap}px`,
                                    padding: `${currentState.container.padding}px`,
                                    minHeight: currentState.container.minHeight,
                                }}
                            >
                                {previewItems.map((item) => {
                                    const isDragging = dragState?.itemId === item.id;
                                    const isInvalid = isDragging && !dragState?.isValid;
                                    const isSelected = selectedItemId === item.id;

                                    return (
                                        <div
                                            key={item.id}
                                            role="button"
                                            tabIndex={0}
                                            aria-pressed={isSelected}
                                            onClick={() => setSelectedItemId(item.id)}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter" || event.key === " ") {
                                                    event.preventDefault();
                                                    setSelectedItemId(item.id);
                                                }
                                            }}
                                            onPointerDown={(event) =>
                                                startDrag(event, item, "move")
                                            }
                                            className={cn(
                                                "group relative flex min-h-[86px] flex-col justify-between overflow-hidden rounded-[22px] border bg-gradient-to-br p-4 text-left shadow-[0_16px_36px_rgba(2,8,23,0.28)] transition-transform duration-200 motion-reduce:transition-none",
                                                typeToneMap[item.type],
                                                isSelected
                                                    ? "ring-2 ring-emerald-300/80"
                                                    : "ring-0",
                                                isInvalid
                                                    ? "border-rose-300/70 bg-rose-500/20"
                                                    : "hover:-translate-y-0.5",
                                                item.locked && "cursor-default",
                                            )}
                                            style={{
                                                gridColumn: `${item.colStart} / span ${item.colSpan}`,
                                                gridRow: `${item.rowStart} / span ${item.rowSpan}`,
                                                alignSelf: item.alignSelf,
                                                justifySelf: item.justifySelf,
                                            }}
                                        >
                                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_35%)]" />
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="rounded-full bg-black/18 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-100">
                                                        {item.type}
                                                    </span>
                                                    <span className="text-[11px] uppercase tracking-[0.14em] text-slate-200/80">
                                                        {buildItemClassName(item)}
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-base font-semibold text-white">
                                                    {item.label}
                                                </p>
                                                <p className="mt-2 text-xs leading-5 text-slate-100/75">
                                                    {previewMode === "areas"
                                                        ? `area: ${sanitizeAreaName(
                                                              item.areaName || item.label,
                                                          )}`
                                                        : `c${item.colStart} / span ${item.colSpan} • r${item.rowStart} / span ${item.rowSpan}`}
                                                </p>
                                            </div>

                                            {!item.locked ? (
                                                <div className="relative z-10 mt-3 flex items-center justify-between gap-2">
                                                    <span className="text-xs text-slate-100/75">
                                                        Kéo để di chuyển
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            aria-label="Resize ngang"
                                                            onPointerDown={(event) =>
                                                                startDrag(
                                                                    event,
                                                                    item,
                                                                    "resize-x",
                                                                )
                                                            }
                                                            className="h-6 w-6 rounded-md border border-white/15 bg-black/18 text-[10px] text-white"
                                                        >
                                                            X
                                                        </button>
                                                        <button
                                                            type="button"
                                                            aria-label="Resize dọc"
                                                            onPointerDown={(event) =>
                                                                startDrag(
                                                                    event,
                                                                    item,
                                                                    "resize-y",
                                                                )
                                                            }
                                                            className="h-6 w-6 rounded-md border border-white/15 bg-black/18 text-[10px] text-white"
                                                        >
                                                            Y
                                                        </button>
                                                        <button
                                                            type="button"
                                                            aria-label="Resize cả hai chiều"
                                                            onPointerDown={(event) =>
                                                                startDrag(
                                                                    event,
                                                                    item,
                                                                    "resize-both",
                                                                )
                                                            }
                                                            className="h-6 w-6 rounded-md border border-white/15 bg-black/18 text-[10px] text-white"
                                                        >
                                                            XY
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="relative z-10 mt-3 text-xs text-amber-100/90">
                                                    Item đang khóa
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-emerald-300" />
                        <span>
                            {statusMessage || "Drag sẽ snap theo line và không commit nếu overlap."}
                        </span>
                    </div>
                    <span className="font-mono text-xs text-slate-400">
                        draft: <span className="text-slate-200">{GRID_DRAFT_STORAGE_KEY}</span>
                    </span>
                </div>
            </div>
        );
    }

    function renderContainerInspector() {
        return (
            <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_22px_55px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-slate-900">
                            Container settings
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            Breakpoint hiện tại:{" "}
                            <span className="font-semibold text-slate-900">
                                {breakpointLabelMap[selectedBreakpoint]}
                            </span>
                        </p>
                    </div>
                    <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-50">
                        {currentState.container.columns} cột / {currentState.container.rows} hàng
                    </Badge>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="workspace-name">Tên workspace</Label>
                        <Input
                            id="workspace-name"
                            value={workspace.name}
                            onChange={(event) =>
                                commitWorkspace(
                                    setWorkspaceName(workspace, event.target.value),
                                )
                            }
                            className="rounded-xl border-slate-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="active-preset">Preset hiện tại</Label>
                        <Input
                            id="active-preset"
                            value={
                                GRID_PRESETS.find(
                                    (preset) => preset.id === workspace.activePresetId,
                                )?.name ?? "Custom workspace"
                            }
                            readOnly
                            className="rounded-xl border-slate-200 bg-slate-50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="columns-count">Số cột</Label>
                        <Input
                            id="columns-count"
                            type="number"
                            min={1}
                            max={24}
                            value={currentState.container.columns}
                            onChange={(event) =>
                                commitWorkspace(
                                    setContainerFieldAtBreakpoint(
                                        workspace,
                                        selectedBreakpoint,
                                        "columns",
                                        parseIntegerInput(
                                            event.target.value,
                                            currentState.container.columns,
                                        ),
                                    ),
                                )
                            }
                            className="rounded-xl border-slate-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rows-count">Số hàng</Label>
                        <Input
                            id="rows-count"
                            type="number"
                            min={1}
                            max={24}
                            value={currentState.container.rows}
                            onChange={(event) =>
                                commitWorkspace(
                                    setContainerFieldAtBreakpoint(
                                        workspace,
                                        selectedBreakpoint,
                                        "rows",
                                        parseIntegerInput(
                                            event.target.value,
                                            currentState.container.rows,
                                        ),
                                    ),
                                )
                            }
                            className="rounded-xl border-slate-200"
                        />
                    </div>
                </div>

                <div className="mt-4 grid gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="column-track">Column track</Label>
                        <Input
                            id="column-track"
                            value={currentState.container.columnTrack}
                            onChange={(event) =>
                                commitWorkspace(
                                    setContainerFieldAtBreakpoint(
                                        workspace,
                                        selectedBreakpoint,
                                        "columnTrack",
                                        event.target.value || "minmax(0, 1fr)",
                                    ),
                                )
                            }
                            className="rounded-xl border-slate-200"
                        />
                        <p className="text-xs leading-5 text-slate-500">
                            Áp dụng cho mọi cột khi không dùng custom template.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="row-track">Row track</Label>
                        <Input
                            id="row-track"
                            value={currentState.container.rowTrack}
                            onChange={(event) =>
                                commitWorkspace(
                                    setContainerFieldAtBreakpoint(
                                        workspace,
                                        selectedBreakpoint,
                                        "rowTrack",
                                        event.target.value || "minmax(96px, auto)",
                                    ),
                                )
                            }
                            className="rounded-xl border-slate-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="custom-columns">Custom columns template</Label>
                        <Input
                            id="custom-columns"
                            value={currentState.container.customColumnsTemplate}
                            onChange={(event) =>
                                commitWorkspace(
                                    setContainerFieldAtBreakpoint(
                                        workspace,
                                        selectedBreakpoint,
                                        "customColumnsTemplate",
                                        event.target.value,
                                    ),
                                )
                            }
                            placeholder="Ví dụ: 280px minmax(0, 1fr) minmax(0, 1fr)"
                            className="rounded-xl border-slate-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="custom-rows">Custom rows template</Label>
                        <Input
                            id="custom-rows"
                            value={currentState.container.customRowsTemplate}
                            onChange={(event) =>
                                commitWorkspace(
                                    setContainerFieldAtBreakpoint(
                                        workspace,
                                        selectedBreakpoint,
                                        "customRowsTemplate",
                                        event.target.value,
                                    ),
                                )
                            }
                            placeholder="Ví dụ: 120px auto auto minmax(200px, auto)"
                            className="rounded-xl border-slate-200"
                        />
                    </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {([
                        ["gap", "Gap"],
                        ["rowGap", "Row gap"],
                        ["columnGap", "Column gap"],
                        ["padding", "Padding"],
                        ["minHeight", "Min height"],
                    ] as const).map(([field, label]) => (
                        <div key={field} className="space-y-2">
                            <Label htmlFor={field}>{label}</Label>
                            <Input
                                id={field}
                                type="number"
                                value={currentState.container[field]}
                                onChange={(event) =>
                                    commitWorkspace(
                                        setContainerFieldAtBreakpoint(
                                            workspace,
                                            selectedBreakpoint,
                                            field,
                                            parseIntegerInput(
                                                event.target.value,
                                                currentState.container[field],
                                                field === "minHeight" ? 320 : 0,
                                                field === "minHeight" ? 1400 : 120,
                                            ),
                                        ),
                                    )
                                }
                                className="rounded-xl border-slate-200"
                            />
                        </div>
                    ))}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <SelectField
                        label="justify-items"
                        value={currentState.container.justifyItems}
                        options={ALIGN_OPTIONS}
                        onChange={(value) =>
                            commitWorkspace(
                                setContainerFieldAtBreakpoint(
                                    workspace,
                                    selectedBreakpoint,
                                    "justifyItems",
                                    value as GridWorkspaceState["base"]["container"]["justifyItems"],
                                ),
                            )
                        }
                    />
                    <SelectField
                        label="align-items"
                        value={currentState.container.alignItems}
                        options={ALIGN_OPTIONS}
                        onChange={(value) =>
                            commitWorkspace(
                                setContainerFieldAtBreakpoint(
                                    workspace,
                                    selectedBreakpoint,
                                    "alignItems",
                                    value as GridWorkspaceState["base"]["container"]["alignItems"],
                                ),
                            )
                        }
                    />
                    <SelectField
                        label="justify-content"
                        value={currentState.container.justifyContent}
                        options={CONTENT_ALIGN_OPTIONS}
                        onChange={(value) =>
                            commitWorkspace(
                                setContainerFieldAtBreakpoint(
                                    workspace,
                                    selectedBreakpoint,
                                    "justifyContent",
                                    value as GridWorkspaceState["base"]["container"]["justifyContent"],
                                ),
                            )
                        }
                    />
                    <SelectField
                        label="align-content"
                        value={currentState.container.alignContent}
                        options={CONTENT_ALIGN_OPTIONS}
                        onChange={(value) =>
                            commitWorkspace(
                                setContainerFieldAtBreakpoint(
                                    workspace,
                                    selectedBreakpoint,
                                    "alignContent",
                                    value as GridWorkspaceState["base"]["container"]["alignContent"],
                                ),
                            )
                        }
                    />
                    <SelectField
                        label="grid-auto-flow"
                        value={currentState.container.autoFlow}
                        options={AUTO_FLOW_OPTIONS}
                        onChange={(value) =>
                            commitWorkspace(
                                setContainerFieldAtBreakpoint(
                                    workspace,
                                    selectedBreakpoint,
                                    "autoFlow",
                                    value as GridWorkspaceState["base"]["container"]["autoFlow"],
                                ),
                            )
                        }
                    />
                    <div className="space-y-2">
                        <Label htmlFor="auto-columns">grid-auto-columns</Label>
                        <Input
                            id="auto-columns"
                            value={currentState.container.autoColumns}
                            onChange={(event) =>
                                commitWorkspace(
                                    setContainerFieldAtBreakpoint(
                                        workspace,
                                        selectedBreakpoint,
                                        "autoColumns",
                                        event.target.value,
                                    ),
                                )
                            }
                            className="rounded-xl border-slate-200"
                        />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="auto-rows">grid-auto-rows</Label>
                        <Input
                            id="auto-rows"
                            value={currentState.container.autoRows}
                            onChange={(event) =>
                                commitWorkspace(
                                    setContainerFieldAtBreakpoint(
                                        workspace,
                                        selectedBreakpoint,
                                        "autoRows",
                                        event.target.value,
                                    ),
                                )
                            }
                            className="rounded-xl border-slate-200"
                        />
                    </div>
                </div>
            </div>
        );
    }

    function renderItemInspector() {
        if (!selectedItem) {
            return (
                <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_22px_55px_rgba(15,23,42,0.08)]">
                    <p className="text-sm font-semibold text-slate-900">
                        Item inspector
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Chọn một block trong canvas để chỉnh label, area name, vị
                        trí, span và alignment.
                    </p>
                </div>
            );
        }

        return (
            <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_22px_55px_rgba(15,23,42,0.08)]">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-slate-900">
                            Item inspector
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            {selectedItem.label} · {selectedItem.type}
                        </p>
                    </div>
                    <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-50">
                        {selectedItem.colSpan}x{selectedItem.rowSpan}
                    </Badge>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="item-label">Label</Label>
                        <Input
                            id="item-label"
                            value={selectedItem.label}
                            onChange={(event) =>
                                commitWorkspace(
                                    setItemFieldsAtBreakpoint(
                                        workspace,
                                        selectedBreakpoint,
                                        selectedItem.id,
                                        {
                                            label: event.target.value || selectedItem.label,
                                        },
                                    ),
                                )
                            }
                            className="rounded-xl border-slate-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="item-area-name">Area name</Label>
                        <Input
                            id="item-area-name"
                            value={selectedItem.areaName || ""}
                            onChange={(event) =>
                                commitWorkspace(
                                    setItemFieldsAtBreakpoint(
                                        workspace,
                                        selectedBreakpoint,
                                        selectedItem.id,
                                        {
                                            areaName: sanitizeAreaName(event.target.value),
                                        },
                                    ),
                                )
                            }
                            className="rounded-xl border-slate-200"
                        />
                    </div>
                    {([
                        ["colStart", "Col start"],
                        ["colSpan", "Col span"],
                        ["rowStart", "Row start"],
                        ["rowSpan", "Row span"],
                    ] as const).map(([field, label]) => (
                        <div key={field} className="space-y-2">
                            <Label htmlFor={field}>{label}</Label>
                            <Input
                                id={field}
                                type="number"
                                min={1}
                                max={24}
                                value={selectedItem[field]}
                                onChange={(event) =>
                                    tryUpdateSelectedItem(
                                        {
                                            ...selectedItem,
                                            [field]: parseIntegerInput(
                                                event.target.value,
                                                selectedItem[field],
                                            ),
                                        },
                                        "Không thể áp dụng vị trí/span vì item sẽ chồng lấp.",
                                    )
                                }
                                className="rounded-xl border-slate-200"
                            />
                        </div>
                    ))}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <SelectField
                        label="align-self"
                        value={selectedItem.alignSelf ?? "stretch"}
                        options={ALIGN_OPTIONS}
                        onChange={(value) =>
                            commitWorkspace(
                                setItemFieldsAtBreakpoint(
                                    workspace,
                                    selectedBreakpoint,
                                    selectedItem.id,
                                    { alignSelf: value as GridItemState["alignSelf"] },
                                ),
                            )
                        }
                    />
                    <SelectField
                        label="justify-self"
                        value={selectedItem.justifySelf ?? "stretch"}
                        options={ALIGN_OPTIONS}
                        onChange={(value) =>
                            commitWorkspace(
                                setItemFieldsAtBreakpoint(
                                    workspace,
                                    selectedBreakpoint,
                                    selectedItem.id,
                                    { justifySelf: value as GridItemState["justifySelf"] },
                                ),
                            )
                        }
                    />
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                        <p className="text-sm font-semibold text-slate-900">
                            Lock item
                        </p>
                        <p className="text-xs leading-5 text-slate-500">
                            Khóa item để tránh kéo thả hoặc resize nhầm.
                        </p>
                    </div>
                    <Checkbox
                        checked={selectedItem.locked ?? false}
                        onCheckedChange={(checked) =>
                            commitWorkspace(
                                setItemFieldsAtBreakpoint(
                                    workspace,
                                    selectedBreakpoint,
                                    selectedItem.id,
                                    { locked: checked === true },
                                ),
                            )
                        }
                    />
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={duplicateSelectedItem}
                        className="rounded-xl border-slate-200"
                    >
                        <Download className="mr-2 size-4" />
                        Nhân bản
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={deleteSelectedItem}
                        className="rounded-xl"
                    >
                        <Trash2 className="mr-2 size-4" />
                        Xóa item
                    </Button>
                </div>
            </div>
        );
    }

    function renderCodePanel() {
        return (
            <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_22px_55px_rgba(15,23,42,0.08)]">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-slate-900">
                            Export code
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            CSS, HTML và Tailwind đều bám vào cùng một state grid,
                            nên thay đổi trong canvas sẽ cập nhật output ngay.
                        </p>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                            copyText(selectedExportFormat, exportBundle.code)
                        }
                        className="rounded-full border-slate-200"
                    >
                        <Copy className="mr-2 size-4" />
                        {copyState === selectedExportFormat ? "Đã copy" : "Copy"}
                    </Button>
                </div>

                <Tabs
                    value={selectedExportFormat}
                    onValueChange={(value) =>
                        setSelectedExportFormat(value as GridExportFormat)
                    }
                    className="mt-4"
                >
                    <TabsList className="rounded-full bg-slate-100 p-1">
                        <TabsTrigger value="css" className="rounded-full">
                            CSS
                        </TabsTrigger>
                        <TabsTrigger value="html" className="rounded-full">
                            HTML
                        </TabsTrigger>
                        <TabsTrigger value="tailwind" className="rounded-full">
                            Tailwind
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value={selectedExportFormat} className="mt-4">
                        <ScrollArea className="h-[300px] rounded-2xl border border-slate-200 bg-slate-950 p-4">
                            <pre className="font-mono text-[12px] leading-6 text-slate-100">
                                <code>{exportBundle.code}</code>
                            </pre>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>

                {exportBundle.warnings.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-sm font-semibold text-amber-900">
                            Export warnings
                        </p>
                        <ul className="mt-2 space-y-2 text-sm leading-6 text-amber-800">
                            {exportBundle.warnings.map((warning) => (
                                <li key={`${warning.code}-${warning.message}`}>
                                    {warning.message}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
                        Exporter đã kiểm tra named areas, responsive breakpoints
                        và fallback line-based khi cần.
                    </div>
                )}
            </div>
        );
    }

    return (
        <section id="css-grid-generator-workspace" className="border-t border-slate-200 bg-[#f4f7f8]">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <Badge className="rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                            CSS Grid Generator Pro
                        </Badge>
                        <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                            Visual editor + responsive breakpoints + export code
                        </h2>
                        <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
                            Tool này được dựng theo hướng developer studio:
                            preset library lớn, block library, autosave, share
                            URL, undo/redo và export CSS + HTML + Tailwind trong
                            cùng một workspace.
                        </p>
                    </div>
                </div>

                <div className="hidden gap-5 xl:grid xl:grid-cols-[290px_minmax(0,1fr)_360px] xl:items-start">
                    {renderPresetRail()}
                    {renderCanvasPanel()}
                    <div className="space-y-5">
                        {renderContainerInspector()}
                        {renderItemInspector()}
                        {renderCodePanel()}
                    </div>
                </div>

                <div className="space-y-5 xl:hidden">
                    {renderCanvasPanel()}
                    <Tabs
                        value={mobileTab}
                        onValueChange={(value) =>
                            setMobileTab(value as MobileWorkspaceTab)
                        }
                        className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_22px_55px_rgba(15,23,42,0.08)]"
                    >
                        <TabsList className="rounded-full bg-slate-100 p-1">
                            <TabsTrigger value="canvas" className="rounded-full">
                                Canvas
                            </TabsTrigger>
                            <TabsTrigger value="presets" className="rounded-full">
                                Presets
                            </TabsTrigger>
                            <TabsTrigger value="inspector" className="rounded-full">
                                Inspector
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="canvas" className="mt-4">
                            {renderCodePanel()}
                        </TabsContent>
                        <TabsContent value="presets" className="mt-4">
                            {renderPresetRail()}
                        </TabsContent>
                        <TabsContent value="inspector" className="mt-4 space-y-5">
                            {renderContainerInspector()}
                            {renderItemInspector()}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </section>
    );
}
