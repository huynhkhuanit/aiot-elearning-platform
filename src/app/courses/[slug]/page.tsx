"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Star,
    Users,
    Clock,
    Award,
    CheckCircle,
    PlayCircle,
    BookOpen,
    Target,
    TrendingUp,
    Shield,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    Zap,
    Code2,
    Layers,
    Database,
    Layout,
    Package,
    Terminal,
    GitBranch,
    Heart,
    AlertCircle,
    Check,
    MonitorPlay,
    FileText,
    Download,
    Play,
    Globe,
    Lightbulb,
    Headphones,
    Rocket,
    GraduationCap,
    MessageCircle,
    ArrowRight,
    HelpCircle,
    Minus,
    Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import PageContainer from "@/components/PageContainer";
import AvatarWithProBadge from "@/components/AvatarWithProBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

interface CourseDetail {
    id: string;
    title: string;
    subtitle: string;
    slug: string;
    description: string;
    shortDescription?: string;
    price: string;
    priceAmount: number;
    rating: number;
    students: number;
    duration: string;
    durationMinutes?: number;
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    isPro: boolean;
    isFree: boolean;
    isEnrolled?: boolean;
    totalLessons: number;
    instructor: {
        id?: string;
        name: string;
        avatar: string;
        bio?: string;
        username?: string;
    };
    category: {
        id: string;
        name: string;
        slug: string;
    };
    learningOutcomes?: string[];
    updatedAt?: string;
    thumbnailUrl?: string;
    thumbnail_url?: string;
    sections?: {
        id: string;
        title: string;
        order: number;
        lessons: {
            id: string;
            title: string;
            duration: string;
            durationMinutes: number;
            isFree: boolean;
            type: string;
            order: number;
        }[];
    }[];
}

const LEVEL_MAP: Record<string, string> = {
    BEGINNER: "Cơ bản",
    INTERMEDIATE: "Trung cấp",
    ADVANCED: "Nâng cao",
};

const LEVEL_TAGLINE: Record<string, string> = {
    BEGINNER: "Phù hợp cho người mới bắt đầu, không cần kiến thức trước",
    INTERMEDIATE: "Dành cho người đã có nền tảng, muốn nâng cao kỹ năng",
    ADVANCED: "Dành cho lập trình viên có kinh nghiệm, muốn chuyên sâu",
};

const calculatePricing = (currentPrice: number) => {
    const originalPrice = Math.round(currentPrice * 1.4);
    const roundedOriginalPrice = Math.round(originalPrice / 100000) * 100000;
    const discountPercent = Math.round(
        ((roundedOriginalPrice - currentPrice) / roundedOriginalPrice) * 100,
    );
    return {
        originalPrice: roundedOriginalPrice,
        currentPrice,
        discountPercent,
    };
};

// Dynamic pain-points based on course category
function getPainPoints(categoryName: string, level: string) {
    const generic = [
        {
            icon: AlertCircle,
            title: "Tự học không có hệ thống",
            desc: "Bạn tự mò mẫm trên mạng nhưng kiến thức rời rạc, không biết bắt đầu từ đâu và kết thúc ở đâu.",
        },
        {
            icon: Clock,
            title: "Mất quá nhiều thời gian",
            desc: "Xem hàng chục video nhưng không thực hành, kiến thức vào rồi lại quên.",
        },
        {
            icon: HelpCircle,
            title: "Không ai hỗ trợ khi gặp lỗi",
            desc: "Gặp bug hoặc vấn đề kỹ thuật mà không biết hỏi ai, mất hàng giờ để debug.",
        },
        {
            icon: Target,
            title: "Thiếu dự án thực tế",
            desc: "Chỉ làm bài tập nhỏ, không có portfolio đủ thuyết phục nhà tuyển dụng.",
        },
    ];

    if (level === "ADVANCED") {
        generic[0] = {
            icon: AlertCircle,
            title: "Kiến thức nâng cao khó tìm",
            desc: "Tài liệu chuyên sâu hiếm, phần lớn là tiếng Anh và thiếu hướng dẫn thực chiến.",
        };
    }

    return generic;
}

