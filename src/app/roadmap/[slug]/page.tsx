"use client";

import {
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    Clock,
    Cloud,
    Database,
    Layout,
    Server,
    Smartphone,
    Target,
    Users,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useState } from "react";

interface RoadmapDetail {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    totalDuration: string;
    totalCourses: number;
    totalStudents: string;
    difficulty: string;
    focusTags: string[];
    outcomes: string[];
    curriculum: {
        phase: string;
        title: string;
        description: string;
        topics: string[];
    }[];
    careerPaths: string[];
    faqs: { question: string; answer: string }[];
}

const roadmapDetails: Record<string, RoadmapDetail> = {
    frontend: {
        id: "frontend",
        title: "Lộ trình Front-end Developer",
        subtitle: "Xây nền tảng vững cho giao diện web hiện đại.",
        description:
            "Roadmap này đi từ nền tảng web, JavaScript, package manager đến framework UI hiện đại và workflow phát triển thực tế.",
        totalDuration: "8-12 tháng",
        totalCourses: 8,
        totalStudents: "45k+",
        difficulty: "Cơ bản đến trung cấp",
        focusTags: ["HTML", "CSS", "JavaScript", "React", "Next.js"],
        outcomes: [
            "Nắm cách web hoạt động, HTTP, DNS và browser rendering.",
            "Viết giao diện responsive với HTML, CSS và hệ thống component.",
            "Làm việc với JavaScript hiện đại, state và API bất đồng bộ.",
            "Tiếp cận React, Next.js và quy trình build/deploy cơ bản.",
        ],
        curriculum: [
            {
                phase: "01",
                title: "Nền tảng web",
                description:
                    "Bắt đầu từ internet, HTTP, browser và cấu trúc HTML semantic.",
                topics: ["Internet", "HTTP", "Browser", "HTML semantics"],
            },
            {
                phase: "02",
                title: "Ngôn ngữ giao diện",
                description:
                    "Làm chủ CSS layout, responsive patterns và JavaScript core.",
                topics: ["CSS layout", "Responsive", "DOM", "ES6+"],
            },
            {
                phase: "03",
                title: "Framework và workflow",
                description:
                    "Bước vào React ecosystem, package manager và tooling cơ bản.",
                topics: ["npm", "Tailwind", "React", "Next.js"],
            },
        ],
        careerPaths: [
            "Front-end Developer",
            "UI Engineer",
            "React Developer",
            "Full-stack Developer",
        ],
        faqs: [
            {
                question: "Không có nền tảng CNTT có bắt đầu được không?",
                answer: "Có. Roadmap này đi từ kiến thức nền rất cơ bản trước khi tiến vào framework.",
            },
            {
                question: "Bao lâu thì có thể đi làm?",
                answer: "Nếu học đều 2-3 giờ mỗi ngày, một chu kỳ 6-8 tháng có thể đủ để đạt mức junior cho phần front-end cơ bản.",
            },
        ],
    },
    backend: {
        id: "backend",
        title: "Lộ trình Back-end Developer",
        subtitle: "Đi sâu vào API, dữ liệu và kiến trúc dịch vụ.",
        description:
            "Roadmap này tập trung vào ngôn ngữ server-side, database, API, xác thực và nền tảng system design.",
        totalDuration: "10-15 tháng",
        totalCourses: 10,
        totalStudents: "32k+",
        difficulty: "Trung cấp",
        focusTags: ["Node.js", "Database", "REST", "Auth", "System Design"],
        outcomes: [
            "Hiểu cách dữ liệu được lưu trữ, truy vấn và tối ưu.",
            "Thiết kế API, xác thực người dùng và bảo vệ đầu vào.",
            "Nắm các khối backend nền tảng như cache, queue và scaling.",
            "Bước đầu tiếp cận vận hành dịch vụ ở môi trường production.",
        ],
        curriculum: [
            {
                phase: "01",
                title: "Ngôn ngữ và runtime",
                description:
                    "Chọn ngôn ngữ chính và làm chủ flow xử lý trên server.",
                topics: ["Node.js", "Java", "Python", "Go"],
            },
            {
                phase: "02",
                title: "Database và API",
                description:
                    "Làm việc với SQL/NoSQL và thiết kế RESTful API.",
                topics: ["SQL", "MongoDB", "REST", "Validation"],
            },
            {
                phase: "03",
                title: "Auth và hệ thống",
                description:
                    "Xây lớp xác thực, phân quyền và nền tảng mở rộng hệ thống.",
                topics: ["JWT", "OAuth", "Caching", "Microservices"],
            },
        ],
        careerPaths: [
            "Back-end Developer",
            "Platform Engineer",
            "API Engineer",
            "System Architect",
        ],
        faqs: [
            {
                question: "Có nên học Node.js đầu tiên không?",
                answer: "Nếu bạn muốn kết nối nhanh với full-stack hoặc đã biết JavaScript thì Node.js là điểm bắt đầu rất hợp lý.",
            },
            {
                question: "Backend cần giỏi thuật toán tới mức nào?",
                answer: "Mức nền tảng là đủ để bắt đầu. Điều quan trọng hơn giai đoạn đầu là hiểu dữ liệu, API và mô hình hệ thống.",
            },
        ],
    },
    fullstack: {
        id: "fullstack",
        title: "Lộ trình Full-stack Developer",
        subtitle: "Ghép giao diện, API và vận hành thành một luồng hoàn chỉnh.",
        description:
            "Roadmap full-stack gom cả front-end lẫn back-end theo thứ tự hợp lý để bạn hiểu sản phẩm từ đầu đến cuối.",
        totalDuration: "12-18 tháng",
        totalCourses: 15,
        totalStudents: "28k+",
        difficulty: "Trung cấp",
        focusTags: ["React", "Node.js", "Database", "Deploy", "System Design"],
        outcomes: [
            "Xây giao diện có state rõ ràng và giao tiếp API ổn định.",
            "Tự dựng backend đủ cho sản phẩm web thực tế.",
            "Hiểu mô hình dữ liệu, auth, deploy và quy trình phát hành.",
            "Có nền tảng để tiếp tục chuyên sâu ở front-end hoặc back-end.",
        ],
        curriculum: [
            {
                phase: "01",
                title: "Front-end foundation",
                description:
                    "Xây lớp giao diện và component model trước khi nối với backend.",
                topics: ["HTML/CSS", "JavaScript", "React", "State"],
            },
            {
                phase: "02",
                title: "Back-end foundation",
                description:
                    "Bổ sung API, database và auth để tạo flow hoàn chỉnh.",
                topics: ["Node.js", "REST", "Database", "JWT"],
            },
            {
                phase: "03",
                title: "Tích hợp và deploy",
                description:
                    "Kết nối toàn bộ stack và đưa ứng dụng lên môi trường chạy thật.",
                topics: ["Integration", "Testing", "Deploy", "Monitoring"],
            },
        ],
        careerPaths: [
            "Full-stack Developer",
            "Product Engineer",
            "Technical Founder",
            "Software Engineer",
        ],
        faqs: [
            {
                question: "Có nên học cả hai phía ngay từ đầu?",
                answer: "Nên ưu tiên một phía làm trục chính rồi mở rộng sang phía còn lại, thay vì học dàn trải cùng lúc.",
            },
            {
                question: "Roadmap này có phù hợp để đi freelance không?",
                answer: "Có. Full-stack là hướng phù hợp nếu bạn muốn tự triển khai các sản phẩm nhỏ đến trung bình.",
            },
        ],
    },
    mobile: {
        id: "mobile",
        title: "Lộ trình Mobile Developer",
        subtitle: "Phát triển ứng dụng di động với tư duy sản phẩm thực tế.",
        description:
            "Roadmap mobile đi từ nền tảng JavaScript/React tới React Native, navigation, networking và release lên store.",
        totalDuration: "8-12 tháng",
        totalCourses: 12,
        totalStudents: "22k+",
        difficulty: "Cơ bản đến trung cấp",
        focusTags: ["React Native", "Navigation", "Networking", "Device APIs"],
        outcomes: [
            "Dựng màn hình, điều hướng và state cho app mobile.",
            "Kết nối backend và xử lý dữ liệu bất đồng bộ trên thiết bị.",
            "Làm việc với camera, lưu trữ cục bộ và notification.",
            "Hiểu quy trình build, test và phát hành ứng dụng.",
        ],
        curriculum: [
            {
                phase: "01",
                title: "Nền tảng React cho mobile",
                description:
                    "Làm chủ component, props, state và layout cho app di động.",
                topics: ["React basics", "Flex layout", "State", "Hooks"],
            },
            {
                phase: "02",
                title: "React Native core",
                description:
                    "Bước vào navigation, data flow và giao tiếp với API.",
                topics: ["React Native", "Navigation", "API", "Async storage"],
            },
            {
                phase: "03",
                title: "Tính năng thiết bị và release",
                description:
                    "Khai thác capabilities của thiết bị và đóng gói sản phẩm.",
                topics: ["Camera", "Location", "Build", "Store release"],
            },
        ],
        careerPaths: [
            "Mobile Developer",
            "React Native Developer",
            "Cross-platform Engineer",
            "App Product Engineer",
        ],
        faqs: [
            {
                question: "Học mobile trên Windows có được không?",
                answer: "Được. Bạn có thể bắt đầu với React Native và emulator, sau đó mới tối ưu workflow theo thiết bị thật.",
            },
            {
                question: "Roadmap này nghiêng về native hay cross-platform?",
                answer: "Nghiêng về cross-platform với React Native để bạn vào sản phẩm thực tế nhanh hơn.",
            },
        ],
    },
    devops: {
        id: "devops",
        title: "Lộ trình DevOps Engineer",
        subtitle: "Kết nối phát triển phần mềm với vận hành hệ thống.",
        description:
            "Roadmap này tập trung vào Linux, container, CI/CD, cloud và giám sát hệ thống để xây nền tảng DevOps thực chiến.",
        totalDuration: "10-15 tháng",
        totalCourses: 14,
        totalStudents: "18k+",
        difficulty: "Trung cấp đến nâng cao",
        focusTags: ["Linux", "Docker", "CI/CD", "Cloud", "Monitoring"],
        outcomes: [
            "Làm chủ command line, Linux và khái niệm hệ thống cốt lõi.",
            "Dùng container và pipeline để tự động hóa vòng đời phát hành.",
            "Tiếp cận cloud, orchestration và giám sát production.",
            "Phối hợp tốt giữa team development và vận hành.",
        ],
        curriculum: [
            {
                phase: "01",
                title: "System basics",
                description:
                    "Bắt đầu từ Linux, shell và các khái niệm mạng căn bản.",
                topics: ["Linux", "Shell", "Networking", "Processes"],
            },
            {
                phase: "02",
                title: "Container và pipeline",
                description:
                    "Dùng Docker và CI/CD để đóng gói, kiểm thử và phát hành.",
                topics: ["Docker", "Registry", "CI/CD", "Secrets"],
            },
            {
                phase: "03",
                title: "Cloud và quan sát hệ thống",
                description:
                    "Làm việc với cloud resource, monitoring và scaling.",
                topics: ["AWS", "Terraform", "Kubernetes", "Monitoring"],
            },
        ],
        careerPaths: [
            "DevOps Engineer",
            "Platform Engineer",
            "SRE",
            "Cloud Engineer",
        ],
        faqs: [
            {
                question: "DevOps có cần biết code không?",
                answer: "Có. Mức độ không nhất thiết sâu như product engineer, nhưng bạn cần đủ để viết script, hiểu pipeline và đọc flow ứng dụng.",
            },
            {
                question: "Nên học cloud trước hay Docker trước?",
                answer: "Docker và Linux trước sẽ giúp bạn tiếp cận cloud và orchestration dễ hơn nhiều.",
            },
        ],
    },
};

