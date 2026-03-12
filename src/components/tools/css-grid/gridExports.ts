import type {
    GridAlignment,
    GridBreakpoint,
    GridContainerState,
    GridExportBundle,
    GridExportWarning,
    GridItemState,
    GridResolvedState,
    GridWorkspaceState,
} from "./gridTypes";
import {
    arePlacementsEqual,
    buildItemClassName,
    getGridTemplateColumns,
    getGridTemplateRows,
    makeItemSlug,
    resolveBreakpointState,
    sanitizeAreaName,
} from "./gridUtils";

const breakpointQueries: Record<Exclude<GridBreakpoint, "desktop">, string> = {
    tablet: "@media (max-width: 1100px)",
    mobile: "@media (max-width: 767px)",
};

type NamedAreaAnalysis = {
    valid: boolean;
    areaLines: string[];
    areaByItemId: Record<string, string>;
    warnings: GridExportWarning[];
};

function createWarning(code: string, message: string): GridExportWarning {
    return { code, message };
}

function analyzeNamedAreas(state: GridResolvedState): NamedAreaAnalysis {
    const matrix = Array.from({ length: state.container.rows }, () =>
        Array.from({ length: state.container.columns }, () => "."),
    );
    const areaByItemId: Record<string, string> = {};
    const usedAreaNames = new Set<string>();
    const warnings: GridExportWarning[] = [];

    for (const item of state.items) {
        const areaName = sanitizeAreaName(item.areaName || item.label);

        if (usedAreaNames.has(areaName)) {
            warnings.push(
                createWarning(
                    "duplicate-area-name",
                    `Area name "${areaName}" bị trùng ở breakpoint ${state.breakpoint}.`,
                ),
            );
            return {
                valid: false,
                areaLines: [],
                areaByItemId,
                warnings,
            };
        }

        usedAreaNames.add(areaName);
        areaByItemId[item.id] = areaName;

        for (let row = item.rowStart - 1; row < item.rowStart + item.rowSpan - 1; row += 1) {
            for (let col = item.colStart - 1; col < item.colStart + item.colSpan - 1; col += 1) {
                if (!matrix[row] || typeof matrix[row][col] === "undefined") {
                    warnings.push(
                        createWarning(
                            "out-of-bounds-item",
                            `Item "${item.label}" vượt ra ngoài grid ở breakpoint ${state.breakpoint}.`,
                        ),
                    );
                    return {
                        valid: false,
                        areaLines: [],
                        areaByItemId,
                        warnings,
                    };
                }

                if (matrix[row][col] !== ".") {
                    warnings.push(
                        createWarning(
                            "overlap-area",
                            `Item "${item.label}" bị chồng lấp khi tạo template areas ở breakpoint ${state.breakpoint}.`,
                        ),
                    );
                    return {
                        valid: false,
                        areaLines: [],
                        areaByItemId,
                        warnings,
                    };
                }

                matrix[row][col] = areaName;
            }
        }
    }

    for (const areaName of usedAreaNames) {
        let minRow = Number.POSITIVE_INFINITY;
        let maxRow = Number.NEGATIVE_INFINITY;
        let minCol = Number.POSITIVE_INFINITY;
        let maxCol = Number.NEGATIVE_INFINITY;

        for (let row = 0; row < matrix.length; row += 1) {
            for (let col = 0; col < matrix[row].length; col += 1) {
                if (matrix[row][col] !== areaName) {
                    continue;
                }

                minRow = Math.min(minRow, row);
                maxRow = Math.max(maxRow, row);
                minCol = Math.min(minCol, col);
                maxCol = Math.max(maxCol, col);
            }
        }

        for (let row = minRow; row <= maxRow; row += 1) {
            for (let col = minCol; col <= maxCol; col += 1) {
                if (matrix[row][col] !== areaName) {
                    warnings.push(
                        createWarning(
                            "non-rectangular-area",
                            `Area "${areaName}" không tạo thành hình chữ nhật hợp lệ ở breakpoint ${state.breakpoint}.`,
                        ),
                    );
                    return {
                        valid: false,
                        areaLines: [],
                        areaByItemId,
                        warnings,
                    };
                }
            }
        }
    }

    return {
        valid: true,
        areaLines: matrix.map((row) => `"${row.join(" ")}"`),
        areaByItemId,
        warnings,
    };
}

