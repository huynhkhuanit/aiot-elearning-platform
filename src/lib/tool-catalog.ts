export type ToolIconKey =
    | "resume"
    | "short-link"
    | "clip-path"
    | "snippet"
    | "grid"
    | "face-alert";

export type ToolAccent =
    | "sky"
    | "violet"
    | "amber"
    | "emerald"
    | "rose"
    | "cyan";

export type ToolLink = {
    id: string;
    name: string;
    href: string;
};

export type ToolCatalogItem = ToolLink & {
    icon: ToolIconKey;
    category: string;
    focus: string;
    audience: string;
    summary: string;
    description: string;
    highlights: [string, string, string];
    tooltip: string;
    outcome: string;
    accent: ToolAccent;
};

export const toolLinks: ToolLink[] = [
    {
        id: "resume-builder",
        name: "Tạo CV xin việc",
        href: "/tools#resume-builder",
    },
    {
        id: "link-shortener",
        name: "Rút gọn liên kết",
        href: "/tools#link-shortener",
    },
    {
        id: "clip-path-maker",
        name: "Clip-path maker",
        href: "/tools#clip-path-maker",
    },
    {
        id: "snippet-generator",
        name: "Snippet generator",
        href: "/tools#snippet-generator",
    },
    {
        id: "css-grid-generator",
        name: "CSS Grid generator",
        href: "/tools#css-grid-generator",
    },
    {
        id: "face-touch-alert",
        name: "Cảnh báo sờ tay lên mặt",
        href: "/tools#face-touch-alert",
    },
];

