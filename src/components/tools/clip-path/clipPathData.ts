import type { Point } from "./clipPathUtils";

export type PresetCategoryId =
    | "section"
    | "card"
    | "organic"
    | "badge"
    | "custom";

export type ClipPathPreset = {
    id: string;
    name: string;
    category: PresetCategoryId;
    summary: string;
    tags: string[];
    bestFor: string[];
    points: Point[];
};

export const presetCategories: Array<{
    id: PresetCategoryId | "all";
    label: string;
}> = [
    { id: "all", label: "Tat ca" },
    { id: "section", label: "Section" },
    { id: "card", label: "Card" },
    { id: "organic", label: "Organic" },
    { id: "badge", label: "Badge" },
    { id: "custom", label: "Custom" },
];

function polarPolygon(
    totalPoints: number,
    radiusAt: (index: number) => number,
    rotationDegrees = -90,
): Point[] {
    return Array.from({ length: totalPoints }, (_, index) => {
        const angle =
            ((rotationDegrees + (360 / totalPoints) * index) * Math.PI) / 180;
        const radius = radiusAt(index);

        return {
            x: 50 + Math.cos(angle) * radius,
            y: 50 + Math.sin(angle) * radius,
        };
    });
}

const burstPoints = polarPolygon(16, (index) => (index % 2 === 0 ? 48 : 31));
const flowerPoints = polarPolygon(12, (index) => (index % 2 === 0 ? 42 : 28));
const starburstPoints = polarPolygon(
    20,
    (index) => (index % 2 === 0 ? 48 : 24),
    -81,
);