function formatContainerCss(
    container: GridContainerState,
    areaLines: string[] | null,
) {
    const lines = [
        "display: grid;",
        `grid-template-columns: ${getGridTemplateColumns(container)};`,
        `grid-template-rows: ${getGridTemplateRows(container)};`,
        areaLines
            ? `grid-template-areas:\n    ${areaLines.join("\n    ")};`
            : null,
        `gap: ${container.gap}px;`,
        `row-gap: ${container.rowGap}px;`,
        `column-gap: ${container.columnGap}px;`,
        `justify-items: ${container.justifyItems};`,
        `align-items: ${container.alignItems};`,
        `justify-content: ${container.justifyContent};`,
        `align-content: ${container.alignContent};`,
        `grid-auto-flow: ${container.autoFlow};`,
        `grid-auto-columns: ${container.autoColumns};`,
        `grid-auto-rows: ${container.autoRows};`,
        `padding: ${container.padding}px;`,
        `min-height: ${container.minHeight}px;`,
    ].filter(Boolean);

    return lines.join("\n  ");
}

function formatItemCss(
    item: GridItemState,
    areaName: string | undefined,
    useNamedAreas: boolean,
) {
    const lines = useNamedAreas && areaName
        ? [`grid-area: ${areaName};`]
        : [
              `grid-column: ${item.colStart} / span ${item.colSpan};`,
              `grid-row: ${item.rowStart} / span ${item.rowSpan};`,
          ];

    if (item.alignSelf) {
        lines.push(`align-self: ${item.alignSelf};`);
    }

    if (item.justifySelf) {
        lines.push(`justify-self: ${item.justifySelf};`);
    }

    return lines.join("\n  ");
}

function buildCssBundle(workspace: GridWorkspaceState): GridExportBundle {
    const desktop = resolveBreakpointState(workspace, "desktop");
    const tablet = resolveBreakpointState(workspace, "tablet");
    const mobile = resolveBreakpointState(workspace, "mobile");
    const analyses = [desktop, tablet, mobile].map((state) => analyzeNamedAreas(state));
    const useNamedAreas = analyses.every((analysis) => analysis.valid);
    const warnings = useNamedAreas
        ? []
        : [
              createWarning(
                  "fallback-line-placement",
                  "Grid hiện không hợp lệ cho grid-template-areas trên mọi breakpoint, nên exporter đã fallback sang line-based CSS.",
              ),
              ...analyses.flatMap((analysis) => analysis.warnings),
          ];

    const blocks: string[] = [];

    const states: [GridResolvedState, string[] | null][] = [
        [desktop, useNamedAreas ? analyses[0].areaLines : null],
        [tablet, useNamedAreas ? analyses[1].areaLines : null],
        [mobile, useNamedAreas ? analyses[2].areaLines : null],
    ];

    blocks.push(
        `.grid-layout {\n  ${formatContainerCss(desktop.container, states[0][1])}\n}`,
    );

    for (const item of desktop.items) {
        blocks.push(
            `.${buildItemClassName(item)} {\n  ${formatItemCss(
                item,
                useNamedAreas ? analyses[0].areaByItemId[item.id] : undefined,
                useNamedAreas,
            )}\n}`,
        );
    }

    (["tablet", "mobile"] as const).forEach((breakpoint, index) => {
        const state = states[index + 1][0];
        const areaLines = states[index + 1][1];
        const scopedRules = [
            `.grid-layout {\n  ${formatContainerCss(state.container, areaLines)}\n}`,
            ...state.items.map(
                (item) =>
                    `.${buildItemClassName(item)} {\n  ${formatItemCss(
                        item,
                        useNamedAreas
                            ? analyses[index + 1].areaByItemId[item.id]
                            : undefined,
                        useNamedAreas,
                    )}\n}`,
            ),
        ];

        blocks.push(`${breakpointQueries[breakpoint]} {\n${indentLines(scopedRules.join("\n\n"), 1)}\n}`);
    });

    return {
        code: blocks.join("\n\n"),
        warnings,
    };
}