const roadmapIcons = {
    frontend: Layout,
    backend: Server,
    fullstack: Database,
    mobile: Smartphone,
    devops: Cloud,
};

export default function RoadmapDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = use(params);
    const roadmap = roadmapDetails[slug];

    if (!roadmap) {
        notFound();
    }

    const Icon = roadmapIcons[slug as keyof typeof roadmapIcons] || Layout;

    return (
        <div className="roadmap-route">
            <section className="roadmap-shell__hero">
                <div className="roadmap-shell roadmap-shell__hero-grid">
                    <div>
                        <Link
                            href="/roadmap"
                            className="roadmap-button roadmap-button--dark"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Quay lại thư viện
                        </Link>

                        <div className="mt-6">
                            <span className="roadmap-shell__eyebrow">
                                <Icon className="h-4 w-4" />
                                Overview
                            </span>
                        </div>

                        <h1 className="roadmap-shell__title">{roadmap.title}</h1>
                        <p className="roadmap-shell__description">
                            {roadmap.subtitle} {roadmap.description}
                        </p>

                        <div className="roadmap-shell__actions">
                            <Link
                                href={`/roadmap/${slug}/flow`}
                                className="roadmap-button roadmap-button--primary"
                            >
                                <Zap className="h-4 w-4" />
                                Mở tree viewer
                            </Link>
                            <Link
                                href="/roadmap/generate"
                                className="roadmap-button roadmap-button--dark"
                            >
                                <Target className="h-4 w-4" />
                                So sánh với AI roadmap
                            </Link>
                        </div>
                    </div>

                    <div className="roadmap-shell__panel">
                        <div>
                            <h2 className="roadmap-shell__panel-title">
                                Snapshot nhanh
                            </h2>
                            <p className="roadmap-shell__panel-copy">
                                Đây là cửa overview trước khi đi vào tree viewer.
                                Từ đây bạn có thể xem khung học, nghề nghiệp phù hợp và nhảy thẳng vào sơ đồ.
                            </p>
                        </div>

                        <div className="roadmap-shell__meta">
                            <span className="roadmap-shell__meta-item">
                                <Clock className="h-4 w-4" />
                                {roadmap.totalDuration}
                            </span>
                            <span className="roadmap-shell__meta-item">
                                <Users className="h-4 w-4" />
                                {roadmap.totalStudents}
                            </span>
                            <span className="roadmap-shell__meta-item">
                                <CheckCircle className="h-4 w-4" />
                                {roadmap.difficulty}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <div className="roadmap-shell roadmap-shell__body">
                <section className="grid gap-4 md:grid-cols-3">
                    <div className="roadmap-stat-card">
                        <div className="roadmap-stat-card__label">Thời lượng</div>
                        <div className="roadmap-stat-card__value">
                            {roadmap.totalDuration}
                        </div>
                    </div>
                    <div className="roadmap-stat-card">
                        <div className="roadmap-stat-card__label">Khóa học</div>
                        <div className="roadmap-stat-card__value">
                            {roadmap.totalCourses}
                        </div>
                    </div>
                    <div className="roadmap-stat-card">
                        <div className="roadmap-stat-card__label">Độ khó</div>
                        <div className="roadmap-stat-card__value">
                            {roadmap.difficulty}
                        </div>
                    </div>
                </section>

                <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-6">
                        <div className="roadmap-surface p-6 md:p-8">
                            <div className="roadmap-section-heading">
                                <div>
                                    <h2 className="roadmap-section-heading__title">
                                        Bạn sẽ học được gì
                                    </h2>
                                    <p className="roadmap-section-heading__body">
                                        Các đầu ra chính để quyết định roadmap này có hợp với mục tiêu của bạn hay không.
                                    </p>
                                </div>
                            </div>

                            <div className="roadmap-simple-list">
                                {roadmap.outcomes.map((item) => (
                                    <div
                                        key={item}
                                        className="roadmap-simple-list__item"
                                    >
                                        <div className="roadmap-simple-list__copy">
                                            {item}
                                        </div>
                                        <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="roadmap-surface p-6 md:p-8">
                            <div className="roadmap-section-heading">
                                <div>
                                    <h2 className="roadmap-section-heading__title">
                                        Khung học theo giai đoạn
                                    </h2>
                                    <p className="roadmap-section-heading__body">
                                        Overview ngắn trước khi bạn chuyển sang tree viewer chi tiết.
                                    </p>
                                </div>
                            </div>

                            <div className="roadmap-grid">
                                {roadmap.curriculum.map((phase) => (
                                    <div key={phase.phase} className="roadmap-card">
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="roadmap-pill roadmap-pill--accent">
                                                Giai đoạn {phase.phase}
                                            </span>
                                            <ArrowRight className="h-4 w-4 text-slate-300" />
                                        </div>
                                        <h3 className="roadmap-card__title">
                                            {phase.title}
                                        </h3>
                                        <p className="roadmap-card__body">
                                            {phase.description}
                                        </p>
                                        <div className="roadmap-card__meta">
                                            {phase.topics.map((topic) => (
                                                <span key={topic} className="roadmap-pill">
                                                    {topic}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="roadmap-surface p-6 md:p-8">
                            <div className="roadmap-section-heading">
                                <div>
                                    <h2 className="roadmap-section-heading__title">
                                        Trọng tâm chính
                                    </h2>
                                    <p className="roadmap-section-heading__body">
                                        Các tag nổi bật để bạn đối chiếu nhanh với mục tiêu cá nhân.
                                    </p>
                                </div>
                            </div>

                            <div className="roadmap-card__meta">
                                {roadmap.focusTags.map((tag) => (
                                    <span key={tag} className="roadmap-pill">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="mt-6 rounded-[24px] bg-slate-950 p-6 text-white">
                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
                                    Sẵn sàng đi sâu hơn?
                                </p>
                                <h3 className="mt-3 !text-[1.36rem] font-bold tracking-[-0.04em] text-white">
                                    Mở tree viewer để đi theo từng node và cập nhật tiến độ trực tiếp.
                                </h3>
                                <div className="mt-5">
                                    <Link
                                        href={`/roadmap/${slug}/flow`}
                                        className="roadmap-button roadmap-button--primary"
                                    >
                                        <Zap className="h-4 w-4" />
                                        Vào viewer
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="roadmap-surface p-6 md:p-8">
                            <div className="roadmap-section-heading">
                                <div>
                                    <h2 className="roadmap-section-heading__title">
                                        Cơ hội nghề nghiệp
                                    </h2>
                                </div>
                            </div>

                            <div className="roadmap-simple-list">
                                {roadmap.careerPaths.map((career) => (
                                    <div
                                        key={career}
                                        className="roadmap-simple-list__item"
                                    >
                                        <div className="font-bold text-roadmap-ink">
                                            {career}
                                        </div>
                                        <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="roadmap-surface p-6 md:p-8">
                            <div className="roadmap-section-heading">
                                <div>
                                    <h2 className="roadmap-section-heading__title">
                                        Câu hỏi thường gặp
                                    </h2>
                                </div>
                            </div>

                            <div className="roadmap-grid">
                                {roadmap.faqs.map((faq) => (
                                    <FAQItem
                                        key={faq.question}
                                        question={faq.question}
                                        answer={faq.answer}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

function FAQItem({
    question,
    answer,
}: {
    question: string;
    answer: string;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="rounded-[20px] border border-slate-200 bg-slate-50">
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
                <span className="font-bold text-slate-900">{question}</span>
                <span className="roadmap-pill">
                    {isOpen ? "Ẩn" : "Mở"}
                </span>
            </button>
            {isOpen ? (
                <div className="border-t border-slate-200 px-5 py-4 text-sm leading-7 text-slate-600">
                    {answer}
                </div>
            ) : null}
        </div>
    );
}
