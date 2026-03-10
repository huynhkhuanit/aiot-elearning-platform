/* ══════════════════════════════════════════════════════════════
   CV Builder – Pre-built Field Suggestions & Writing Tips
   ══════════════════════════════════════════════════════════════ */

import type { CVSectionType } from "@/types/cv";

/* ── Per-section writing tips (right sidebar) ─────────────── */

export interface CVWritingTip {
    title: string;
    content: string;
}

export interface CVSectionGuide {
    heading: string;
    tips: CVWritingTip[];
    example?: {
        title: string;
        content: string;
    };
}

export const CV_SECTION_GUIDES: Record<string, CVSectionGuide> = {
    overview: {
        heading: "Mục tiêu nghề nghiệp",
        tips: [
            {
                title: "Viết ngắn gọn, súc tích",
                content:
                    "Tóm tắt mục tiêu trong 2-3 câu. Nhấn mạnh điểm mạnh cốt lõi và mục tiêu nghề nghiệp cụ thể.",
            },
            {
                title: "Nêu rõ vị trí mong muốn",
                content:
                    "Đề cập rõ ràng vị trí bạn đang ứng tuyển, ví dụ: 'Frontend Developer với 2 năm kinh nghiệm React'.",
            },
            {
                title: "Số liệu hoặc thành tích",
                content:
                    "Thêm con số cụ thể nếu có: '2 năm kinh nghiệm', 'phát triển 5+ ứng dụng', 'tối ưu 40% hiệu suất'.",
            },
        ],
        example: {
            title: "Ví dụ mẫu",
            content:
                "Frontend Developer với 2+ năm kinh nghiệm phát triển ứng dụng web sử dụng React.js và Next.js. Có khả năng tối ưu hiệu suất, làm việc nhóm và mentoring. Mong muốn đóng góp vào team phát triển sản phẩm công nghệ quy mô lớn.",
        },
    },
    experience: {
        heading: "Kinh nghiệm làm việc",
        tips: [
            {
                title: "Sử dụng thứ tự thời gian đảo ngược",
                content:
                    "Bắt đầu với vị trí công việc hiện tại (hoặc gần đây nhất), sau đó liệt kê tất cả các vị trí trước đó đã đảm nhiệm.",
            },
            {
                title: "Sử dụng gạch đầu dòng (hoặc các dấu đầu dòng khác)",
                content:
                    "Điều này giúp bạn liệt kê các ý một cách rõ ràng và rành mạch hơn. Ngoài ra, khi mô tả tránh viết dài và nhiều chữ, bạn nên viết khoảng 6-8 ý.",
            },
            {
                title: "Thêm thành tích",
                content:
                    "Khi mô tả một vị trí công việc đã đảm nhận, bạn nên liệt kế các thành tích đã đạt được thay vì thu hút nhà tuyển dụng. Hơn nữa, bạn nên thêm số liệu cụ thể và không đưa ra thông tin nhạy cảm.",
            },
            {
                title: "Tính phù hợp",
                content:
                    "Liệt kê phù hợp thể hiện ở việc bạn chọn kinh nghiệm phù hợp với vị trí công việc đang ứng tuyển và xóa bỏ mọi thông tin không cần thiết.",
            },
        ],
        example: {
            title: "Ví dụ #1",
            content:
                "**Nhân viên Marketing** — Công ty cổ phần MYCV\n10/2016 – Nay\n• Quản lý chiến dịch digital marketing, tăng 150% lượt truy cập website\n• Xây dựng content strategy cho 3 kênh social media\n• Phân tích dữ liệu Google Analytics để tối ưu conversion rate",
        },
    },
    education: {
        heading: "Học vấn",
        tips: [
            {
                title: "Thông tin cơ bản",
                content:
                    "Ghi rõ tên trường, chuyên ngành, loại bằng cấp và thời gian học.",
            },
            {
                title: "GPA và thành tích",
                content:
                    "Nếu GPA >= 3.0/4.0 hoặc >= 7.0/10, hãy ghi rõ. Liệt kê học bổng, giải thưởng nếu có.",
            },
            {
                title: "Đồ án / Luận văn",
                content:
                    "Nếu đồ án tốt nghiệp liên quan đến vị trí ứng tuyển, hãy mô tả ngắn gọn nội dung và kết quả.",
            },
        ],
        example: {
            title: "Ví dụ",
            content:
                "**Đại học Bách Khoa Hà Nội**\nCử nhân Công nghệ Thông tin | 2019 – 2023\nGPA: 3.2/4.0 | Đồ án TN: Xây dựng nền tảng e-learning với AI",
        },
    },
    skills: {
        heading: "Kỹ năng",
        tips: [
            {
                title: "Phân nhóm kỹ năng",
                content:
                    "Nhóm theo danh mục: Ngôn ngữ lập trình, Framework, Database, DevOps, Kỹ năng mềm.",
            },
            {
                title: "Ưu tiên kỹ năng liên quan",
                content:
                    "Đặt những kỹ năng phù hợp nhất với vị trí ứng tuyển lên trước.",
            },
            {
                title: "Cụ thể mức độ",
                content:
                    "Nếu có thể, ghi rõ mức độ thành thạo: Thành thạo, Quen thuộc, Cơ bản.",
            },
        ],
    },
    projects: {
        heading: "Dự án",
        tips: [
            {
                title: "Cấu trúc mô tả dự án",
                content:
                    "Mỗi dự án nên có: Tên dự án, Tech stack, Vai trò của bạn, Thời gian, và 2-3 bullet points mô tả đóng góp.",
            },
            {
                title: "Nhấn mạnh kết quả",
                content:
                    "Thay vì mô tả công việc, hãy nêu kết quả: 'Đạt 95 điểm Lighthouse', 'Phục vụ 1000+ người dùng'.",
            },
            {
                title: "Link demo (nếu có)",
                content:
                    "Nếu dự án có demo hoặc source code public, hãy cung cấp link.",
            },
        ],
        example: {
            title: "Ví dụ",
            content:
                "**E-Commerce Platform** | Next.js, PostgreSQL, Stripe\nLead Frontend Developer | 03/2023 – 06/2023\n• Thiết kế UI/UX cho 20+ trang sản phẩm\n• Tích hợp Stripe payment, xử lý 500+ đơn hàng/tháng\n• Đạt 95+ điểm Lighthouse Performance",
        },
    },
    certifications: {
        heading: "Chứng chỉ",
        tips: [
            {
                title: "Thông tin cần có",
                content: "Ghi rõ: Tên chứng chỉ, Tổ chức cấp, Năm đạt được.",
            },
            {
                title: "Ưu tiên chứng chỉ liên quan",
                content:
                    "Chỉ liệt kê chứng chỉ liên quan đến vị trí ứng tuyển. Bỏ qua chứng chỉ không liên quan.",
            },
        ],
    },
    languages: {
        heading: "Ngôn ngữ",
        tips: [
            {
                title: "Ghi rõ trình độ",
                content:
                    "Sử dụng thang đo cụ thể: Bản ngữ, Thông thạo, Trung cấp, Cơ bản. Hoặc ghi chứng chỉ: IELTS 6.5, TOEIC 750.",
            },
        ],
    },
    "personal-info": {
        heading: "Thông tin cá nhân",
        tips: [
            {
                title: "Thông tin bắt buộc",
                content:
                    "Họ tên, Số điện thoại, Email, Địa chỉ (thành phố là đủ).",
            },
            {
                title: "Chuyên nghiệp",
                content:
                    "Sử dụng email chuyên nghiệp (tránh nickname). Thêm LinkedIn và GitHub nếu là developer.",
            },
        ],
    },
    custom: {
        heading: "Mục tùy chỉnh",
        tips: [
            {
                title: "Linh hoạt",
                content:
                    "Bạn có thể thêm bất kỳ nội dung nào phù hợp: Hoạt động ngoại khóa, Sở thích, Giải thưởng, Nghiên cứu...",
            },
        ],
    },
};