function semanticTagForItem(item: GridItemState) {
    switch (item.type) {
        case "header":
            return "header";
        case "footer":
            return "footer";
        case "nav":
            return "nav";
        case "sidebar":
            return "aside";
        case "hero":
        case "cta":
        case "content":
            return "section";
        case "chart":
        case "card":
        case "panel":
        default:
            return "article";
    }
}

function buildHtmlBundle(workspace: GridWorkspaceState): GridExportBundle {
    const desktop = resolveBreakpointState(workspace, "desktop");
    const analyses = ["desktop", "tablet", "mobile"].map((breakpoint) =>
        analyzeNamedAreas(resolveBreakpointState(workspace, breakpoint as GridBreakpoint)),
    );
    const useNamedAreas = analyses.every((analysis) => analysis.valid);
    const warnings = useNamedAreas
        ? []
        : [
              createWarning(
                  "html-fallback-line-placement",
                  "HTML export vẫn giữ class names ổn định, nhưng CSS nên dùng line-placement vì template areas chưa hợp lệ trên mọi breakpoint.",
              ),
          ];

    const markup = desktop.items
        .map((item) => {
            const tag = semanticTagForItem(item);
            const className = buildItemClassName(item);
            const areaName = sanitizeAreaName(item.areaName || item.label);
            const contentLabel = item.label;
            const areaAttribute = useNamedAreas ? ` data-area="${areaName}"` : "";

            return `<${tag} class="grid-item ${className}"${areaAttribute}>\n  <span class="grid-item__label">${contentLabel}</span>\n</${tag}>`;
        })
        .join("\n");

    return {
        code: `<div class="grid-layout">\n${indentLines(markup, 1)}\n</div>`,
        warnings,
    };
}

function toTailwindArbitrary(value: string | number) {
    return String(value).trim().replace(/\s+/g, "_");
}

function mapAlignClass(value: GridAlignment | undefined, prefix = "") {
    if (!value) {
        return null;
    }

    if (prefix === "justify-self") {
        return `${prefix}-${value}`;
    }

    if (prefix === "self") {
        return `${prefix}-${value}`;
    }

    if (prefix === "justify-items") {
        return `${prefix}-${value}`;
    }

    if (prefix === "items") {
        return `${prefix}-${value}`;
    }

    return null;
}

function mapJustifyContentClass(value: GridContainerState["justifyContent"]) {
    const map: Record<GridContainerState["justifyContent"], string> = {
        start: "justify-start",
        center: "justify-center",
        end: "justify-end",
        stretch: "[justify-content:stretch]",
        "space-between": "justify-between",
        "space-around": "justify-around",
        "space-evenly": "justify-evenly",
    };

    return map[value];
}

function mapAlignContentClass(value: GridContainerState["alignContent"]) {
    const map: Record<GridContainerState["alignContent"], string> = {
        start: "content-start",
        center: "content-center",
        end: "content-end",
        stretch: "content-stretch",
        "space-between": "content-between",
        "space-around": "content-around",
        "space-evenly": "content-evenly",
    };

    return map[value];
}

function mapAutoFlowClass(value: GridContainerState["autoFlow"]) {
    const map: Record<GridContainerState["autoFlow"], string> = {
        row: "grid-flow-row",
        column: "grid-flow-col",
        dense: "grid-flow-dense",
        "row dense": "grid-flow-row-dense",
        "column dense": "grid-flow-col-dense",
    };

    return map[value];
}

