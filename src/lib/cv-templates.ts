/* ══════════════════════════════════════════════════════════════
   CV Builder – Pre-built Templates
   ══════════════════════════════════════════════════════════════ */

import type {
    CVData,
    CVPersonalInfo,
    CVSection,
    CVSettings,
    CVTemplate,
} from "@/types/cv";

/* ── Utility: generate unique id ──────────────────────────── */
let _counter = 0;
export function cvId(): string {
    return `cv-${Date.now()}-${++_counter}`;
}

/* ── Template Definitions ─────────────────────────────────── */

export const CV_TEMPLATES: CVTemplate[] = [
    {
        id: "classic-professional",
        name: "Classic Professional",
        description:
            "Bố cục truyền thống, phù hợp cho mọi ngành nghề. ATS-friendly.",
        category: "all",
        styleTag: "ATS-friendly",
        accentColor: "#0891b2",
        thumbnail: "/images/cv-templates/classic.png",
        defaultSections: [
            "personal-info",
            "overview",
            "experience",
            "education",
            "skills",
        ],
        defaultFont: "Inter",
    },
    {
        id: "modern-tech",
        name: "Modern Tech",
        description: "Thiết kế hiện đại dành cho developer, kỹ sư phần mềm.",
        category: "it-developer",
        styleTag: "Tech-focused",
        accentColor: "#6366f1",
        thumbnail: "/images/cv-templates/modern-tech.png",
        defaultSections: [
            "personal-info",
            "overview",
            "skills",
            "experience",
            "projects",
            "education",
        ],
        defaultFont: "Inter",
    },
    {
        id: "minimal-clean",
        name: "Minimal Clean",
        description:
            "Tối giản, sạch sẽ. Tập trung vào nội dung, không rườm rà.",
        category: "all",
        styleTag: "Minimal",
        accentColor: "#059669",
        thumbnail: "/images/cv-templates/minimal.png",
        defaultSections: [
            "personal-info",
            "overview",
            "experience",
            "education",
            "skills",
        ],
        defaultFont: "Inter",
    },
    {
        id: "creative-design",
        name: "Creative Design",
        description:
            "Phong cách sáng tạo cho designer, marketer, content creator.",
        category: "design",
        styleTag: "Creative",
        accentColor: "#e11d48",
        thumbnail: "/images/cv-templates/creative.png",
        defaultSections: [
            "personal-info",
            "overview",
            "experience",
            "projects",
            "skills",
            "education",
        ],
        defaultFont: "Inter",
    },
    {
        id: "ats-friendly",
        name: "ATS-Friendly",
        description:
            "Tối ưu cho hệ thống quét ATS. Không hình ảnh, bố cục đơn giản.",
        category: "all",
        styleTag: "ATS-optimized",
        accentColor: "#1e40af",
        thumbnail: "/images/cv-templates/ats.png",
        defaultSections: [
            "personal-info",
            "overview",
            "experience",
            "education",
            "skills",
            "certifications",
        ],
        defaultFont: "Inter",
    },
    {
        id: "fresher-intern",
        name: "Fresher / Intern",
        description:
            "Dành cho sinh viên, thực tập. Nhấn mạnh kỹ năng và dự án.",
        category: "fresher",
        styleTag: "Fresher",
        accentColor: "#7c3aed",
        thumbnail: "/images/cv-templates/fresher.png",
        defaultSections: [
            "personal-info",
            "overview",
            "education",
            "skills",
            "projects",
            "certifications",
        ],
        defaultFont: "Inter",
    },
];

/* ── Default Personal Info (pre-filled sample) ────────────── */

const DEFAULT_PERSONAL_INFO: CVPersonalInfo = {
    fullName: "Nguyen Van A",
    jobTitle: "Fullstack Developer",
    phone: "+84 123 456 7890",
    email: "nguyenvana@gmail.com",
    address: "Ha Noi, Viet Nam",
    birthDate: "01/01/2000",
    avatarUrl: "",
    links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/nguyenvana" },
        { label: "GitHub", url: "https://github.com/nguyenvana" },
    ],
};

