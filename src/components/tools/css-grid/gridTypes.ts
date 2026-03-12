export const GRID_BREAKPOINTS = ["desktop", "tablet", "mobile"] as const;

export type GridBreakpoint = (typeof GRID_BREAKPOINTS)[number];

export type GridExportFormat = "css" | "html" | "tailwind";

export type GridAlignment = "start" | "center" | "end" | "stretch";

export type GridContentAlignment =
    | "start"
    | "center"
    | "end"
    | "space-between"
    | "space-around"
    | "space-evenly"
    | "stretch";

export type GridAutoFlow =
    | "row"
    | "column"
    | "dense"
    | "row dense"
    | "column dense";

export type GridTrackToken = string;

export type GridBlockType =
    | "header"
    | "sidebar"
    | "hero"
    | "card"
    | "chart"
    | "cta"
    | "footer"
    | "content"
    | "nav"
    | "panel";

export type GridContainerState = {
    columns: number;
    rows: number;
    columnTrack: GridTrackToken;
    rowTrack: GridTrackToken;
    customColumnsTemplate: string;
    customRowsTemplate: string;
    gap: number;
    rowGap: number;
    columnGap: number;
    justifyItems: GridAlignment;
    alignItems: GridAlignment;
    justifyContent: GridContentAlignment;
    alignContent: GridContentAlignment;
    autoFlow: GridAutoFlow;
    autoColumns: GridTrackToken;
    autoRows: GridTrackToken;
    padding: number;
    minHeight: number;
};

export type GridItemState = {
    id: string;
    label: string;
    type: GridBlockType;
    areaName?: string;
    rowStart: number;
    rowSpan: number;
    colStart: number;
    colSpan: number;
    alignSelf?: GridAlignment;
    justifySelf?: GridAlignment;
    locked?: boolean;
};

export type GridBreakpointState = {
    container: Partial<GridContainerState>;
    items: Record<string, Partial<GridItemState>>;
};

export type GridWorkspaceState = {
    version: 1;
    name: string;
    activePresetId: string;
    base: {
        container: GridContainerState;
        items: GridItemState[];
    };
    breakpoints: {
        tablet: GridBreakpointState;
        mobile: GridBreakpointState;
    };
    metadata: {
        createdAt: string;
        updatedAt: string;
    };
};

export type GridResolvedState = {
    breakpoint: GridBreakpoint;
    container: GridContainerState;
    items: GridItemState[];
};

export type GridPresetCategory =
    | "dashboard"
    | "bento"
    | "sidebar"
    | "holy-grail"
    | "docs"
    | "gallery"
    | "pricing"
    | "blog"
    | "admin";

export type GridPreset = {
    id: string;
    name: string;
    category: GridPresetCategory;
    summary: string;
    accent: string;
    tags: string[];
    workspace: GridWorkspaceState;
};

export type GridBlockDefinition = {
    type: GridBlockType;
    label: string;
    description: string;
    accent: string;
    defaultAreaName: string;
    defaultColSpan: number;
    defaultRowSpan: number;
};

export type GridHistoryState = {
    stack: GridWorkspaceState[];
    index: number;
};

export type GridExportWarning = {
    code: string;
    message: string;
};

export type GridExportBundle = {
    code: string;
    warnings: GridExportWarning[];
};
