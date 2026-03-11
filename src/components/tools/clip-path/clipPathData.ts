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
    { id: "all", label: "Tất cả" },
    { id: "section", label: "Phân vùng" },
    { id: "card", label: "Thẻ nội dung" },
    { id: "organic", label: "Hữu cơ" },
    { id: "badge", label: "Huy hiệu" },
    { id: "custom", label: "Tùy chỉnh" },
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
        name: "Khối vuông cơ bản",
        category: "card",
        summary: "Khối cơ bản để tự vẽ lại và tạo hình dạng tùy chỉnh từ đầu.",
        tags: ["khởi đầu", "thủ công", "gọn gàng"],
        bestFor: ["Tự tạo hình", "Khối media", "Bố cục cơ bản"],
        points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
        ],
    },
    {
        id: "diagonal-slice",
        name: "Cắt chéo",
        category: "section",
        summary: "Cắt chéo nhanh cho hero, banner và phần bìa.",
        tags: ["trang chủ", "biểu ngữ", "sắc nét"],
        bestFor: ["Hero trang đích", "Nút kêu gọi", "Phần quảng bá"],
        points: [
            { x: 0, y: 10 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 82 },
        ],
    },
    {
        id: "slant-top",
        name: "Nghiêng đỉnh",
        category: "section",
        summary: "Mép trên nghiêng nhẹ giúp khối nội dung trông và hiện đại.",
        tags: ["phân vùng", "bài viết", "mềm mại"],
        bestFor: ["Phần giới thiệu", "Khối trích dẫn", "Vùng tính năng"],
        points: [
            { x: 0, y: 16 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
        ],
    },
    {
        id: "wave-banner",
        name: "Biểu ngữ sóng",
        category: "section",
        summary: "Sóng nhẹ phù hợp các hero thân thiện, vui mắt.",
        tags: ["sóng", "thân thiện", "trang đích"],
        bestFor: ["Phần trang đích", "Dự án sinh viên", "Thẻ khóa học"],
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
        name: "Mái vòng",
        category: "section",
        summary: "Khối có mái vòng, hợp cho bộ sưu tập, media và thẻ xem trước.",
        tags: ["vòm", "mềm mại", "media"],
        bestFor: ["Sân khấu media", "Nghiên cứu tình huống", "Ảnh hero"],
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
        name: "Mũi tên chuyển tiếp",
        category: "section",
        summary: "Mũi tên dài phù hợp thẻ quy trình hoặc nút bước tiếp theo.",
        tags: ["mũi tên", "luồng", "kêu gọi"],
        bestFor: ["Bước tiếp theo", "Quy trình", "Giới thiệu sản phẩm"],
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
        name: "Bảng mũi tên",
        category: "section",
        summary: "Bảng hướng dòng rõ ràng, hợp cho khối hướng dẫn.",
        tags: ["bảng", "hướng", "giao diện"],
        bestFor: ["Cách hoạt động", "Nổi bật", "Bước giới thiệu"],
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
        name: "Lục giác mềm",
        category: "card",
        summary: "Lục giác cân bằng cho thẻ tính năng, ô bảng và ảnh thu nhỏ.",
        tags: ["lục giác", "tính năng", "cân đối"],
        bestFor: ["Thẻ tính năng", "Ô bảng điều khiển", "Ảnh thu nhỏ"],
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
        name: "Ô kim cương",
        category: "card",
        summary: "Kim cương gọn đẹp cho bộ sưu tập, bảng logo và lưới nghệ thuật.",
        tags: ["kim cương", "lưới", "bộ sưu tập"],
        bestFor: ["Ô bộ sưu tập", "Tường logo", "Thẻ thành tích"],
        points: [
            { x: 50, y: 0 },
            { x: 100, y: 50 },
            { x: 50, y: 100 },
            { x: 0, y: 50 },
        ],
    },
    {
        id: "notch-card",
        name: "Thẻ khoét cạnh",
        category: "card",
        summary: "Thẻ có khoét giữa cạnh tạo cảm giác công cụ chuyên dụng.",
        tags: ["khoét", "thẻ", "trình chỉnh sửa"],
        bestFor: ["Thẻ công cụ", "Bảng cài đặt", "Bảng huy hiệu"],
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
        name: "Thẻ đánh dấu",
        category: "card",
        summary: "Khối tương tự thẻ đánh dấu cho ảnh thu nhỏ, ghi chú và thẻ lưu.",
        tags: ["đánh dấu", "lưu", "thẻ"],
        bestFor: ["Mục đã lưu", "Ảnh bài viết", "Thẻ khóa học"],
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
        name: "Đốm mềm",
        category: "organic",
        summary: "Dạng hữu cơ mềm, hợp cho phần sáng tạo và cắt ảnh.",
        tags: ["đốm", "hữu cơ", "sáng tạo"],
        bestFor: ["Hồ sơ người tạo", "Ảnh khóa học", "Khối minh họa"],
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
        name: "Cắt hoa",
        category: "organic",
        summary: "Hình cân đối nhiều cánh cho ảnh đại diện, huy hiệu và nhãn dán.",
        tags: ["hoa", "cánh hoa", "nhãn dán"],
        bestFor: ["Cắt ảnh đại diện", "Nhãn dán", "Huy hiệu người tạo"],
        points: flowerPoints,
    },
    {
        id: "zigzag-strip",
        name: "Dải zích zắc",
        category: "organic",
        summary: "Mép zích zắc trên phù hợp đường phân cách, ngắt phần và thẻ vui.",
        tags: ["zích zắc", "đường phân cách", "vui nhộn"],
        bestFor: ["Đường phân cách", "Thẻ vui nhộn", "Dải quảng bá"],
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
        name: "Bong bóng hội thoại",
        category: "badge",
        summary: "Bong bóng chat hợp cho ghi chú, mẹo và nút hỏi đáp.",
        tags: ["bong bóng", "trò chuyện", "chú thích"],
        bestFor: ["Bong bóng trợ giúp", "Nhận xét", "Thông báo"],
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
        name: "Cuống vé",
        category: "badge",
        summary: "Kiểu vé sự kiện cho phiếu giảm giá, thẻ sự kiện và mã khuyến mãi.",
        tags: ["vé", "phiếu giảm giá", "khuyến mãi"],
        bestFor: ["Phiếu giảm giá", "Thẻ sự kiện", "Giá hấp dẫn"],
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
        name: "Dải ruy băng có đuôi",
        category: "badge",
        summary: "Nhãn ruy băng có đuôi, hợp cho phần nổi bật và huy hiệu tiêu đề.",
        tags: ["ruy băng", "nhãn", "nổi bật"],
        bestFor: ["Nhãn phân vùng", "Huy hiệu dự án", "Thẻ tin tức"],
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
        name: "Thẻ giá",
        category: "badge",
        summary: "Dạng thẻ giá gọn gàng cho cửa hàng, nha khoa hay biểu ngữ ưu đãi.",
        tags: ["thẻ", "giá", "bán lẻ"],
        bestFor: ["Huy hiệu giá", "Thẻ ưu đãi", "Thẻ danh mục"],
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
        name: "Huy hiệu khiên",
        category: "badge",
        summary: "Dạng huy hiệu cân đối phù hợp chứng chỉ, xếp hạng và thẻ thành viên.",
        tags: ["khiên", "huy hiệu", "chứng chỉ"],
        bestFor: ["Chứng chỉ", "Huy hiệu cấp bậc", "Thẻ thành viên"],
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
        name: "Huy hiệu bùng nổ",
        category: "badge",
        summary: "Hình bùng nổ mềm nhiều cánh để làm nhãn dán giảm giá hoặc chú thích.",
        tags: ["bùng nổ", "nhãn dán", "giảm giá"],
        bestFor: ["Chú thích quảng bá", "Nhãn giảm giá", "Thành tích"],
        points: burstPoints,
    },
    {
        id: "starburst",
        name: "Ngôi sao bùng nổ",
        category: "badge",
        summary: "Ngọn hơn kiểu bùng nổ thường, hợp cho nhãn dán và hình cần nhấn mạnh.",
        tags: ["ngôi sao", "bùng nổ", "đậm nét"],
        bestFor: ["Nhãn dán hero", "Bùng nổ ưu đãi", "Nghệ thuật huy hiệu"],
        points: starburstPoints,
    },
];