/* ── Default Settings ─────────────────────────────────────── */

const DEFAULT_SETTINGS: CVSettings = {
    fontFamily: "Inter",
    accentColor: "#0891b2",
    fontSize: 14,
};

/* ── Sample Sections (pre-filled for demo) ────────────────── */

function createDefaultSections(
    sectionTypes: CVTemplate["defaultSections"],
): CVSection[] {
    const sectionBuilders: Record<string, () => CVSection> = {
        "personal-info": () => ({
            id: cvId(),
            type: "personal-info",
            title: "Thông tin cá nhân",
            items: [],
            order: 0,
            visible: true,
        }),
        overview: () => ({
            id: cvId(),
            type: "overview",
            title: "Mục tiêu nghề nghiệp",
            items: [
                {
                    id: cvId(),
                    label: "Tóm tắt",
                    value: "",
                    richHtml:
                        "<p>Hơn <strong>2 năm kinh nghiệm</strong> trong lập trình web với khả năng giao tiếp tốt và học hỏi nhanh.</p><ul><li>Thế mạnh: Front-end và Back-end web application development</li><li>Thành thạo HTML, CSS, JavaScript</li><li>Hiểu biết sâu về JavaScript, bao gồm DOM manipulation và JavaScript object model</li></ul>",
                },
            ],
            order: 1,
            visible: true,
        }),
        experience: () => ({
            id: cvId(),
            type: "experience",
            title: "Kinh nghiệm làm việc",
            items: [
                {
                    id: cvId(),
                    label: "Vị trí",
                    value: "Frontend Developer",
                    meta: {
                        company: "Công ty ABC Technology",
                        period: "06/2023 – Hiện tại",
                        location: "Hà Nội",
                    },
                    bullets: [
                        "Phát triển và duy trì 5+ ứng dụng web sử dụng React.js và Next.js",
                        "Tối ưu hiệu suất trang web, giảm 40% thời gian tải trang",
                        "Phối hợp với team Backend để tích hợp RESTful API và GraphQL",
                        "Mentor 2 junior developer trong team",
                    ],
                },
                {
                    id: cvId(),
                    label: "Vị trí",
                    value: "Intern Frontend",
                    meta: {
                        company: "Startup XYZ",
                        period: "01/2023 – 05/2023",
                        location: "Hà Nội",
                    },
                    bullets: [
                        "Xây dựng các component UI tái sử dụng với React và TypeScript",
                        "Viết unit test đạt coverage 80% với Jest và React Testing Library",
                    ],
                },
            ],
            order: 2,
            visible: true,
        }),
        education: () => ({
            id: cvId(),
            type: "education",
            title: "Học vấn",
            items: [
                {
                    id: cvId(),
                    label: "Trường",
                    value: "Đại học Bách Khoa Hà Nội",
                    meta: {
                        degree: "Cử nhân Công nghệ Thông tin",
                        period: "2019 – 2023",
                        gpa: "3.2/4.0",
                    },
                    bullets: [
                        "Chuyên ngành: Kỹ thuật Phần mềm",
                        "Đồ án tốt nghiệp: Xây dựng nền tảng học trực tuyến với AI",
                    ],
                },
            ],
            order: 3,
            visible: true,
        }),
        skills: () => ({
            id: cvId(),
            type: "skills",
            title: "Kỹ năng",
            items: [
                {
                    id: cvId(),
                    label: "Ngôn ngữ lập trình",
                    value: "JavaScript, TypeScript, Python, Java",
                },
                {
                    id: cvId(),
                    label: "Framework & Thư viện",
                    value: "React.js, Next.js, Node.js, Express, TailwindCSS",
                },
                {
                    id: cvId(),
                    label: "Database",
                    value: "PostgreSQL, MongoDB, Redis",
                },
                {
                    id: cvId(),
                    label: "DevOps & Tools",
                    value: "Docker, Git, GitHub Actions, Linux, AWS",
                },
                {
                    id: cvId(),
                    label: "Kỹ năng mềm",
                    value: "Làm việc nhóm, Giao tiếp, Tư duy logic, Quản lý thời gian",
                },
            ],
            order: 4,
            visible: true,
        }),
        projects: () => ({
            id: cvId(),
            type: "projects",
            title: "Dự án",
            items: [
                {
                    id: cvId(),
                    label: "Tên dự án",
                    value: "E-Commerce Platform",
                    meta: {
                        techStack: "Next.js, TypeScript, PostgreSQL, Stripe",
                        role: "Lead Frontend Developer",
                        period: "03/2023 – 06/2023",
                    },
                    bullets: [
                        "Thiết kế và phát triển giao diện người dùng cho nền tảng thương mại điện tử",
                        "Tích hợp thanh toán Stripe, quản lý đơn hàng real-time",
                        "Đạt 95+ điểm Lighthouse Performance",
                    ],
                },
                {
                    id: cvId(),
                    label: "Tên dự án",
                    value: "CodeSense AI Learning Platform",
                    meta: {
                        techStack: "Next.js, Supabase, Python, TensorFlow.js",
                        role: "Fullstack Developer",
                        period: "09/2023 – 01/2024",
                    },
                    bullets: [
                        "Xây dựng nền tảng học lập trình nâng cao tích hợp AI",
                        "Phát triển AI Code Playground với Ollama LLM integration",
                        "Deploy trên Vercel với CI/CD pipeline tự động",
                    ],
                },
            ],
            order: 5,
            visible: true,
        }),
        certifications: () => ({
            id: cvId(),
            type: "certifications",
            title: "Chứng chỉ",
            items: [
                {
                    id: cvId(),
                    label: "Chứng chỉ",
                    value: "AWS Certified Cloud Practitioner",
                    meta: { issuer: "Amazon Web Services", date: "2023" },
                },
                {
                    id: cvId(),
                    label: "Chứng chỉ",
                    value: "Meta Frontend Developer Professional Certificate",
                    meta: { issuer: "Coursera / Meta", date: "2023" },
                },
            ],
            order: 6,
            visible: true,
        }),
        languages: () => ({
            id: cvId(),
            type: "languages",
            title: "Ngôn ngữ",
            items: [
                { id: cvId(), label: "Tiếng Việt", value: "Bản ngữ" },
                {
                    id: cvId(),
                    label: "Tiếng Anh",
                    value: "IELTS 6.5 / TOEIC 750",
                },
            ],
            order: 7,
            visible: true,
        }),
        references: () => ({
            id: cvId(),
            type: "references",
            title: "Người tham chiếu",
            items: [
                {
                    id: cvId(),
                    label: "Người tham chiếu",
                    value: "Cung cấp khi được yêu cầu",
                },
            ],
            order: 8,
            visible: true,
        }),
    };

    return sectionTypes
        .filter((t) => t !== "personal-info")
        .map((type, idx) => {
            const builder = sectionBuilders[type];
            if (!builder) {
                return {
                    id: cvId(),
                    type: "custom" as const,
                    title: type,
                    items: [],
                    order: idx + 1,
                    visible: true,
                };
            }
            const section = builder();
            section.order = idx + 1;
            return section;
        });
}

/* ── Build a complete CVData from a template ──────────────── */

export function createCVFromTemplate(template: CVTemplate): CVData {
    return {
        templateId: template.id,
        personalInfo: { ...DEFAULT_PERSONAL_INFO },
        sections: createDefaultSections(template.defaultSections),
        settings: {
            ...DEFAULT_SETTINGS,
            accentColor: template.accentColor,
            fontFamily: template.defaultFont,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

/* ── Find template by id ──────────────────────────────────── */

export function getTemplateById(id: string): CVTemplate | undefined {
    return CV_TEMPLATES.find((t) => t.id === id);
}