/* ── Preset suggestion scenarios per role ─────────────────── */

export interface CVPresetSuggestion {
    role: string;
    sectionType: CVSectionType;
    suggestion: string;
}

export const CV_PRESET_SUGGESTIONS: CVPresetSuggestion[] = [
    // Frontend
    {
        role: "Frontend Developer",
        sectionType: "overview",
        suggestion:
            "Frontend Developer với hơn 2 năm kinh nghiệm xây dựng ứng dụng web hiệu suất cao sử dụng React.js, Next.js và TypeScript. Có kinh nghiệm tối ưu Core Web Vitals, triển khai responsive design và tích hợp RESTful API. Đam mê xây dựng giao diện người dùng trực quan, hướng tới trải nghiệm tốt nhất cho người dùng cuối.",
    },
    // Backend
    {
        role: "Backend Developer",
        sectionType: "overview",
        suggestion:
            "Backend Developer với 2+ năm kinh nghiệm thiết kế và phát triển hệ thống API quy mô lớn sử dụng Node.js, Express và PostgreSQL. Thành thạo Docker, CI/CD và cloud services (AWS). Có kinh nghiệm xây dựng microservices, tối ưu database query và đảm bảo security cho hệ thống production.",
    },
    // Fullstack
    {
        role: "Fullstack Developer",
        sectionType: "overview",
        suggestion:
            "Fullstack Developer với khả năng đa nhiệm từ frontend đến backend. Thành thạo React/Next.js ở phía client và Node.js/Express ở phía server. Có kinh nghiệm với PostgreSQL, MongoDB, Docker và cloud deployment. Mong muốn làm việc tại một startup hoặc công ty công nghệ nơi tôi có thể đóng góp toàn diện vào quá trình phát triển sản phẩm.",
    },
    // Intern
    {
        role: "Intern / Fresher",
        sectionType: "overview",
        suggestion:
            "Sinh viên năm cuối ngành Công nghệ Thông tin với đam mê lập trình web. Có kiến thức nền tảng vững về HTML, CSS, JavaScript và frameworks như React.js. Đã hoàn thành 2 dự án cá nhân và 1 đồ án nhóm. Mong muốn được thực tập tại một công ty công nghệ để áp dụng kiến thức đã học và phát triển kỹ năng chuyên môn.",
    },
    // Experience suggestions
    {
        role: "Frontend Developer",
        sectionType: "experience",
        suggestion:
            "• Phát triển và maintain các ứng dụng web sử dụng React.js, Next.js và TypeScript\n• Xây dựng component library reusable, giảm 30% thời gian phát triển tính năng mới\n• Tối ưu bundle size và lazy loading, cải thiện 45% tốc độ tải trang\n• Implement responsive design và cross-browser compatibility cho 5+ dự án\n• Code review và hỗ trợ junior developer trong team",
    },
    {
        role: "Backend Developer",
        sectionType: "experience",
        suggestion:
            "• Thiết kế và phát triển RESTful APIs phục vụ 10,000+ requests/ngày\n• Tối ưu database queries, giảm 60% response time cho các endpoint chính\n• Triển khai hệ thống authentication/authorization với JWT + Redis session\n• Xây dựng CI/CD pipeline với GitHub Actions và Docker\n• Monitoring và troubleshooting production issues với ELK Stack",
    },
];