export const clipPathPresets: ClipPathPreset[] = [
    {
        id: "square-base",
        name: "Square Base",
        category: "card",
        summary: "Khoi co ban de tu ve lai va tao custom shape tu dau.",
        tags: ["starter", "manual", "clean"],
        bestFor: ["Tu tao shape", "Khoi media", "Layout co ban"],
        points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
        ],
    },
    {
        id: "diagonal-slice",
        name: "Diagonal Slice",
        category: "section",
        summary: "Cat cheo nhanh cho hero, banner va section cover.",
        tags: ["hero", "banner", "sharp"],
        bestFor: ["Hero landing", "CTA", "Promo section"],
        points: [
            { x: 0, y: 10 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 82 },
        ],
    },
    {
        id: "slant-top",
        name: "Slant Top",
        category: "section",
        summary: "Mep tren nghieng nhe giup khoi noi dung trong va hien dai.",
        tags: ["section", "article", "soft"],
        bestFor: ["Section intro", "Quote block", "Feature area"],
        points: [
            { x: 0, y: 16 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
        ],
    },
    {
        id: "wave-banner",
        name: "Wave Banner",
        category: "section",
        summary: "Song nhe phu hop cac hero than thien, vui mat.",
        tags: ["wave", "friendly", "landing"],
        bestFor: ["Landing section", "Student projects", "Course card"],
        points: [
            { x: 0, y: 18 },
            { x: 16, y: 8 },
            { x: 32, y: 20 },
            { x: 50, y: 8 },
            { x: 68, y: 20 },
            { x: 84, y: 8 },
            { x: 100, y: 18 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
        ],
    },
    {
        id: "arch-stage",
        name: "Arch Stage",
        category: "section",
        summary: "Khoi co mai vong, hop cho gallery, media va preview card.",
        tags: ["arch", "soft", "media"],
        bestFor: ["Media stage", "Case study", "Hero art"],
        points: [
            { x: 0, y: 28 },
            { x: 8, y: 12 },
            { x: 22, y: 2 },
            { x: 50, y: 0 },
            { x: 78, y: 2 },
            { x: 92, y: 12 },
            { x: 100, y: 28 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
        ],
    },
    {
        id: "chevron-flow",
        name: "Chevron Flow",
        category: "section",
        summary: "Mui ten dai phu hop process card hoac next-step CTA.",
        tags: ["arrow", "flow", "cta"],
        bestFor: ["Next step", "Process", "Product tour"],
        points: [
            { x: 0, y: 8 },
            { x: 78, y: 0 },
            { x: 100, y: 50 },
            { x: 78, y: 100 },
            { x: 0, y: 92 },
            { x: 16, y: 50 },
        ],
    },
    {
        id: "arrow-panel",
        name: "Arrow Panel",
        category: "section",
        summary: "Panel huong dong ro rang, hop cho block huong dan.",
        tags: ["panel", "direction", "ui"],
        bestFor: ["How it works", "Highlight", "Onboarding step"],
        points: [
            { x: 0, y: 22 },
            { x: 70, y: 22 },
            { x: 70, y: 0 },
            { x: 100, y: 50 },
            { x: 70, y: 100 },
            { x: 70, y: 78 },
            { x: 0, y: 78 },
            { x: 14, y: 50 },
        ],
    },
    {
        id: "hexagon-soft",
        name: "Hexagon Soft",
        category: "card",
        summary: "Luc giac can bang cho card tinh nang, tile va thumb.",
        tags: ["hexagon", "feature", "balanced"],
        bestFor: ["Feature card", "Dashboard tile", "Thumbnail"],
        points: [
            { x: 18, y: 0 },
            { x: 82, y: 0 },
            { x: 100, y: 50 },
            { x: 82, y: 100 },
            { x: 18, y: 100 },
            { x: 0, y: 50 },
        ],
    },
    {
        id: "diamond-tile",
        name: "Diamond Tile",
        category: "card",
        summary: "Kim cuong gon dep cho gallery, logo panel va grid art.",
        tags: ["diamond", "grid", "gallery"],
        bestFor: ["Gallery tile", "Logo wall", "Achievement card"],
        points: [
            { x: 50, y: 0 },
            { x: 100, y: 50 },
            { x: 50, y: 100 },
            { x: 0, y: 50 },
        ],
    },
    {
        id: "notch-card",
        name: "Notch Card",
        category: "card",
        summary: "Card co khoet giua canh tao cam giac cong cu chuyen dung.",
        tags: ["notch", "card", "editor"],
        bestFor: ["Tool card", "Settings panel", "Badge panel"],
        points: [
            { x: 10, y: 0 },
            { x: 90, y: 0 },
            { x: 100, y: 10 },
            { x: 100, y: 38 },
            { x: 90, y: 50 },
            { x: 100, y: 62 },
            { x: 100, y: 90 },
            { x: 90, y: 100 },
            { x: 10, y: 100 },
            { x: 0, y: 90 },
            { x: 0, y: 62 },
            { x: 10, y: 50 },
            { x: 0, y: 38 },
            { x: 0, y: 10 },
        ],
    },
    {
        id: "bookmark-card",
        name: "Bookmark Card",
        category: "card",
        summary: "Khoi tuong tu the bookmark cho thumb, note va save card.",
        tags: ["bookmark", "save", "card"],
        bestFor: ["Saved items", "Article thumb", "Course card"],
        points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 50, y: 82 },
            { x: 0, y: 100 },
        ],
    },
    {
        id: "blob-soft",
        name: "Blob Soft",
        category: "organic",
        summary: "Dang huu co mem, hop cho creative section va image crop.",
        tags: ["blob", "organic", "creative"],
        bestFor: ["Creator profile", "Course art", "Illustration block"],
        points: [
            { x: 18, y: 8 },
            { x: 60, y: 0 },
            { x: 88, y: 18 },
            { x: 100, y: 48 },
            { x: 90, y: 82 },
            { x: 62, y: 100 },
            { x: 24, y: 92 },
            { x: 0, y: 58 },
            { x: 6, y: 24 },
        ],
    },
    {
        id: "flower-cut",
        name: "Flower Cut",
        category: "organic",
        summary: "Shape can doi nhieu canh cho avatar, badge va sticker.",
        tags: ["flower", "petal", "sticker"],
        bestFor: ["Avatar crop", "Sticker", "Creator badge"],
        points: flowerPoints,
    },
    {
        id: "zigzag-strip",
        name: "Zigzag Strip",
        category: "organic",
        summary: "Mep zigzag tren phu hop divider, section break va card vui.",
        tags: ["zigzag", "divider", "playful"],
        bestFor: ["Divider", "Fun card", "Promo strip"],
        points: [
            { x: 0, y: 14 },
            { x: 10, y: 0 },
            { x: 22, y: 14 },
            { x: 34, y: 0 },
            { x: 46, y: 14 },
            { x: 58, y: 0 },
            { x: 70, y: 14 },
            { x: 82, y: 0 },
            { x: 94, y: 14 },
            { x: 100, y: 6 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
        ],
    },
    {
        id: "speech-bubble",
        name: "Speech Bubble",
        category: "badge",
        summary: "Bong bong chat hop cho note, tip va CTA hoi dap.",
        tags: ["bubble", "chat", "tooltip"],
        bestFor: ["Help bubble", "Testimonial", "Announcement"],
        points: [
            { x: 10, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 76 },
            { x: 52, y: 76 },
            { x: 36, y: 100 },
            { x: 34, y: 76 },
            { x: 0, y: 76 },
            { x: 0, y: 0 },
        ],
    },
    {
        id: "ticket-stub",
        name: "Ticket Stub",
        category: "badge",
        summary: "Kieu ve su kien cho coupon, event card va promo code.",
        tags: ["ticket", "coupon", "promo"],
        bestFor: ["Coupon", "Event pass", "Pricing teaser"],
        points: [
            { x: 4, y: 0 },
            { x: 96, y: 0 },
            { x: 100, y: 8 },
            { x: 100, y: 34 },
            { x: 92, y: 50 },
            { x: 100, y: 66 },
            { x: 100, y: 92 },
            { x: 96, y: 100 },
            { x: 4, y: 100 },
            { x: 0, y: 92 },
            { x: 0, y: 66 },
            { x: 8, y: 50 },
            { x: 0, y: 34 },
            { x: 0, y: 8 },
        ],
    },
    {
        id: "ribbon-tail",
        name: "Ribbon Tail",
        category: "badge",
        summary: "Nhan ribbon co duoi, hop cho highlight va title badge.",
        tags: ["ribbon", "label", "highlight"],
        bestFor: ["Section label", "Project badge", "News card"],
        points: [
            { x: 6, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 82 },
            { x: 78, y: 82 },
            { x: 68, y: 100 },
            { x: 58, y: 82 },
            { x: 6, y: 82 },
            { x: 0, y: 20 },
        ],
    },
    {
        id: "price-tag",
        name: "Price Tag",
        category: "badge",
        summary: "Dang tag gia gon gon cho shop, nha khoa hay banner uu dai.",
        tags: ["tag", "price", "retail"],
        bestFor: ["Price badge", "Offer card", "Category tag"],
        points: [
            { x: 10, y: 0 },
            { x: 78, y: 0 },
            { x: 100, y: 24 },
            { x: 74, y: 52 },
            { x: 48, y: 100 },
            { x: 0, y: 100 },
            { x: 0, y: 20 },
        ],
    },
    {
        id: "shield-badge",
        name: "Shield Badge",
        category: "badge",
        summary: "Dang huy hieu can doi phu hop cert, rank va loyalty card.",
        tags: ["shield", "badge", "cert"],
        bestFor: ["Certificate", "Level badge", "Member card"],
        points: [
            { x: 14, y: 0 },
            { x: 86, y: 0 },
            { x: 100, y: 18 },
            { x: 92, y: 70 },
            { x: 50, y: 100 },
            { x: 8, y: 70 },
            { x: 0, y: 18 },
        ],
    },
    {
        id: "burst-badge",
        name: "Burst Badge",
        category: "badge",
        summary: "Burst mem nhieu canh de lam sticker sale hoac callout.",
        tags: ["burst", "sticker", "sale"],
        bestFor: ["Promo callout", "Sale badge", "Achievement"],
        points: burstPoints,
    },
    {
        id: "starburst",
        name: "Starburst",
        category: "badge",
        summary: "Ngon hon burst thuong, hop cho sticker va shape can nhan manh.",
        tags: ["star", "burst", "bold"],
        bestFor: ["Hero sticker", "Offer burst", "Badge art"],
        points: starburstPoints,
    },
];