// Dynamic selling points based on course attributes
function getSellingPoints(course: CourseDetail) {
    const points = [
        {
            icon: Rocket,
            title: "Lộ trình học bài bản",
            desc: "Nội dung được sắp xếp từ cơ bản đến nâng cao, không bỏ sót kiến thức nào.",
            gradient: "from-indigo-500 to-violet-500",
        },
        {
            icon: Code2,
            title: "Thực hành ngay trong khóa học",
            desc: "Bài tập thực hành đi kèm mỗi bài giảng, áp dụng kiến thức ngay lập tức.",
            gradient: "from-green-500 to-emerald-500",
        },
        {
            icon: Headphones,
            title: "Hỗ trợ tận tình",
            desc: "Đội ngũ giảng viên sẵn sàng giải đáp mọi thắc mắc qua cộng đồng học tập.",
            gradient: "from-orange-500 to-amber-500",
        },
        {
            icon: GraduationCap,
            title: "Chứng chỉ hoàn thành",
            desc: "Nhận chứng chỉ khi hoàn thành khóa học, bổ sung vào CV chuyên nghiệp.",
            gradient: "from-pink-500 to-rose-500",
        },
    ];

    if (course.isFree) {
        points[3] = {
            icon: Zap,
            title: "Hoàn toàn miễn phí",
            desc: "Không có bất kỳ chi phí nào, học bất cứ lúc nào, ở bất cứ đâu.",
            gradient: "from-yellow-500 to-orange-500",
        };
    }

    return points;
}

// Dynamic FAQ based on course type
function getFAQs(course: CourseDetail) {
    const faqs = [
        {
            q: "Khóa học này phù hợp với ai?",
            a:
                course.level === "BEGINNER"
                    ? "Khóa học phù hợp với người mới bắt đầu, chưa có kiến thức lập trình. Bạn chỉ cần có máy tính và kết nối internet."
                    : course.level === "INTERMEDIATE"
                      ? "Khóa học dành cho những bạn đã có nền tảng cơ bản và muốn nâng cao kỹ năng lên mức chuyên nghiệp."
                      : "Khóa học dành cho lập trình viên có kinh nghiệm, muốn đào sâu kiến thức chuyên môn và tối ưu hóa kỹ năng.",
        },
        {
            q: "Tôi có thể học bất cứ lúc nào không?",
            a: "Có! Bạn có thể học bất cứ lúc nào, ở bất cứ đâu. Nội dung khóa học được thiết kế để bạn có thể tự học theo tốc độ của mình.",
        },
        {
            q: "Tôi sẽ được hỗ trợ như thế nào khi gặp khó khăn?",
            a: "Bạn có thể đặt câu hỏi trực tiếp trong hệ thống Q&A của từng bài học. Giảng viên và cộng đồng sẽ hỗ trợ bạn nhanh nhất có thể.",
        },
        {
            q: "Khóa học có cập nhật nội dung không?",
            a: "Có! Nội dung khóa học được cập nhật thường xuyên để đảm bảo bạn luôn học những kiến thức mới nhất, phù hợp với xu hướng công nghệ hiện tại.",
        },
    ];

    if (!course.isFree) {
        faqs.push({
            q: "Tôi có được hoàn tiền không?",
            a: "Có! Chúng tôi cam kết hoàn tiền 100% trong vòng 30 ngày nếu bạn không hài lòng với khóa học.",
        });
    }

    if (course.isFree) {
        faqs.push({
            q: "Tại sao khóa học này miễn phí?",
            a: "Chúng tôi tin rằng kiến thức nền tảng nên được chia sẻ miễn phí. Đây là cam kết của chúng tôi trong việc giúp cộng đồng phát triển.",
        });
    }

    return faqs;
}

// Default learning outcomes generator
function getDefaultOutcomes(course: CourseDetail) {
    const categoryName = course.category?.name || "lập trình";
    const outcomes = [
        `Nắm vững kiến thức nền tảng về ${categoryName}`,
        `Hiểu rõ các khái niệm cơ bản và nâng cao`,
        `Thực hành với các dự án thực tế`,
        `Áp dụng kiến thức vào công việc ngay lập tức`,
        `Xây dựng ứng dụng hoàn chỉnh từ đầu đến cuối`,
        `Hiểu về best practices và coding standards`,
        `Tối ưu hóa hiệu suất và bảo mật`,
        `Debug và xử lý lỗi hiệu quả`,
    ];
    if (course.level === "ADVANCED") {
        outcomes.push(
            "Kiến trúc hệ thống quy mô lớn",
            "Tối ưu hóa performance cao cấp",
        );
    }
    if (course.isPro) {
        outcomes.push(
            "Truy cập nội dung độc quyền PRO",
            "Nhận chứng chỉ hoàn thành",
        );
    }
    return outcomes;
}