/* ── Available sections for \"Add Section\" modal ──────────── */

export const AVAILABLE_SECTION_TYPES: Array<{
    type: CVSectionType;
    label: string;
    description: string;
}> = [
    {
        type: "overview",
        label: "Mục tiêu nghề nghiệp",
        description: "Tóm tắt ngắn gọn về bản thân và mục tiêu",
    },
    {
        type: "experience",
        label: "Kinh nghiệm làm việc",
        description: "Lịch sử công việc và thành tích",
    },
    {
        type: "education",
        label: "Học vấn",
        description: "Trình độ học vấn và chứng chỉ",
    },
    {
        type: "skills",
        label: "Kỹ năng",
        description: "Kỹ năng kỹ thuật và mềm",
    },
    {
        type: "projects",
        label: "Dự án",
        description: "Dự án cá nhân và nhóm",
    },
    {
        type: "certifications",
        label: "Chứng chỉ",
        description: "Chứng chỉ chuyên môn",
    },
    {
        type: "languages",
        label: "Ngôn ngữ",
        description: "Trình độ ngoại ngữ",
    },
    {
        type: "references",
        label: "Người tham chiếu",
        description: "Thông tin liên hệ người tham chiếu",
    },
    {
        type: "custom",
        label: "Mục tùy chỉnh",
        description: "Thêm mục bất kỳ theo nhu cầu",
    },
];
