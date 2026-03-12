import type {
    GridBlockDefinition,
    GridBreakpointState,
    GridContainerState,
    GridItemState,
    GridPreset,
    GridWorkspaceState,
} from "./gridTypes";
import { buildDefaultWorkspace, createDefaultContainer, sanitizeAreaName } from "./gridUtils";

const responsiveFullWidthTypes = new Set<GridItemState["type"]>([
    "header",
    "footer",
    "hero",
    "cta",
    "content",
    "nav",
    "sidebar",
]);

function item(
    id: string,
    label: string,
    type: GridItemState["type"],
    colStart: number,
    colSpan: number,
    rowStart: number,
    rowSpan: number,
    areaName = label,
): GridItemState {
    return {
        id,
        label,
        type,
        areaName: sanitizeAreaName(areaName),
        colStart,
        colSpan,
        rowStart,
        rowSpan,
    };
}

function getResponsiveColSpan(itemState: GridItemState, columns: number) {
    if (responsiveFullWidthTypes.has(itemState.type)) {
        return columns;
    }

    if (columns >= 8) {
        return Math.min(4, columns);
    }

    return columns;
}

function getResponsiveRowSpan(itemState: GridItemState, columns: number) {
    if (columns <= 4) {
        return Math.max(1, Math.min(itemState.rowSpan, 2));
    }

    if (itemState.type === "hero" || itemState.type === "content") {
        return Math.max(2, itemState.rowSpan);
    }

    return itemState.rowSpan;
}

function packBreakpointItems(
    items: GridItemState[],
    columns: number,
): GridBreakpointState {
    let cursorCol = 1;
    let cursorRow = 1;
    let activeRowSpan = 1;
    const overrides: GridBreakpointState["items"] = {};

    for (const currentItem of items
        .slice()
        .sort((left, right) => left.rowStart - right.rowStart || left.colStart - right.colStart)) {
        const colSpan = getResponsiveColSpan(currentItem, columns);
        const rowSpan = getResponsiveRowSpan(currentItem, columns);

        if (cursorCol + colSpan - 1 > columns) {
            cursorCol = 1;
            cursorRow += activeRowSpan;
            activeRowSpan = 1;
        }

        overrides[currentItem.id] = {
            colStart: cursorCol,
            colSpan,
            rowStart: cursorRow,
            rowSpan,
        };

        cursorCol += colSpan;
        activeRowSpan = Math.max(activeRowSpan, rowSpan);
    }

    const rows = cursorRow + activeRowSpan - 1;

    return {
        container: {
            columns,
            rows,
            minHeight: Math.max(560, rows * 92),
        },
        items: overrides,
    };
}

function createPresetWorkspace(
    presetId: string,
    name: string,
    container: Partial<GridContainerState>,
    items: GridItemState[],
): GridWorkspaceState {
    const workspace = buildDefaultWorkspace(name);
    workspace.activePresetId = presetId;
    workspace.base.container = createDefaultContainer(container);
    workspace.base.items = items;
    workspace.breakpoints.tablet = packBreakpointItems(items, 8);
    workspace.breakpoints.mobile = packBreakpointItems(items, 4);
    return workspace;
}

export const GRID_BLOCK_LIBRARY: GridBlockDefinition[] = [
    {
        type: "header",
        label: "Header",
        description: "Thanh điều hướng hoặc toolbar cố định ở đầu trang.",
        accent: "#22c55e",
        defaultAreaName: "header",
        defaultColSpan: 12,
        defaultRowSpan: 1,
    },
    {
        type: "sidebar",
        label: "Sidebar",
        description: "Cột điều hướng, filter hoặc secondary navigation.",
        accent: "#14b8a6",
        defaultAreaName: "sidebar",
        defaultColSpan: 3,
        defaultRowSpan: 4,
    },
    {
        type: "hero",
        label: "Hero",
        description: "Khối nổi bật cho insight, metric chính hoặc intro layout.",
        accent: "#38bdf8",
        defaultAreaName: "hero",
        defaultColSpan: 7,
        defaultRowSpan: 3,
    },
    {
        type: "card",
        label: "Card",
        description: "Thẻ nội dung, card dữ liệu, product tile hoặc summary item.",
        accent: "#f59e0b",
        defaultAreaName: "card",
        defaultColSpan: 4,
        defaultRowSpan: 2,
    },
    {
        type: "chart",
        label: "Chart",
        description: "Khối biểu đồ, heatmap hoặc analytics visualization.",
        accent: "#f97316",
        defaultAreaName: "chart",
        defaultColSpan: 4,
        defaultRowSpan: 2,
    },
    {
        type: "cta",
        label: "CTA",
        description: "Call-to-action hoặc announcement nổi bật.",
        accent: "#10b981",
        defaultAreaName: "cta",
        defaultColSpan: 5,
        defaultRowSpan: 2,
    },
    {
        type: "content",
        label: "Content",
        description: "Khối nội dung dài cho docs, blog, dashboard feed hoặc editor.",
        accent: "#a855f7",
        defaultAreaName: "content",
        defaultColSpan: 6,
        defaultRowSpan: 3,
    },
    {
        type: "panel",
        label: "Panel",
        description: "Panel phụ cho activity feed, checklist hoặc command card.",
        accent: "#94a3b8",
        defaultAreaName: "panel",
        defaultColSpan: 3,
        defaultRowSpan: 2,
    },
    {
        type: "footer",
        label: "Footer",
        description: "Khối cuối trang cho secondary links hoặc recap.",
        accent: "#e2e8f0",
        defaultAreaName: "footer",
        defaultColSpan: 12,
        defaultRowSpan: 1,
    },
];

