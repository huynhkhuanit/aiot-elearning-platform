import { nanoid } from "nanoid";

import type {
    GridBlockDefinition,
    GridBreakpoint,
    GridBreakpointState,
    GridContainerState,
    GridItemState,
    GridResolvedState,
    GridWorkspaceState,
} from "./gridTypes";

const DEFAULT_CONTAINER: GridContainerState = {
    columns: 12,
    rows: 8,
    columnTrack: "minmax(0, 1fr)",
    rowTrack: "minmax(96px, auto)",
    customColumnsTemplate: "",
    customRowsTemplate: "",
    gap: 20,
    rowGap: 20,
    columnGap: 20,
    justifyItems: "stretch",
    alignItems: "stretch",
    justifyContent: "start",
    alignContent: "start",
    autoFlow: "row",
    autoColumns: "minmax(0, 1fr)",
    autoRows: "minmax(96px, auto)",
    padding: 20,
    minHeight: 680,
};

function nowIso() {
    return new Date().toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function asNumber(value: unknown, fallback: number) {
    const next = Number(value);
    return Number.isFinite(next) ? next : fallback;
}

function asString(value: unknown, fallback: string) {
    return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false) {
    return typeof value === "boolean" ? value : fallback;
}

function cloneWithJson<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

export function deepCloneWorkspace(workspace: GridWorkspaceState) {
    return cloneWithJson(workspace);
}

export function createEmptyBreakpointState(): GridBreakpointState {
    return {
        container: {},
        items: {},
    };
}

export function createDefaultContainer(
    overrides: Partial<GridContainerState> = {},
): GridContainerState {
    return {
        ...DEFAULT_CONTAINER,
        ...overrides,
        columns: clamp(Math.round(asNumber(overrides.columns, DEFAULT_CONTAINER.columns)), 1, 24),
        rows: clamp(Math.round(asNumber(overrides.rows, DEFAULT_CONTAINER.rows)), 1, 24),
        gap: clamp(Math.round(asNumber(overrides.gap, DEFAULT_CONTAINER.gap)), 0, 80),
        rowGap: clamp(
            Math.round(asNumber(overrides.rowGap, overrides.gap ?? DEFAULT_CONTAINER.rowGap)),
            0,
            80,
        ),
        columnGap: clamp(
            Math.round(
                asNumber(overrides.columnGap, overrides.gap ?? DEFAULT_CONTAINER.columnGap),
            ),
            0,
            80,
        ),
        padding: clamp(
            Math.round(asNumber(overrides.padding, DEFAULT_CONTAINER.padding)),
            0,
            80,
        ),
        minHeight: clamp(
            Math.round(asNumber(overrides.minHeight, DEFAULT_CONTAINER.minHeight)),
            420,
            1200,
        ),
    };
}

function normalizeItem(raw: unknown): GridItemState | null {
    if (!isRecord(raw)) {
        return null;
    }

    const id = asString(raw.id, "").trim();
    const label = asString(raw.label, "").trim();

    if (!id || !label) {
        return null;
    }

    return {
        id,
        label,
        type: (asString(raw.type, "card") as GridItemState["type"]) ?? "card",
        areaName: sanitizeAreaName(asString(raw.areaName, label)),
        rowStart: clamp(Math.round(asNumber(raw.rowStart, 1)), 1, 24),
        rowSpan: clamp(Math.round(asNumber(raw.rowSpan, 1)), 1, 24),
        colStart: clamp(Math.round(asNumber(raw.colStart, 1)), 1, 24),
        colSpan: clamp(Math.round(asNumber(raw.colSpan, 1)), 1, 24),
        alignSelf: (asString(raw.alignSelf, "") as GridItemState["alignSelf"]) || undefined,
        justifySelf:
            (asString(raw.justifySelf, "") as GridItemState["justifySelf"]) || undefined,
        locked: asBoolean(raw.locked, false),
    };
}

function normalizeContainer(raw: unknown, fallback: GridContainerState) {
    if (!isRecord(raw)) {
        return cloneWithJson(fallback);
    }

    return createDefaultContainer({
        ...fallback,
        columns: asNumber(raw.columns, fallback.columns),
        rows: asNumber(raw.rows, fallback.rows),
        columnTrack: asString(raw.columnTrack, fallback.columnTrack),
        rowTrack: asString(raw.rowTrack, fallback.rowTrack),
        customColumnsTemplate: asString(
            raw.customColumnsTemplate,
            fallback.customColumnsTemplate,
        ),
        customRowsTemplate: asString(raw.customRowsTemplate, fallback.customRowsTemplate),
        gap: asNumber(raw.gap, fallback.gap),
        rowGap: asNumber(raw.rowGap, fallback.rowGap),
        columnGap: asNumber(raw.columnGap, fallback.columnGap),
        justifyItems: asString(raw.justifyItems, fallback.justifyItems) as GridContainerState["justifyItems"],
        alignItems: asString(raw.alignItems, fallback.alignItems) as GridContainerState["alignItems"],
        justifyContent: asString(
            raw.justifyContent,
            fallback.justifyContent,
        ) as GridContainerState["justifyContent"],
        alignContent: asString(raw.alignContent, fallback.alignContent) as GridContainerState["alignContent"],
        autoFlow: asString(raw.autoFlow, fallback.autoFlow) as GridContainerState["autoFlow"],
        autoColumns: asString(raw.autoColumns, fallback.autoColumns),
        autoRows: asString(raw.autoRows, fallback.autoRows),
        padding: asNumber(raw.padding, fallback.padding),
        minHeight: asNumber(raw.minHeight, fallback.minHeight),
    });
}

function normalizeContainerOverride(
    raw: unknown,
    fallback: Partial<GridContainerState> = {},
): Partial<GridContainerState> {
    if (!isRecord(raw)) {
        return { ...fallback };
    }

    const next: Partial<GridContainerState> = { ...fallback };
    const containerKeys: (keyof GridContainerState)[] = [
        "columns",
        "rows",
        "columnTrack",
        "rowTrack",
        "customColumnsTemplate",
        "customRowsTemplate",
        "gap",
        "rowGap",
        "columnGap",
        "justifyItems",
        "alignItems",
        "justifyContent",
        "alignContent",
        "autoFlow",
        "autoColumns",
        "autoRows",
        "padding",
        "minHeight",
    ];

    for (const key of containerKeys) {
        if (!(key in raw)) {
            continue;
        }

        const value = raw[key];
        if (typeof DEFAULT_CONTAINER[key] === "number") {
            next[key] = asNumber(value, DEFAULT_CONTAINER[key] as number) as never;
            continue;
        }

        next[key] = asString(value, String(DEFAULT_CONTAINER[key])) as never;
    }

    return next;
}

function normalizeItemOverride(raw: unknown): Partial<GridItemState> {
    if (!isRecord(raw)) {
        return {};
    }

    const next: Partial<GridItemState> = {};
    const itemKeys: (keyof GridItemState)[] = [
        "rowStart",
        "rowSpan",
        "colStart",
        "colSpan",
        "alignSelf",
        "justifySelf",
        "areaName",
        "label",
        "locked",
        "type",
    ];

    for (const key of itemKeys) {
        if (!(key in raw)) {
            continue;
        }

        const value = raw[key];

        if (typeof value === "number") {
            next[key] = Math.round(value) as never;
            continue;
        }

        if (typeof value === "string") {
            next[key] = value as never;
            continue;
        }

        if (typeof value === "boolean") {
            next[key] = value as never;
        }
    }

    return next;
}

function normalizeBreakpointState(raw: unknown): GridBreakpointState {
    if (!isRecord(raw)) {
        return createEmptyBreakpointState();
    }

    const next: GridBreakpointState = {
        container: normalizeContainerOverride(raw.container),
        items: {},
    };

    if (isRecord(raw.items)) {
        for (const [itemId, itemOverride] of Object.entries(raw.items)) {
            next.items[itemId] = normalizeItemOverride(itemOverride);
        }
    }

    return next;
}

function normalizeWorkspaceMetadata(raw: unknown) {
    if (!isRecord(raw)) {
        return {
            createdAt: nowIso(),
            updatedAt: nowIso(),
        };
    }

    return {
        createdAt: asString(raw.createdAt, nowIso()),
        updatedAt: asString(raw.updatedAt, nowIso()),
    };
}

export function sanitizeAreaName(value: string) {
    const normalized = value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return normalized || "grid-item";
}

export function makeItemSlug(item: Pick<GridItemState, "id" | "label" | "areaName">) {
    return sanitizeAreaName(item.areaName || item.label || item.id);
}

export function buildItemClassName(item: Pick<GridItemState, "id" | "label" | "areaName">) {
    return `grid-item--${makeItemSlug(item)}`;
}

export function buildDefaultWorkspace(
    name = "Responsive Grid Layout",
): GridWorkspaceState {
    const timestamp = nowIso();
    return {
        version: 1,
        name,
        activePresetId: "blank-grid",
        base: {
            container: createDefaultContainer(),
            items: [],
        },
        breakpoints: {
            tablet: createEmptyBreakpointState(),
            mobile: createEmptyBreakpointState(),
        },
        metadata: {
            createdAt: timestamp,
            updatedAt: timestamp,
        },
    };
}

export function normalizeWorkspaceState(
    raw: unknown,
    fallback: GridWorkspaceState,
): GridWorkspaceState {
    if (!isRecord(raw)) {
        return deepCloneWorkspace(fallback);
    }

    const baseRecord = isRecord(raw.base) ? raw.base : {};
    const baseContainer = normalizeContainer(baseRecord.container, fallback.base.container);
    const baseItemsRaw = Array.isArray(baseRecord.items) ? baseRecord.items : [];
    const normalizedBaseItems = baseItemsRaw
        .map((item) => normalizeItem(item))
        .filter((item): item is GridItemState => Boolean(item))
        .map((item) => clampItemToContainer(item, baseContainer));

    return {
        version: 1,
        name: asString(raw.name, fallback.name),
        activePresetId: asString(raw.activePresetId, fallback.activePresetId),
        base: {
            container: baseContainer,
            items: normalizedBaseItems,
        },
        breakpoints: {
            tablet: normalizeBreakpointState(raw.breakpoints && isRecord(raw.breakpoints) ? raw.breakpoints.tablet : undefined),
            mobile: normalizeBreakpointState(raw.breakpoints && isRecord(raw.breakpoints) ? raw.breakpoints.mobile : undefined),
        },
        metadata: normalizeWorkspaceMetadata(raw.metadata),
    };
}

export function touchWorkspace(workspace: GridWorkspaceState) {
    workspace.metadata.updatedAt = nowIso();
    return workspace;
}

export function getParentBreakpoint(
    breakpoint: GridBreakpoint,
): GridBreakpoint | null {
    if (breakpoint === "mobile") {
        return "tablet";
    }

    if (breakpoint === "tablet") {
        return "desktop";
    }

    return null;
}

export function getGridTemplateColumns(container: GridContainerState) {
    return container.customColumnsTemplate.trim() ||
        `repeat(${container.columns}, ${container.columnTrack})`;
}

export function getGridTemplateRows(container: GridContainerState) {
    return container.customRowsTemplate.trim() ||
        `repeat(${container.rows}, ${container.rowTrack})`;
}

export function resolveBreakpointState(
    workspace: GridWorkspaceState,
    breakpoint: GridBreakpoint,
): GridResolvedState {
    const desktopContainer = normalizeContainer(workspace.base.container, DEFAULT_CONTAINER);
    const desktopItems = workspace.base.items.map((item) =>
        clampItemToContainer(item, desktopContainer),
    );

    if (breakpoint === "desktop") {
        return {
            breakpoint,
            container: desktopContainer,
            items: desktopItems,
        };
    }

    const tabletState = workspace.breakpoints.tablet;
    const tabletContainer = normalizeContainer(
        {
            ...desktopContainer,
            ...tabletState.container,
        },
        desktopContainer,
    );
    const tabletItems = desktopItems.map((item) =>
        clampItemToContainer(
            {
                ...item,
                ...(tabletState.items[item.id] ?? {}),
            },
            tabletContainer,
        ),
    );

    if (breakpoint === "tablet") {
        return {
            breakpoint,
            container: tabletContainer,
            items: tabletItems,
        };
    }

    const mobileState = workspace.breakpoints.mobile;
    const mobileContainer = normalizeContainer(
        {
            ...tabletContainer,
            ...mobileState.container,
        },
        tabletContainer,
    );
    const mobileItems = tabletItems.map((item) =>
        clampItemToContainer(
            {
                ...item,
                ...(mobileState.items[item.id] ?? {}),
            },
            mobileContainer,
        ),
    );

    return {
        breakpoint,
        container: mobileContainer,
        items: mobileItems,
    };
}

export function clampItemToContainer(
    item: GridItemState,
    container: GridContainerState,
) {
    const maxRowSpan = Math.max(1, container.rows);
    const maxColSpan = Math.max(1, container.columns);
    const rowSpan = clamp(item.rowSpan, 1, maxRowSpan);
    const colSpan = clamp(item.colSpan, 1, maxColSpan);
    const rowStart = clamp(item.rowStart, 1, Math.max(1, container.rows - rowSpan + 1));
    const colStart = clamp(item.colStart, 1, Math.max(1, container.columns - colSpan + 1));

    return {
        ...item,
        rowSpan,
        colSpan,
        rowStart,
        colStart,
        areaName: sanitizeAreaName(item.areaName || item.label),
    };
}

function isColliding(
    current: GridItemState,
    other: GridItemState,
) {
    const currentRowEnd = current.rowStart + current.rowSpan;
    const currentColEnd = current.colStart + current.colSpan;
    const otherRowEnd = other.rowStart + other.rowSpan;
    const otherColEnd = other.colStart + other.colSpan;

    return !(
        currentRowEnd <= other.rowStart ||
        otherRowEnd <= current.rowStart ||
        currentColEnd <= other.colStart ||
        otherColEnd <= current.colStart
    );
}

export function hasItemCollision(
    candidate: GridItemState,
    items: GridItemState[],
    ignoredItemId?: string,
) {
    return items.some((item) => item.id !== ignoredItemId && isColliding(candidate, item));
}

export function findFirstAvailablePlacement(
    items: GridItemState[],
    container: GridContainerState,
    colSpan: number,
    rowSpan: number,
) {
    const safeColSpan = clamp(colSpan, 1, container.columns);
    const safeRowSpan = clamp(rowSpan, 1, container.rows);
    const maxRows = Math.max(container.rows, 24);

    for (let row = 1; row <= maxRows; row += 1) {
        for (let col = 1; col <= container.columns; col += 1) {
            const candidate = clampItemToContainer(
                {
                    id: "__candidate__",
                    label: "Candidate",
                    type: "card",
                    rowStart: row,
                    rowSpan: safeRowSpan,
                    colStart: col,
                    colSpan: safeColSpan,
                    areaName: "candidate",
                },
                {
                    ...container,
                    rows: Math.max(container.rows, row + safeRowSpan),
                },
            );

            const outOfBounds =
                candidate.rowStart + candidate.rowSpan - 1 > container.rows ||
                candidate.colStart + candidate.colSpan - 1 > container.columns;

            if (!outOfBounds && !hasItemCollision(candidate, items)) {
                return {
                    rowStart: candidate.rowStart,
                    colStart: candidate.colStart,
                };
            }
        }
    }

    return {
        rowStart: 1,
        colStart: 1,
    };
}

export function createGridItemFromBlock(
    block: GridBlockDefinition,
    items: GridItemState[],
    container: GridContainerState,
): GridItemState {
    const placement = findFirstAvailablePlacement(
        items,
        container,
        block.defaultColSpan,
        block.defaultRowSpan,
    );
    const duplicateCount = items.filter((item) => item.type === block.type).length + 1;
    const label =
        duplicateCount === 1 ? block.label : `${block.label} ${duplicateCount}`;

    return {
        id: nanoid(),
        label,
        type: block.type,
        areaName: sanitizeAreaName(
            duplicateCount === 1
                ? block.defaultAreaName
                : `${block.defaultAreaName}-${duplicateCount}`,
        ),
        rowStart: placement.rowStart,
        rowSpan: block.defaultRowSpan,
        colStart: placement.colStart,
        colSpan: block.defaultColSpan,
    };
}

function getBaseItemIndex(workspace: GridWorkspaceState, itemId: string) {
    return workspace.base.items.findIndex((item) => item.id === itemId);
}

export function setContainerFieldAtBreakpoint<
    TField extends keyof GridContainerState,
>(
    workspace: GridWorkspaceState,
    breakpoint: GridBreakpoint,
    field: TField,
    value: GridContainerState[TField],
) {
    const next = deepCloneWorkspace(workspace);

    if (breakpoint === "desktop") {
        next.base.container[field] = value;
        touchWorkspace(next);
        return next;
    }

    const parentBreakpoint = getParentBreakpoint(breakpoint);
    if (!parentBreakpoint) {
        return workspace;
    }

    const parent = resolveBreakpointState(workspace, parentBreakpoint).container[field];
    if (value === parent) {
        delete next.breakpoints[breakpoint].container[field];
    } else {
        next.breakpoints[breakpoint].container[field] = value;
    }

    touchWorkspace(next);
    return next;
}

export function setItemFieldsAtBreakpoint(
    workspace: GridWorkspaceState,
    breakpoint: GridBreakpoint,
    itemId: string,
    patch: Partial<GridItemState>,
) {
    const next = deepCloneWorkspace(workspace);
    const baseIndex = getBaseItemIndex(next, itemId);

    if (baseIndex === -1) {
        return workspace;
    }

    if (breakpoint === "desktop") {
        next.base.items[baseIndex] = clampItemToContainer(
            {
                ...next.base.items[baseIndex],
                ...patch,
            },
            next.base.container,
        );
        touchWorkspace(next);
        return next;
    }

    const parentBreakpoint = getParentBreakpoint(breakpoint);
    if (!parentBreakpoint) {
        return workspace;
    }

    const parentItem = resolveBreakpointState(workspace, parentBreakpoint).items.find(
        (item) => item.id === itemId,
    );

    if (!parentItem) {
        return workspace;
    }

    const override = {
        ...(next.breakpoints[breakpoint].items[itemId] ?? {}),
    };

    for (const [key, value] of Object.entries(patch) as [
        keyof GridItemState,
        GridItemState[keyof GridItemState],
    ][]) {
        const parentValue = parentItem[key];

        if (value === parentValue) {
            delete override[key];
            continue;
        }

        override[key] = value as never;
    }

    if (Object.keys(override).length === 0) {
        delete next.breakpoints[breakpoint].items[itemId];
    } else {
        next.breakpoints[breakpoint].items[itemId] = override;
    }

    touchWorkspace(next);
    return next;
}

export function addBlockToWorkspace(
    workspace: GridWorkspaceState,
    block: GridBlockDefinition,
    breakpoint: GridBreakpoint,
) {
    const next = deepCloneWorkspace(workspace);
    const desktopItem = createGridItemFromBlock(
        block,
        next.base.items,
        next.base.container,
    );

    next.base.items.push(desktopItem);

    if (breakpoint !== "desktop") {
        const resolved = resolveBreakpointState(next, breakpoint);
        const currentItems = resolved.items.filter((item) => item.id !== desktopItem.id);
        const placement = findFirstAvailablePlacement(
            currentItems,
            resolved.container,
            Math.min(desktopItem.colSpan, resolved.container.columns),
            Math.min(desktopItem.rowSpan, resolved.container.rows),
        );

        next.breakpoints[breakpoint].items[desktopItem.id] = {
            rowStart: placement.rowStart,
            colStart: placement.colStart,
            colSpan: Math.min(desktopItem.colSpan, resolved.container.columns),
            rowSpan: Math.min(desktopItem.rowSpan, resolved.container.rows),
        };
    }

    touchWorkspace(next);
    return {
        workspace: next,
        itemId: desktopItem.id,
    };
}

export function duplicateItemInWorkspace(
    workspace: GridWorkspaceState,
    itemId: string,
) {
    const next = deepCloneWorkspace(workspace);
    const item = next.base.items.find((entry) => entry.id === itemId);

    if (!item) {
        return {
            workspace,
            itemId,
        };
    }

    const placement = findFirstAvailablePlacement(
        next.base.items,
        next.base.container,
        item.colSpan,
        item.rowSpan,
    );
    const duplicate: GridItemState = {
        ...item,
        id: nanoid(),
        label: `${item.label} Copy`,
        areaName: sanitizeAreaName(`${item.areaName || item.label}-copy`),
        rowStart: placement.rowStart,
        colStart: placement.colStart,
    };
    next.base.items.push(duplicate);
    touchWorkspace(next);

    return {
        workspace: next,
        itemId: duplicate.id,
    };
}

export function removeItemFromWorkspace(
    workspace: GridWorkspaceState,
    itemId: string,
) {
    const next = deepCloneWorkspace(workspace);
    next.base.items = next.base.items.filter((item) => item.id !== itemId);
    delete next.breakpoints.tablet.items[itemId];
    delete next.breakpoints.mobile.items[itemId];
    touchWorkspace(next);
    return next;
}

export function resetBreakpointOverrides(
    workspace: GridWorkspaceState,
    breakpoint: Exclude<GridBreakpoint, "desktop">,
) {
    const next = deepCloneWorkspace(workspace);
    next.breakpoints[breakpoint] = createEmptyBreakpointState();
    touchWorkspace(next);
    return next;
}

export function setWorkspaceName(
    workspace: GridWorkspaceState,
    name: string,
) {
    const next = deepCloneWorkspace(workspace);
    next.name = name.trim() || workspace.name;
    touchWorkspace(next);
    return next;
}

export function arePlacementsEqual(
    left: GridItemState,
    right: GridItemState,
) {
    return (
        left.rowStart === right.rowStart &&
        left.rowSpan === right.rowSpan &&
        left.colStart === right.colStart &&
        left.colSpan === right.colSpan &&
        left.alignSelf === right.alignSelf &&
        left.justifySelf === right.justifySelf
    );
}

export function countBreakpointOverrides(
    workspace: GridWorkspaceState,
    breakpoint: Exclude<GridBreakpoint, "desktop">,
) {
    const containerOverrides = Object.keys(workspace.breakpoints[breakpoint].container).length;
    const itemOverrides = Object.keys(workspace.breakpoints[breakpoint].items).length;
    return containerOverrides + itemOverrides;
}