export const toolCatalog: ToolCatalogItem[] = [
    {
        ...toolLinks[0],
        icon: "resume",
        category: "Sự nghiệp",
        focus: "ATS-friendly",
        audience: "Sinh viên, fresher",
        summary:
            "Biến kỹ năng, dự án và mục tiêu nghề nghiệp thành CV gọn gàng, đúng vị trí tuyển dụng.",
        description:
            "Phù hợp cho sinh viên và fresher cần một bản CV sạch, dễ đọc, có điểm nhấn về dự án cá nhân, kỹ năng kỹ thuật và năng lực học tập.",
        highlights: [
            "Chọn role mục tiêu như Frontend, Backend, Embedded, AI Engineer hoặc Intern.",
            "Gợi ý bullet theo chuẩn ATS, nhấn mạnh số liệu, kết quả và tác động.",
            "Tách rõ phần dự án cá nhân, chứng chỉ và stack đã dùng trong từng sản phẩm.",
        ],
        tooltip:
            "Hữu ích khi bạn cần chuẩn bị CV nhanh nhưng vẫn đúng ngữ cảnh tuyển dụng và đủ dữ kiện để HR quét ATS.",
        outcome:
            "Rút ngắn thời gian chuẩn bị CV, giữ bố cục rõ ràng và giúp nhà tuyển dụng thấy được năng lực cốt lõi chỉ sau vài giây đầu.",
        accent: "sky",
    },
    {
        ...toolLinks[1],
        icon: "short-link",
        category: "Tiện ích",
        focus: "Chia sẻ nhanh",
        audience: "Người học, nhóm dự án",
        summary:
            "Tạo link ngắn dễ nhớ để chia sẻ roadmap, hồ sơ, demo hoặc tài liệu học tập.",
        description:
            "Dành cho người cần chia sẻ tài nguyên trong lớp học, nhóm đồ án hoặc hồ sơ xin việc mà không dùng các URL dài và khó theo dõi.",
        highlights: [
            "Gắn nhãn liên kết theo môn học, dự án hoặc chiến dịch tuyển dụng.",
            "Ưu tiên thao tác nhanh, thân thiện trên mobile và dễ copy.",
            "Phù hợp để rút gọn link portfolio, Google Drive, tài liệu hoặc demo.",
        ],
        tooltip:
            "Phù hợp khi bạn cần một liên kết ngắn gọn để đưa vào CV, slide thuyết trình hoặc bài viết chia sẻ.",
        outcome:
            "Liên kết nhìn chuyên nghiệp hơn, dễ chia sẻ trên tài liệu và giảm sai sót khi người nhận phải gõ lại URL.",
        accent: "violet",
    },
    {
        ...toolLinks[2],
        icon: "clip-path",
        category: "Frontend",
        focus: "Visual CSS",
        audience: "Frontend, UI designer",
        summary:
            "Tạo nhanh clip-path trực quan cho hero, card nội dung và các khối trang trí giao diện.",
        description:
            "Hỗ trợ frontend và designer thử nhiều hình khối khác nhau mà không phải căn chỉnh CSS polygon thủ công trong lúc thiết kế.",
        highlights: [
            "Xem trước hình cắt ngay trên giao diện trước khi chèn vào page.",
            "Sinh đoạn CSS sẵn để copy trực tiếp vào component hoặc stylesheet.",
            "Phù hợp với hero section, banner, thumbnail và các block trang trí.",
        ],
        tooltip:
            "Hợp với những trang cần phần nền hoặc hero có hình khối phá cách nhưng vẫn kiểm soát được CSS sinh ra.",
        outcome:
            "Rút ngắn vòng lặp giữa ý tưởng và triển khai, đồng thời giữ phần trang trí đồng nhất với layout responsive.",
        accent: "amber",
    },
    {
        ...toolLinks[3],
        icon: "snippet",
        category: "Developer",
        focus: "Boilerplate",
        audience: "Developer, người mới học",
        summary:
            "Sinh snippet code, template cấu trúc và đoạn boilerplate dùng lại cho nhiều bối cảnh học tập.",
        description:
            "Tập trung vào những khung mã lặp lại nhiều lần như fetch API, form validation, cấu trúc component hoặc hook cơ bản.",
        highlights: [
            "Tạo snippet theo ngôn ngữ hoặc framework đang học.",
            "Chuẩn hóa format để có thể copy trực tiếp vào project.",
            "Giúp người mới bắt đầu không mất thời gian dựng khung từ đầu.",
        ],
        tooltip:
            "Thích hợp cho các bài tập, prototype hoặc demo khi bạn cần khởi tạo nhanh phần mã lặp lại.",
        outcome:
            "Tăng tốc lúc bắt đầu bài tập hoặc prototype, đồng thời giảm lỗi ở phần khởi tạo lặp lại.",
        accent: "emerald",
    },
    {
        ...toolLinks[4],
        icon: "grid",
        category: "Frontend",
        focus: "Layout responsive",
        audience: "Frontend, người học CSS",
        summary:
            "Dựng layout grid bằng thao tác trực quan, xem kết quả và lấy mã CSS ngay.",
        description:
            "Phù hợp khi bạn cần thử bố cục dashboard, card list hoặc landing page mà không nhớ chính xác từng thuộc tính của CSS Grid.",
        highlights: [
            "Chỉnh số cột, hàng và khoảng cách bằng giao diện thay vì nhập tay.",
            "Có preview theo desktop và mobile để kiểm tra responsive.",
            "Xuất CSS dễ đọc để đưa vào component hoặc stylesheet hiện có.",
        ],
        tooltip:
            "Hữu ích khi bạn muốn hiểu CSS Grid trực quan hơn và giảm thời gian thử sai với layout phức tạp.",
        outcome:
            "Giúp bạn dựng layout nhanh hơn, nắm rõ quan hệ cột hàng và giảm thời gian tinh chỉnh giao diện.",
        accent: "rose",
    },
    {
        ...toolLinks[5],
        icon: "face-alert",
        category: "AIoT",
        focus: "Computer vision",
        audience: "AIoT, computer vision",
        summary:
            "Ý tưởng công cụ AIoT dùng camera để phát hiện hành vi chạm tay lên mặt và đưa cảnh báo tức thời.",
        description:
            "Phù hợp cho demo computer vision, bài toán theo dõi hành vi trong lớp học, phòng lab hoặc môi trường chăm sóc sức khỏe.",
        highlights: [
            "Nhấn mạnh cách tiếp cận privacy-first và cảnh báo tại chỗ.",
            "Thích hợp cho demo AIoT kết hợp webcam với xử lý nhận diện thời gian thực.",
            "Có thể mở rộng thành bài toán nhận diện hành vi hoặc nhắc nhở an toàn.",
        ],
        tooltip:
            "Đây là nhóm công cụ thiên về AIoT và computer vision, phù hợp làm demo nghiên cứu hoặc bài trình bày đồ án.",
        outcome:
            "Tạo nền tảng tốt để trình bày pipeline nhận diện hành vi và kết nối giữa học máy với ứng dụng thực tế.",
        accent: "cyan",
    },
];