export const GRID_PRESETS: GridPreset[] = [
    {
        id: "dashboard-command-center",
        name: "Dashboard Command Center",
        category: "dashboard",
        summary: "Bố cục dashboard 12 cột cho metrics, chart, queue và action panel.",
        accent: "#22c55e",
        tags: ["dashboard", "metrics", "analytics"],
        workspace: createPresetWorkspace(
            "dashboard-command-center",
            "Dashboard Command Center",
            {
                rows: 8,
                minHeight: 760,
                gap: 18,
                rowGap: 18,
                columnGap: 18,
            },
            [
                item("header", "Top Bar", "header", 1, 12, 1, 1, "header"),
                item("sidebar", "Ops Sidebar", "sidebar", 1, 3, 2, 5, "sidebar"),
                item("hero", "Mission Control", "hero", 4, 6, 2, 2, "hero"),
                item("cta", "Critical Alerts", "cta", 10, 3, 2, 2, "cta"),
                item("chart-1", "Traffic Pulse", "chart", 4, 4, 4, 2, "traffic"),
                item("chart-2", "Conversion Map", "chart", 8, 5, 4, 2, "conversion"),
                item("panel-1", "Action Queue", "panel", 4, 3, 6, 2, "queue"),
                item("card-1", "Team Feed", "card", 7, 3, 6, 2, "feed"),
                item("card-2", "SLA Watch", "card", 10, 3, 6, 2, "sla"),
                item("footer", "Summary Footer", "footer", 1, 12, 8, 1, "footer"),
            ],
        ),
    },
    {
        id: "analytics-bento-board",
        name: "Analytics Bento Board",
        category: "bento",
        summary: "Bento grid cho landing, highlights, metric card và storytelling.",
        accent: "#06b6d4",
        tags: ["bento", "landing", "storytelling"],
        workspace: createPresetWorkspace(
            "analytics-bento-board",
            "Analytics Bento Board",
            {
                rows: 7,
                gap: 16,
                rowGap: 16,
                columnGap: 16,
                minHeight: 720,
            },
            [
                item("hero", "Launch Story", "hero", 1, 7, 1, 3, "launch-story"),
                item("cta", "Primary CTA", "cta", 8, 5, 1, 2, "launch-cta"),
                item("card-1", "Revenue Delta", "card", 8, 2, 3, 2, "revenue"),
                item("card-2", "Churn Risk", "card", 10, 3, 3, 2, "churn"),
                item("chart-1", "Acquisition Funnel", "chart", 1, 4, 4, 2, "funnel"),
                item("chart-2", "Retention Signal", "chart", 5, 4, 4, 2, "retention"),
                item("panel-1", "Proof Blocks", "panel", 9, 4, 5, 2, "proof"),
                item("footer", "Trust Footer", "footer", 1, 12, 7, 1, "footer"),
            ],
        ),
    },
    {
        id: "saas-admin-hub",
        name: "SaaS Admin Hub",
        category: "admin",
        summary: "App shell cho admin panel với nav, content, tables và live cards.",
        accent: "#14b8a6",
        tags: ["admin", "app-shell", "tables"],
        workspace: createPresetWorkspace(
            "saas-admin-hub",
            "SaaS Admin Hub",
            {
                rows: 9,
                minHeight: 780,
                gap: 20,
            },
            [
                item("header", "Admin Header", "header", 1, 12, 1, 1, "header"),
                item("nav", "Section Nav", "nav", 1, 2, 2, 1, "nav"),
                item("sidebar", "Entity Sidebar", "sidebar", 1, 2, 3, 5, "sidebar"),
                item("content", "Main Table", "content", 3, 7, 2, 4, "main-table"),
                item("panel-1", "Approval Queue", "panel", 10, 3, 2, 2, "approval"),
                item("chart-1", "Error Rate", "chart", 10, 3, 4, 2, "errors"),
                item("card-1", "Storage", "card", 3, 3, 6, 2, "storage"),
                item("card-2", "Latency", "card", 6, 3, 6, 2, "latency"),
                item("cta", "Broadcast Banner", "cta", 9, 4, 6, 2, "broadcast"),
                item("footer", "Audit Footer", "footer", 1, 12, 9, 1, "footer"),
            ],
        ),
    },
    {
        id: "classic-holy-grail",
        name: "Classic Holy Grail",
        category: "holy-grail",
        summary: "Mẫu three-column quen thuộc cho editorial, portal hoặc docs shell.",
        accent: "#f97316",
        tags: ["holy-grail", "portal", "editorial"],
        workspace: createPresetWorkspace(
            "classic-holy-grail",
            "Classic Holy Grail",
            {
                rows: 8,
                minHeight: 740,
                gap: 18,
            },
            [
                item("header", "Site Header", "header", 1, 12, 1, 1, "header"),
                item("nav", "Primary Nav", "nav", 1, 12, 2, 1, "nav"),
                item("sidebar-left", "Left Rail", "sidebar", 1, 2, 3, 4, "left-rail"),
                item("content", "Editorial Body", "content", 3, 7, 3, 4, "body"),
                item("sidebar-right", "Insight Rail", "sidebar", 10, 3, 3, 4, "right-rail"),
                item("cta", "Subscription Banner", "cta", 3, 10, 7, 1, "subscribe"),
                item("footer", "Site Footer", "footer", 1, 12, 8, 1, "footer"),
            ],
        ),
    },
    {
        id: "dual-sidebar-docs",
        name: "Dual Sidebar Docs",
        category: "docs",
        summary: "Docs layout với nav trái, toc phải và vùng article trung tâm.",
        accent: "#38bdf8",
        tags: ["docs", "toc", "knowledge-base"],
        workspace: createPresetWorkspace(
            "dual-sidebar-docs",
            "Dual Sidebar Docs",
            {
                rows: 8,
                minHeight: 760,
                gap: 18,
            },
            [
                item("header", "Docs Header", "header", 1, 12, 1, 1, "header"),
                item("sidebar-left", "Navigation", "sidebar", 1, 2, 2, 6, "navigation"),
                item("content", "Article Body", "content", 3, 7, 2, 6, "article"),
                item("sidebar-right", "Reading Map", "sidebar", 10, 3, 2, 4, "reading-map"),
                item("panel-1", "API Notes", "panel", 10, 3, 6, 2, "api-notes"),
                item("footer", "Docs Footer", "footer", 1, 12, 8, 1, "footer"),
            ],
        ),
    },
    {
        id: "course-knowledge-base",
        name: "Course Knowledge Base",
        category: "docs",
        summary: "Bố cục khóa học với syllabus, lesson content và exercise rail.",
        accent: "#8b5cf6",
        tags: ["course", "education", "syllabus"],
        workspace: createPresetWorkspace(
            "course-knowledge-base",
            "Course Knowledge Base",
            {
                rows: 9,
                minHeight: 780,
                gap: 18,
            },
            [
                item("header", "Course Header", "header", 1, 12, 1, 1, "header"),
                item("sidebar", "Lesson Index", "sidebar", 1, 3, 2, 6, "lesson-index"),
                item("hero", "Lesson Intro", "hero", 4, 6, 2, 2, "lesson-intro"),
                item("panel-1", "Progress Panel", "panel", 10, 3, 2, 2, "progress-panel"),
                item("content", "Lecture Notes", "content", 4, 6, 4, 3, "lecture-notes"),
                item("chart-1", "Concept Map", "chart", 10, 3, 4, 2, "concept-map"),
                item("cta", "Hands-on Lab", "cta", 4, 9, 7, 2, "hands-on-lab"),
                item("footer", "Course Footer", "footer", 1, 12, 9, 1, "footer"),
            ],
        ),
    },
    {
        id: "masonry-gallery-showcase",
        name: "Masonry Gallery Showcase",
        category: "gallery",
        summary: "Portfolio gallery nhiều nhịp điệu cho case study, ảnh và quote block.",
        accent: "#f59e0b",
        tags: ["gallery", "portfolio", "showcase"],
        workspace: createPresetWorkspace(
            "masonry-gallery-showcase",
            "Masonry Gallery Showcase",
            {
                rows: 9,
                minHeight: 780,
                gap: 16,
            },
            [
                item("hero", "Featured Project", "hero", 1, 6, 1, 3, "featured"),
                item("card-1", "Case Study 01", "card", 7, 3, 1, 2, "case-study-01"),
                item("card-2", "Case Study 02", "card", 10, 3, 1, 3, "case-study-02"),
                item("card-3", "Case Study 03", "card", 7, 3, 3, 2, "case-study-03"),
                item("chart-1", "Moodboard", "chart", 1, 3, 4, 2, "moodboard"),
                item("content", "Case Narrative", "content", 4, 6, 4, 3, "narrative"),
                item("panel-1", "Quote", "panel", 10, 3, 4, 2, "quote"),
                item("cta", "Book a Call", "cta", 1, 12, 8, 1, "book-call"),
                item("footer", "Studio Footer", "footer", 1, 12, 9, 1, "footer"),
            ],
        ),
    },
    {
        id: "portfolio-split-gallery",
        name: "Portfolio Split Gallery",
        category: "gallery",
        summary: "Split layout cho studio portfolio với intro, thumbnails và proof blocks.",
        accent: "#0ea5e9",
        tags: ["portfolio", "split", "studio"],
        workspace: createPresetWorkspace(
            "portfolio-split-gallery",
            "Portfolio Split Gallery",
            {
                rows: 8,
                minHeight: 740,
                gap: 16,
            },
            [
                item("header", "Studio Nav", "header", 1, 12, 1, 1, "header"),
                item("hero", "Manifesto", "hero", 1, 5, 2, 4, "manifesto"),
                item("card-1", "Project Tile 01", "card", 6, 3, 2, 2, "tile-01"),
                item("card-2", "Project Tile 02", "card", 9, 4, 2, 2, "tile-02"),
                item("card-3", "Project Tile 03", "card", 6, 4, 4, 2, "tile-03"),
                item("panel-1", "Awards", "panel", 10, 3, 4, 2, "awards"),
                item("cta", "Process CTA", "cta", 1, 12, 6, 2, "process-cta"),
                item("footer", "Contact Footer", "footer", 1, 12, 8, 1, "footer"),
            ],
        ),
    },
    {
        id: "pricing-comparison-deck",
        name: "Pricing Comparison Deck",
        category: "pricing",
        summary: "Pricing page với headline, tier cards, FAQ rail và sticky CTA.",
        accent: "#10b981",
        tags: ["pricing", "comparison", "saas"],
        workspace: createPresetWorkspace(
            "pricing-comparison-deck",
            "Pricing Comparison Deck",
            {
                rows: 8,
                minHeight: 720,
                gap: 18,
            },
            [
                item("hero", "Pricing Hero", "hero", 1, 12, 1, 2, "pricing-hero"),
                item("card-1", "Starter Plan", "card", 1, 4, 3, 3, "starter-plan"),
                item("card-2", "Growth Plan", "card", 5, 4, 3, 3, "growth-plan"),
                item("card-3", "Scale Plan", "card", 9, 4, 3, 3, "scale-plan"),
                item("content", "FAQ Matrix", "content", 1, 8, 6, 2, "faq-matrix"),
                item("cta", "Guarantee CTA", "cta", 9, 4, 6, 2, "guarantee"),
                item("footer", "Pricing Footer", "footer", 1, 12, 8, 1, "footer"),
            ],
        ),
    },
    {
        id: "editorial-blog-front",
        name: "Editorial Blog Front",
        category: "blog",
        summary: "Trang blog front page với hero article, feature rail và recent feed.",
        accent: "#f43f5e",
        tags: ["blog", "editorial", "magazine"],
        workspace: createPresetWorkspace(
            "editorial-blog-front",
            "Editorial Blog Front",
            {
                rows: 8,
                minHeight: 740,
                gap: 18,
            },
            [
                item("header", "Magazine Header", "header", 1, 12, 1, 1, "header"),
                item("hero", "Feature Article", "hero", 1, 7, 2, 3, "feature-article"),
                item("panel-1", "Editor's Pick", "panel", 8, 5, 2, 2, "editors-pick"),
                item("card-1", "Story Card 01", "card", 8, 5, 4, 1, "story-card-01"),
                item("content", "Recent Stories", "content", 1, 8, 5, 2, "recent-stories"),
                item("sidebar", "Trending Rail", "sidebar", 9, 4, 5, 2, "trending"),
                item("cta", "Newsletter Strip", "cta", 1, 12, 7, 1, "newsletter"),
                item("footer", "Magazine Footer", "footer", 1, 12, 8, 1, "footer"),
            ],
        ),
    },
    {
        id: "storytelling-magazine-grid",
        name: "Storytelling Magazine Grid",
        category: "blog",
        summary: "Magazine-style layout cho longform, photo essay và curated quote blocks.",
        accent: "#eab308",
        tags: ["longform", "magazine", "storytelling"],
        workspace: createPresetWorkspace(
            "storytelling-magazine-grid",
            "Storytelling Magazine Grid",
            {
                rows: 9,
                minHeight: 800,
                gap: 16,
            },
            [
                item("hero", "Longform Intro", "hero", 1, 8, 1, 3, "longform-intro"),
                item("panel-1", "Quote Block", "panel", 9, 4, 1, 2, "quote-block"),
                item("card-1", "Photo Essay", "card", 9, 4, 3, 2, "photo-essay"),
                item("content", "Main Narrative", "content", 1, 7, 4, 4, "main-narrative"),
                item("chart-1", "Timeline", "chart", 8, 5, 5, 2, "timeline"),
                item("cta", "Subscribe Banner", "cta", 8, 5, 7, 1, "subscribe"),
                item("footer", "Publication Footer", "footer", 1, 12, 9, 1, "footer"),
            ],
        ),
    },
    {
        id: "product-dashboard-bento",
        name: "Product Dashboard Bento",
        category: "dashboard",
        summary: "Dashboard dạng bento cho roadmap, sprints, activity và release health.",
        accent: "#14b8a6",
        tags: ["product", "roadmap", "bento"],
        workspace: createPresetWorkspace(
            "product-dashboard-bento",
            "Product Dashboard Bento",
            {
                rows: 8,
                minHeight: 760,
                gap: 16,
            },
            [
                item("header", "Product Header", "header", 1, 12, 1, 1, "header"),
                item("hero", "Release Health", "hero", 1, 6, 2, 2, "release-health"),
                item("cta", "Sprint Focus", "cta", 7, 3, 2, 2, "sprint-focus"),
                item("panel-1", "Team Rituals", "panel", 10, 3, 2, 2, "team-rituals"),
                item("chart-1", "Velocity", "chart", 1, 4, 4, 2, "velocity"),
                item("chart-2", "Burndown", "chart", 5, 4, 4, 2, "burndown"),
                item("content", "Roadmap Stream", "content", 9, 4, 4, 3, "roadmap-stream"),
                item("footer", "Product Footer", "footer", 1, 12, 8, 1, "footer"),
            ],
        ),
    },
    {
        id: "knowledge-sidebar-shell",
        name: "Knowledge Sidebar Shell",
        category: "sidebar",
        summary: "Shell hai tầng cho app knowledge với nav trên, rail trái và canvas phải.",
        accent: "#64748b",
        tags: ["sidebar", "knowledge", "app-shell"],
        workspace: createPresetWorkspace(
            "knowledge-sidebar-shell",
            "Knowledge Sidebar Shell",
            {
                rows: 8,
                minHeight: 740,
                gap: 18,
            },
            [
                item("header", "Knowledge Header", "header", 1, 12, 1, 1, "header"),
                item("sidebar", "Collections Rail", "sidebar", 1, 3, 2, 6, "collections"),
                item("nav", "Breadcrumbs", "nav", 4, 9, 2, 1, "breadcrumbs"),
                item("content", "Canvas", "content", 4, 6, 3, 4, "canvas"),
                item("panel-1", "Related Notes", "panel", 10, 3, 3, 2, "related-notes"),
                item("cta", "Quick Actions", "cta", 10, 3, 5, 2, "quick-actions"),
                item("footer", "Knowledge Footer", "footer", 1, 12, 8, 1, "footer"),
            ],
        ),
    },
];