export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
    const { isAuthenticated } = useAuth();
    const toast = useToast();

    useEffect(() => {
        if (slug) fetchCourseDetail();
    }, [slug]);

    const fetchCourseDetail = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/courses/${slug}`);
            const data = await response.json();

            if (data.success) {
                setCourse(data.data);
                if (data.data.sections?.length > 0) {
                    setExpandedSection(data.data.sections[0].id);
                }
            } else {
                toast.error("Không thể tải thông tin khóa học");
                router.push("/");
            }
        } catch {
            toast.error("Đã có lỗi xảy ra");
            router.push("/");
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!isAuthenticated) {
            toast.info("Vui lòng đăng nhập để đăng ký khóa học");
            setTimeout(() => router.push("/auth/login"), 500);
            return;
        }
        if (enrolling) return;

        try {
            setEnrolling(true);
            const response = await fetch(`/api/courses/${slug}/enroll`, {
                method: "POST",
                credentials: "include",
            });
            const data = await response.json();

            if (data.success) {
                toast.success(data.message || "Đăng ký khóa học thành công!");
                if (data.data?.upgradedToPro) {
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    setTimeout(() => router.push(`/learn/${slug}`), 1000);
                }
            } else {
                if (data.message?.includes("đã đăng ký")) {
                    toast.info(
                        "Bạn đã đăng ký khóa học này. Đang chuyển hướng...",
                    );
                    setTimeout(() => router.push(`/learn/${slug}`), 800);
                } else {
                    toast.error(data.message || "Không thể đăng ký khóa học");
                }
            }
        } catch {
            toast.error("Đã có lỗi xảy ra khi đăng ký");
        } finally {
            setEnrolling(false);
        }
    };

    // Loading skeleton
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0c10]">
                <header className="sticky top-0 z-50 bg-transparent backdrop-blur-xl border-b border-white/5">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
                        <Link
                            href="/"
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                            <img
                                src="/assets/img/logo.png"
                                alt="DHV LearnX Logo"
                                className="w-[48px] h-[48px] rounded-lg object-contain"
                            />
                            <span className="font-bold text-white text-sm hidden sm:inline uppercase tracking-wide">
                                Học lập trình thông minh với AI &amp; IoT
                            </span>
                        </Link>
                    </div>
                </header>
                <div className="py-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">
                        Đang tải khóa học...
                    </p>
                </div>
            </div>
        );
    }

    if (!course) return null;

    const learningOutcomes =
        course.learningOutcomes || getDefaultOutcomes(course);
    const pricing = calculatePricing(course.priceAmount);
    const sections = course.sections || [];
    const painPoints = getPainPoints(course.category?.name || "", course.level);
    const sellingPoints = getSellingPoints(course);
    const faqs = getFAQs(course);
    const thumbnailUrl = course.thumbnailUrl || course.thumbnail_url;

    const totalChapters = sections.length;
    const totalLessons =
        sections.reduce((sum, s) => sum + s.lessons.length, 0) ||
        course.totalLessons;

    // CTA button component reused across sections
    const CTAButton = ({
        size = "lg",
        className = "",
    }: {
        size?: "lg" | "md";
        className?: string;
    }) => (
        <button
            onClick={handleEnroll}
            disabled={enrolling}
            className={`
                group relative overflow-hidden font-bold rounded-xl transition-all
                disabled:opacity-70 disabled:cursor-not-allowed
                ${size === "lg" ? "py-4 px-8 text-lg" : "py-3.5 px-6 text-base"}
                ${className}
            `}
            style={{
                background: course.isEnrolled
                    ? "linear-gradient(135deg, #10b981, #059669)"
                    : "linear-gradient(135deg, #6366f1, #9333ea)",
            }}
        >
            <span className="relative z-10 flex items-center justify-center gap-2 text-white drop-shadow-sm">
                {enrolling ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang xử lý...
                    </>
                ) : course.isEnrolled ? (
                    <>
                        <Play className="w-5 h-5 fill-white" />
                        Tiếp tục học
                    </>
                ) : course.isFree ? (
                    <>
                        <Zap className="w-5 h-5" />
                        ĐĂNG KÝ HỌC MIỄN PHÍ
                    </>
                ) : (
                    <>
                        <Rocket className="w-5 h-5" />
                        MUA NGAY
                    </>
                )}
            </span>
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
    );

    return (
        <div className="min-h-screen bg-[#0a0c10] text-white">
            {/* ═══════════════════════════════════════════════════════════
                HEADER (F8-style: Logo + Tagline only)
               ═══════════════════════════════════════════════════════════ */}
            <header className="sticky top-0 z-50 bg-transparent backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
                    <Link
                        href="/"
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                        <img
                            src="/assets/img/logo.png"
                            alt="DHV LearnX Logo"
                            className="w-[48px] h-[48px] rounded-lg object-contain"
                        />
                        <span className="font-bold text-white text-sm hidden sm:inline uppercase tracking-wide">
                            Học lập trình thông minh với AI &amp; IoT
                        </span>
                    </Link>
                </div>
            </header>

            {/* ═══════════════════════════════════════════════════════════
                SECTION 1: HERO
               ═══════════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a0c10] via-[#111827] to-[#0a0c10]" />
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-900/10 to-transparent" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />

                <PageContainer className="relative z-10 py-16 lg:py-24">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-8 font-medium">
                        <Link
                            href="/"
                            className="hover:text-white transition-colors"
                        >
                            Trang chủ
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link
                            href="/#courses"
                            className="hover:text-white transition-colors"
                        >
                            Khóa học
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-indigo-400 truncate max-w-[200px]">
                            {course.title}
                        </span>
                    </div>

                    <div className="grid lg:grid-cols-5 gap-12 items-start">
                        {/* Left: Course Info */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Category badge + Level */}
                            <div className="flex items-center gap-3 flex-wrap">
                                {course.category?.name && (
                                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                                        {course.category.name}
                                    </span>
                                )}
                                <span className="bg-white/5 text-gray-300 border border-white/10 px-3 py-1 rounded-full text-xs font-medium">
                                    {LEVEL_MAP[course.level] || "Cơ bản"}
                                </span>
                                {course.isPro && (
                                    <span className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold">
                                        PRO
                                    </span>
                                )}
                            </div>

                            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
                                {course.title}
                            </h1>

                            <p className="text-lg lg:text-xl text-gray-300 leading-relaxed max-w-2xl">
                                {course.shortDescription ||
                                    course.subtitle ||
                                    LEVEL_TAGLINE[course.level]}
                            </p>

                            {/* Key Metrics */}
                            <div className="flex flex-wrap items-center gap-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex text-yellow-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < Math.floor(course.rating) ? "fill-current" : "text-gray-600"}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-yellow-400 font-bold">
                                        {course.rating}
                                    </span>
                                    <span className="text-gray-400 text-sm">
                                        ({course.students.toLocaleString()} đánh
                                        giá)
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-300">
                                    <Users className="w-4 h-4 text-indigo-400" />
                                    <span className="font-semibold">
                                        {course.students.toLocaleString()}
                                    </span>
                                    <span className="text-sm text-gray-400">
                                        học viên
                                    </span>
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-4 max-w-lg">
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-indigo-400">
                                        {totalChapters}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Chương
                                    </div>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-indigo-400">
                                        {totalLessons}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Bài học
                                    </div>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-indigo-400">
                                        {course.duration}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Thời lượng
                                    </div>
                                </div>
                            </div>

                            {/* Instructor mini */}
                            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                                <AvatarWithProBadge
                                    avatarUrl={course.instructor.avatar}
                                    fullName={course.instructor.name}
                                    isPro={course.isPro}
                                    size="sm"
                                />
                                <div>
                                    <span className="text-sm text-gray-400">
                                        Giảng viên
                                    </span>
                                    <p className="text-indigo-400 font-semibold">
                                        {course.instructor.name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right: Sticky Enrollment Card (Desktop) */}
                        <div className="lg:col-span-2 hidden lg:block">
                            <div className="sticky top-24">
                                <EnrollmentCard
                                    course={course}
                                    pricing={pricing}
                                    thumbnailUrl={thumbnailUrl}
                                    onEnroll={handleEnroll}
                                    enrolling={enrolling}
                                    isAuthenticated={isAuthenticated}
                                />
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                SECTION 2: PAIN POINTS
               ═══════════════════════════════════════════════════════════ */}
            <section className="relative py-20 bg-[#111827]">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0c10] via-transparent to-transparent h-20" />
                <PageContainer>
                    <div className="text-center mb-14">
                        <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">
                            Những{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                                khó khăn
                            </span>{" "}
                            khi tự học
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                            Bạn có đang gặp những vấn đề này? Đừng lo, khóa học
                            này sẽ giúp bạn giải quyết tất cả.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {painPoints.map((point, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-red-500/30 transition-all duration-300 group cursor-pointer"
                            >
                                <point.icon className="w-10 h-10 text-red-400 mb-4 group-hover:scale-110 transition-transform" />
                                <h3 className="text-lg font-bold mb-2">
                                    {point.title}
                                </h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    {point.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </PageContainer>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                SECTION 3: LEARNING OUTCOMES
               ═══════════════════════════════════════════════════════════ */}
            <section className="py-20 bg-[#0a0c10]">
                <PageContainer>
                    <div className="text-center mb-14">
                        <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">
                            Sau khi hoàn thành,{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                                bạn sẽ...
                            </span>
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                            Những kiến thức và kỹ năng bạn sẽ đạt được sau khóa
                            học này
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
                        {learningOutcomes.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4 hover:border-indigo-500/30 transition-colors"
                            >
                                <CheckCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-300 text-sm leading-relaxed">
                                    {item}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </PageContainer>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                SECTION 4: CURRICULUM
               ═══════════════════════════════════════════════════════════ */}
            <section className="py-20 bg-[#111827]">
                <PageContainer>
                    <div className="text-center mb-14">
                        <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">
                            Chương trình{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                                học chi tiết
                            </span>
                        </h2>
                        <div className="flex items-center justify-center gap-6 text-gray-400 text-sm mt-4">
                            <span>
                                <strong className="text-white">
                                    {totalChapters}
                                </strong>{" "}
                                chương
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-600" />
                            <span>
                                <strong className="text-white">
                                    {totalLessons}
                                </strong>{" "}
                                bài học
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-600" />
                            <span>
                                <strong className="text-white">
                                    {course.duration}
                                </strong>{" "}
                                thời lượng
                            </span>
                        </div>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-3">
                        {sections.length > 0 ? (
                            sections.map((section, idx) => (
                                <div
                                    key={section.id}
                                    className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                                >
                                    <button
                                        onClick={() =>
                                            setExpandedSection(
                                                expandedSection === section.id
                                                    ? null
                                                    : section.id,
                                            )
                                        }
                                        className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-bold">
                                                {idx + 1}
                                            </span>
                                            <span className="font-bold text-white">
                                                {section.title}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-400">
                                                {section.lessons.length} bài học
                                            </span>
                                            {expandedSection === section.id ? (
                                                <ChevronUp className="w-4 h-4 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                    </button>
                                    <AnimatePresence>
                                        {expandedSection === section.id && (
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: "auto" }}
                                                exit={{ height: 0 }}
                                                className="overflow-hidden border-t border-white/10"
                                            >
                                                <div className="p-4 space-y-2">
                                                    {section.lessons.map(
                                                        (lesson) => (
                                                            <div
                                                                key={lesson.id}
                                                                className="flex items-center justify-between text-sm py-2 px-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                                                            >
                                                                <div className="flex items-center gap-3 text-gray-300 group-hover:text-indigo-400 transition-colors">
                                                                    <PlayCircle className="w-4 h-4 flex-shrink-0" />
                                                                    <span>
                                                                        {
                                                                            lesson.title
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                                    {lesson.isFree && (
                                                                        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                                                                            Học
                                                                            thử
                                                                        </span>
                                                                    )}
                                                                    <span className="text-gray-500 text-xs">
                                                                        {
                                                                            lesson.duration
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                                <p>Nội dung khóa học đang được cập nhật</p>
                            </div>
                        )}
                    </div>
                </PageContainer>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                SECTION 5: UNIQUE SELLING POINTS
               ═══════════════════════════════════════════════════════════ */}
            <section className="py-20 bg-[#0a0c10]">
                <PageContainer>
                    <div className="text-center mb-14">
                        <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">
                            Điểm{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                                khác biệt
                            </span>
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                            Tại sao bạn nên chọn khóa học này thay vì tự học?
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        {sellingPoints.map((point, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-indigo-500/30 transition-all duration-300 group overflow-hidden"
                            >
                                <div
                                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${point.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                                >
                                    <point.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">
                                    {point.title}
                                </h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    {point.desc}
                                </p>
                                {/* Glow effect */}
                                <div
                                    className={`absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br ${point.gradient} opacity-0 group-hover:opacity-5 rounded-full blur-2xl transition-opacity duration-500`}
                                />
                            </motion.div>
                        ))}
                    </div>
                </PageContainer>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                SECTION 6: INSTRUCTOR (F8-style centered cards)
               ═══════════════════════════════════════════════════════════ */}
            <section className="py-20 bg-[#111827]">
                <PageContainer>
                    <div className="text-center mb-6">
                        <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">
                            Người{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                                hướng dẫn
                            </span>
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                            Được hướng dẫn bởi đội ngũ giảng viên giàu kinh
                            nghiệm và đội ngũ mentor tận tâm
                        </p>
                    </div>

                    <div className="max-w-lg mx-auto">
                        {/* Instructor Card - F8 style centered */}
                        <div className="text-center py-8">
                            {/* Circular avatar */}
                            <div className="w-[140px] h-[140px] mx-auto mb-6 rounded-full overflow-hidden border-2 border-indigo-500/30 shadow-xl shadow-indigo-500/10">
                                {course.instructor.avatar ? (
                                    <Image
                                        src={course.instructor.avatar}
                                        alt={course.instructor.name}
                                        width={140}
                                        height={140}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-4xl font-bold">
                                        {course.instructor.name?.charAt(0)}
                                    </div>
                                )}
                            </div>

                            {/* Name */}
                            <h3 className="text-2xl font-bold text-white mb-2">
                                {course.instructor.name}
                            </h3>

                            {/* Role */}
                            <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wider mb-3">
                                Senior Software Engineer & Instructor
                            </p>

                            {/* Experience */}
                            <p className="text-gray-400 text-sm mb-6">
                                10+ năm kinh nghiệm
                            </p>

                            {/* Bio */}
                            <p className="text-gray-300 text-sm leading-relaxed max-w-md mx-auto mb-6">
                                {course.instructor.bio ||
                                    "Kỹ sư phần mềm với hơn 10 năm kinh nghiệm phát triển phần mềm, từng giữ vị trí quan trọng tại các công ty công nghệ. Đã giúp hàng nghìn người mới bắt đầu lập trình viên thông qua nền tảng học tập."}
                            </p>

                            {/* Strengths */}
                            <p className="text-gray-400 text-xs leading-relaxed max-w-sm mx-auto mb-6">
                                Thế mạnh: Backend, API, Database, Microservices,
                                Cloud (AWS). Trực tiếp thiết kế kiến trúc và dẫn
                                dắt team kỹ thuật.
                            </p>

                            {/* Stats row */}
                            <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
                                <div className="flex items-center gap-1.5">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    <span>{course.rating} Xếp hạng</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-indigo-400" />
                                    <span>
                                        {course.students.toLocaleString()} Học
                                        viên
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <PlayCircle className="w-4 h-4 text-indigo-400" />
                                    <span>10+ Khóa học</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                SECTION 7: REVIEWS
               ═══════════════════════════════════════════════════════════ */}
            <section className="py-20 bg-[#0a0c10]">
                <PageContainer>
                    <div className="text-center mb-14">
                        <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">
                            Học viên{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                                nói gì?
                            </span>
                        </h2>
                        <div className="flex items-center justify-center gap-3 mt-4">
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className="w-5 h-5 fill-current"
                                    />
                                ))}
                            </div>
                            <span className="text-yellow-400 font-bold text-lg">
                                {course.rating}
                            </span>
                            <span className="text-gray-400">
                                ({course.students.toLocaleString()} đánh giá)
                            </span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {[
                            {
                                name: "Minh Tuấn",
                                role: "Frontend Developer",
                                text: "Khóa học giúp mình xây dựng kiến thức vững chắc. Giảng viên dạy rất dễ hiểu, bài tập thực tế giúp mình áp dụng ngay vào công việc.",
                            },
                            {
                                name: "Thu Hà",
                                role: "Sinh viên CNTT",
                                text: "Mình đã tự học rất lâu nhưng không có hệ thống. Khóa học này giúp mình sắp xếp lại kiến thức và tự tin hơn rất nhiều.",
                            },
                            {
                                name: "Đức Anh",
                                role: "Junior Developer",
                                text: "Sau khi hoàn thành khóa học, mình đã tự tin apply và nhận được offer tại một công ty phần mềm. Rất đáng!",
                            },
                        ].map((review, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white/5 border border-white/10 rounded-2xl p-6"
                            >
                                <div className="flex text-yellow-400 mb-4">
                                    {[...Array(5)].map((_, j) => (
                                        <Star
                                            key={j}
                                            className="w-4 h-4 fill-current"
                                        />
                                    ))}
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed mb-5 italic">
                                    &ldquo;{review.text}&rdquo;
                                </p>
                                <div className="flex items-center gap-3">
                                    <AvatarWithProBadge
                                        fullName={review.name}
                                        isPro={i % 2 === 0}
                                        size="sm"
                                    />
                                    <div>
                                        <p className="font-semibold text-sm">
                                            {review.name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {review.role}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </PageContainer>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                SECTION 8: FAQ
               ═══════════════════════════════════════════════════════════ */}
            <section className="py-20 bg-[#111827]">
                <PageContainer>
                    <div className="text-center mb-14">
                        <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">
                            Câu hỏi{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                                thường gặp
                            </span>
                        </h2>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-3">
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                            >
                                <button
                                    onClick={() =>
                                        setExpandedFAQ(
                                            expandedFAQ === idx ? null : idx,
                                        )
                                    }
                                    className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors text-left"
                                >
                                    <span className="font-semibold text-white pr-4">
                                        {faq.q}
                                    </span>
                                    {expandedFAQ === idx ? (
                                        <Minus className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                                    ) : (
                                        <Plus className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    )}
                                </button>
                                <AnimatePresence>
                                    {expandedFAQ === idx && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: "auto" }}
                                            exit={{ height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <p className="px-5 pb-5 text-gray-400 text-sm leading-relaxed">
                                                {faq.a}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </PageContainer>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                SECTION 9: FINAL CTA
               ═══════════════════════════════════════════════════════════ */}
            <section className="py-20 bg-[#0a0c10] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/10 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl" />

                <PageContainer className="relative z-10">
                    <div className="text-center max-w-2xl mx-auto">
                        <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">
                            Sẵn sàng bắt đầu?
                        </h2>
                        <p className="text-gray-400 text-lg mb-8">
                            Đừng để cơ hội trôi qua. Bắt đầu hành trình học tập
                            ngay hôm nay và thay đổi tương lai của bạn.
                        </p>

                        {/* Price */}
                        {!course.isFree && (
                            <div className="flex items-center justify-center gap-4 mb-8">
                                <span className="text-4xl font-extrabold text-white">
                                    {new Intl.NumberFormat("vi-VN").format(
                                        course.priceAmount,
                                    )}
                                    ₫
                                </span>
                                <span className="text-gray-500 line-through text-xl">
                                    {new Intl.NumberFormat("vi-VN").format(
                                        pricing.originalPrice,
                                    )}
                                    ₫
                                </span>
                                <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-bold">
                                    -{pricing.discountPercent}%
                                </span>
                            </div>
                        )}

                        <CTAButton
                            size="lg"
                            className="mx-auto w-full max-w-sm"
                        />

                        {!course.isFree && (
                            <p className="text-gray-500 text-sm mt-4">
                                Đảm bảo hoàn tiền 100% trong 30 ngày
                            </p>
                        )}
                    </div>
                </PageContainer>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                MOBILE STICKY CTA (Bottom bar)
               ═══════════════════════════════════════════════════════════ */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111827]/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 safe-area-pb">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        {course.isFree ? (
                            <span className="text-lg font-bold text-emerald-400">
                                Miễn phí
                            </span>
                        ) : (
                            <div>
                                <span className="text-lg font-bold text-white">
                                    {new Intl.NumberFormat("vi-VN").format(
                                        course.priceAmount,
                                    )}
                                    ₫
                                </span>
                                <span className="text-gray-500 line-through text-sm ml-2">
                                    {new Intl.NumberFormat("vi-VN").format(
                                        pricing.originalPrice,
                                    )}
                                    ₫
                                </span>
                            </div>
                        )}
                    </div>
                    <CTAButton size="md" className="flex-shrink-0" />
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// ENROLLMENT CARD (Desktop Sidebar)
// ═══════════════════════════════════════════════════════════
function EnrollmentCard({
    course,
    pricing,
    thumbnailUrl,
    onEnroll,
    enrolling,
    isAuthenticated,
}: {
    course: CourseDetail;
    pricing: {
        originalPrice: number;
        currentPrice: number;
        discountPercent: number;
    };
    thumbnailUrl: string | undefined;
    onEnroll: () => void;
    enrolling: boolean;
    isAuthenticated: boolean;
}) {
    return (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
            {/* Thumbnail */}
            <div className="relative aspect-video bg-gray-900 group cursor-pointer">
                {thumbnailUrl ? (
                    <Image
                        src={thumbnailUrl}
                        alt={course.title}
                        fill
                        className="object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <Code2 className="w-12 h-12 text-gray-600" />
                    </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border border-white/30">
                        <Play className="w-6 h-6 text-white fill-white ml-1" />
                    </div>
                </div>
                <div className="absolute bottom-3 left-0 right-0 text-center text-white text-sm font-medium drop-shadow-md">
                    Xem giới thiệu khóa học
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Price */}
                <div className="flex items-center gap-3">
                    {!course.isFree ? (
                        <>
                            <span className="text-3xl font-extrabold text-white">
                                {new Intl.NumberFormat("vi-VN").format(
                                    course.priceAmount,
                                )}
                                ₫
                            </span>
                            <span className="text-gray-500 line-through text-lg">
                                {new Intl.NumberFormat("vi-VN").format(
                                    pricing.originalPrice,
                                )}
                                ₫
                            </span>
                            <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-sm font-bold">
                                -{pricing.discountPercent}%
                            </span>
                        </>
                    ) : (
                        <span className="text-3xl font-extrabold text-emerald-400">
                            Miễn phí
                        </span>
                    )}
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={onEnroll}
                        disabled={enrolling}
                        className="w-full font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-white"
                        style={{
                            background: course.isEnrolled
                                ? "linear-gradient(135deg, #10b981, #059669)"
                                : "linear-gradient(135deg, #6366f1, #9333ea)",
                        }}
                    >
                        {enrolling ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Đang xử lý...
                            </>
                        ) : course.isEnrolled ? (
                            <>
                                <Play className="w-5 h-5 fill-white" />
                                Tiếp tục học
                            </>
                        ) : course.isFree ? (
                            "ĐĂNG KÝ HỌC MIỄN PHÍ"
                        ) : (
                            "MUA NGAY"
                        )}
                    </button>

                    <button className="w-full border border-white/10 hover:bg-white/5 text-gray-300 font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                        <Heart className="w-4 h-4" />
                        Thêm vào yêu thích
                    </button>
                </div>

                {!course.isFree && (
                    <p className="text-center text-xs text-gray-500">
                        Đảm bảo hoàn tiền trong 30 ngày
                    </p>
                )}

                {/* Course includes */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                    <h4 className="font-bold text-gray-200 text-sm">
                        Khóa học bao gồm:
                    </h4>
                    <ul className="space-y-3 text-sm text-gray-400">
                        <li className="flex items-center gap-3">
                            <MonitorPlay className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                            <span>{course.duration} video bài giảng</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                            <span>{course.totalLessons} bài học</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Download className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                            <span>Tài liệu tải xuống</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Code2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                            <span>Bài tập thực hành</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Globe className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                            <span>Truy cập trọn đời</span>
                        </li>
                        {course.isPro && (
                            <li className="flex items-center gap-3">
                                <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                <span>Chứng chỉ hoàn thành</span>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