function buildContainerTailwindClasses(
    container: GridContainerState,
    prefix = "",
) {
    const classes = [
        `${prefix}grid`,
        `${prefix}grid-cols-[${toTailwindArbitrary(getGridTemplateColumns(container))}]`,
        `${prefix}grid-rows-[${toTailwindArbitrary(getGridTemplateRows(container))}]`,
        `${prefix}gap-[${container.gap}px]`,
        `${prefix}gap-y-[${container.rowGap}px]`,
        `${prefix}gap-x-[${container.columnGap}px]`,
        `${prefix}${mapAlignClass(container.justifyItems, "justify-items")}`,
        `${prefix}${mapAlignClass(container.alignItems, "items")}`,
        `${prefix}${mapJustifyContentClass(container.justifyContent)}`,
        `${prefix}${mapAlignContentClass(container.alignContent)}`,
        `${prefix}${mapAutoFlowClass(container.autoFlow)}`,
        `${prefix}auto-cols-[${toTailwindArbitrary(container.autoColumns)}]`,
        `${prefix}auto-rows-[${toTailwindArbitrary(container.autoRows)}]`,
        `${prefix}p-[${container.padding}px]`,
        `${prefix}min-h-[${container.minHeight}px]`,
    ].filter(Boolean);

    return classes;
}

function buildItemTailwindClasses(
    item: GridItemState,
    prefix = "",
) {
    return [
        `${prefix}col-[${item.colStart}/span_${item.colSpan}]`,
        `${prefix}row-[${item.rowStart}/span_${item.rowSpan}]`,
        item.alignSelf ? `${prefix}${mapAlignClass(item.alignSelf, "self")}` : null,
        item.justifySelf
            ? `${prefix}${mapAlignClass(item.justifySelf, "justify-self")}`
            : null,
    ].filter(Boolean) as string[];
}

function buildTailwindBundle(workspace: GridWorkspaceState): GridExportBundle {
    const mobile = resolveBreakpointState(workspace, "mobile");
    const tablet = resolveBreakpointState(workspace, "tablet");
    const desktop = resolveBreakpointState(workspace, "desktop");
    const warnings: GridExportWarning[] = [];

    const containerClasses = [
        ...buildContainerTailwindClasses(mobile.container),
        ...buildContainerTailwindClasses(tablet.container, "md:"),
        ...buildContainerTailwindClasses(desktop.container, "lg:"),
    ];

    const markup = mobile.items
        .map((mobileItem) => {
            const tabletItem =
                tablet.items.find((item) => item.id === mobileItem.id) ?? mobileItem;
            const desktopItem =
                desktop.items.find((item) => item.id === mobileItem.id) ?? tabletItem;
            const tag = semanticTagForItem(mobileItem);
            const classes = [
                "rounded-[22px]",
                "border",
                "border-white/10",
                "bg-white/5",
                "p-4",
                "shadow-[0_18px_48px_rgba(15,23,42,0.12)]",
                "backdrop-blur-sm",
                ...buildItemTailwindClasses(mobileItem),
                ...(!arePlacementsEqual(tabletItem, mobileItem)
                    ? buildItemTailwindClasses(tabletItem, "md:")
                    : []),
                ...(!arePlacementsEqual(desktopItem, tabletItem)
                    ? buildItemTailwindClasses(desktopItem, "lg:")
                    : []),
            ];

            return `<${tag} className="${classes.join(" ")}">\n  <span className="text-sm font-semibold tracking-[0.12em] uppercase text-slate-200">${mobileItem.label}</span>\n</${tag}>`;
        })
        .join("\n");

    return {
        code: `<div className="${containerClasses.join(" ")}">\n${indentLines(markup, 1)}\n</div>`,
        warnings,
    };
}

function indentLines(value: string, depth: number) {
    const indent = "  ".repeat(depth);
    return value
        .split("\n")
        .map((line) => `${indent}${line}`)
        .join("\n");
}

export function generateCssOutput(workspace: GridWorkspaceState) {
    return buildCssBundle(workspace).code;
}

export function generateHtmlOutput(workspace: GridWorkspaceState) {
    return buildHtmlBundle(workspace).code;
}

export function generateTailwindOutput(workspace: GridWorkspaceState) {
    return buildTailwindBundle(workspace).code;
}

export function getGridExportBundle(
    workspace: GridWorkspaceState,
    format: "css" | "html" | "tailwind",
): GridExportBundle {
    if (format === "css") {
        return buildCssBundle(workspace);
    }

    if (format === "html") {
        return buildHtmlBundle(workspace);
    }

    return buildTailwindBundle(workspace);
}
