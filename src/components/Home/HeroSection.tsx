"use client";

import {
    ChevronLeft,
    ChevronRight,
    Star,
    Users,
    BookOpen,
    ArrowRight,
    Sparkles,
    GraduationCap,
    Zap,
} from "lucide-react";
import PageContainer from "@/components/PageContainer";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";

interface Course {
    id: string;
    title: string;
    subtitle: string;
    slug: string;
    price: string;
    priceAmount: number;
    rating: number;
    students: number;
    duration: string;
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    isPro: boolean;
    isFree: boolean;
    thumbnailUrl?: string | null;
    instructor?: {
        name?: string;
        username?: string;
        avatar?: string | null;
    };
    featured?: boolean;
}

const LEVEL_MAP: Record<string, "Cơ bản" | "Trung cấp" | "Nâng cao"> = {
    BEGINNER: "Cơ bản",
    INTERMEDIATE: "Trung cấp",
    ADVANCED: "Nâng cao",
};

// Gradient palette for slides — cycles through these for each course
const SLIDE_GRADIENTS = [
    { from: "#4F46E5", to: "#3B82F6", label: "indigo-blue" },
    { from: "#0D9488", to: "#059669", label: "teal-emerald" },
    { from: "#EA580C", to: "#D97706", label: "orange-amber" },
    { from: "#E11D48", to: "#DB2777", label: "rose-pink" },
    { from: "#0891B2", to: "#2563EB", label: "cyan-blue" },
];

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

interface PlatformStats {
    totalStudents: number;
    totalInstructors: number;
    totalCourses: number;
    avgRating: number;
}

const formatStatNumber = (num: number): string => {
    if (num >= 1000000)
        return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M+`;
    if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}k+`;
    return num.toString();
};

export default function HeroSection() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [slideKey, setSlideKey] = useState(0);
    const [enrollingCourse, setEnrollingCourse] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [platformStats, setPlatformStats] = useState<PlatformStats | null>(
        null,
    );
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const router = useRouter();
    const toast = useToast();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        fetchCourses();
    }, []);

    // Auto-advance carousel every 5 seconds
    useEffect(() => {
        if (courses.length <= 1 || isPaused) return;

        timerRef.current = setInterval(() => {
            paginate(1);
        }, 5000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [courses.length, isPaused, currentIndex]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                "/api/courses?limit=5&include_stats=1",
            );
            const data = await response.json();

            if (data.success) {
                const fetchedCourses = data.data.courses.map(
                    (course: any, index: number) => ({
                        ...course,
                        featured: index === 0,
                    }),
                );
                setCourses(fetchedCourses);

                if (data.data.platformStats) {
                    setPlatformStats(data.data.platformStats);
                }
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (course: Course) => {
        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để đăng ký khóa học");
            return;
        }
        if (enrollingCourse) return;

        try {
            setEnrollingCourse(course.id);
            const response = await fetch(`/api/courses/${course.slug}/enroll`, {
                method: "POST",
                credentials: "include",
            });
            const data = await response.json();

            if (data.success) {
                toast.success(data.message || "Đăng ký khóa học thành công!");
                if (data.data?.upgradedToPro) {
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    setTimeout(() => router.push(`/learn/${course.slug}`), 800);
                }
            } else {
                if (data.message?.includes("đã đăng ký")) {
                    toast.info(
                        "Bạn đã đăng ký khóa học này. Đang chuyển hướng...",
                    );
                    setTimeout(() => router.push(`/learn/${course.slug}`), 800);
                } else {
                    toast.error(data.message || "Không thể đăng ký khóa học");
                }
            }
        } catch (error) {
            console.error("Error during enrollment:", error);
            toast.error("Đã có lỗi xảy ra khi đăng ký. Vui lòng thử lại");
        } finally {
            setEnrollingCourse(null);
        }
    };

    const handleProCourseClick = async (course: Course) => {
        // If not authenticated, navigate to course landing page directly
        if (!isAuthenticated) {
            router.push(`/courses/${course.slug}`);
            return;
        }
        if (enrollingCourse) return;

        try {
            setEnrollingCourse(course.id);
            const response = await fetch(`/api/courses/${course.slug}`, {
                credentials: "include",
            });
            const data = await response.json();

            if (data.success && data.data.isEnrolled) {
                router.push(`/learn/${course.slug}`);
            } else {
                router.push(`/courses/${course.slug}`);
            }
        } catch (error) {
            console.error("Error checking enrollment:", error);
            router.push(`/courses/${course.slug}`);
        } finally {
            setEnrollingCourse(null);
        }
    };

    const handleSlideAction = useCallback(
        (course: Course) => {
            if (isDragging) return;

            if (!isAuthenticated) {
                toast.error("Vui lòng đăng nhập để tiếp tục");
                return;
            }

            if (course.isFree) {
                (async () => {
                    try {
                        const response = await fetch(
                            `/api/courses/${course.slug}`,
                            { credentials: "include" },
                        );
                        const data = await response.json();
                        if (data.success && data.data.isEnrolled) {
                            router.push(`/learn/${course.slug}`);
                        } else {
                            handleEnroll(course);
                        }
                    } catch {
                        toast.error("Có lỗi xảy ra. Vui lòng thử lại");
                    }
                })();
            } else {
                handleProCourseClick(course);
            }
        },
        [isDragging, isAuthenticated],
    );

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 800 : -800,
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 800 : -800,
            opacity: 0,
        }),
    };

    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset: number, velocity: number) =>
        Math.abs(offset) * velocity;

    const paginate = useCallback(
        (newDirection: number) => {
            if (courses.length === 0) return;
            setDirection(newDirection);
            setCurrentIndex((prev) => {
                const isWrapping =
                    (newDirection === 1 && prev === courses.length - 1) ||
                    (newDirection === -1 && prev === 0);
                if (isWrapping) setSlideKey((k) => k + 1);
                return newDirection === 1
                    ? prev === courses.length - 1
                        ? 0
                        : prev + 1
                    : prev === 0
                      ? courses.length - 1
                      : prev - 1;
            });
        },
        [courses.length],
    );

    const getGradient = (index: number) =>
        SLIDE_GRADIENTS[index % SLIDE_GRADIENTS.length];
    const currentCourse = courses[currentIndex];

    // --- Skeleton ---
    const SkeletonBanner = () => (
        <div
            className="w-full rounded-2xl overflow-hidden animate-pulse"
            style={{ height: 300 }}
        >
            <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center px-10 gap-8">
                <div className="flex-[3] space-y-4">
                    <div className="h-5 w-20 bg-gray-300 rounded-full" />
                    <div className="h-8 w-3/4 bg-gray-300 rounded-lg" />
                    <div className="h-4 w-full bg-gray-300 rounded" />
                    <div className="h-4 w-2/3 bg-gray-300 rounded" />
                    <div className="h-10 w-40 bg-gray-300 rounded-full mt-4" />
                </div>
                <div className="flex-[2] flex items-center justify-center">
                    <div className="w-52 h-36 bg-gray-300 rounded-xl" />
                </div>
            </div>
        </div>
    );

    return (
        <section className="relative w-full bg-white overflow-x-clip">
            {/* Subtle background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white" />

            {/* Carousel section — full width, arrows outside */}
            <div className="relative pt-8 sm:pt-10">
                {/* Carousel banner — full width, no container constraints */}
                <div className="px-6">
                    <div
                        className="relative w-full"
                        style={{ height: 300 }}
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                    >
                        <div className="relative w-full h-full rounded-2xl overflow-hidden cursor-pointer select-none">
                            {loading ? (
                                <SkeletonBanner />
                            ) : courses.length === 0 ? (
                                <div className="flex items-center justify-center h-full bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                    <p className="text-gray-500">
                                        Chưa có khóa học nào
                                    </p>
                                </div>
                            ) : (
                                <AnimatePresence
                                    initial={false}
                                    custom={direction}
                                    mode="popLayout"
                                >
                                    <motion.div
                                        key={`${currentIndex}-${slideKey}`}
                                        custom={direction}
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{
                                            x: {
                                                type: "spring",
                                                stiffness: 300,
                                                damping: 30,
                                            },
                                            opacity: { duration: 0.25 },
                                        }}
                                        drag="x"
                                        dragConstraints={{ left: 0, right: 0 }}
                                        dragElastic={1}
                                        onDragStart={() => setIsDragging(true)}
                                        onDragEnd={(
                                            _,
                                            { offset, velocity },
                                        ) => {
                                            const swipe = swipePower(
                                                offset.x,
                                                velocity.x,
                                            );
                                            if (
                                                swipe <
                                                -swipeConfidenceThreshold
                                            )
                                                paginate(1);
                                            else if (
                                                swipe > swipeConfidenceThreshold
                                            )
                                                paginate(-1);
                                            setTimeout(
                                                () => setIsDragging(false),
                                                200,
                                            );
                                        }}
                                        className="absolute inset-0 w-full h-full"
                                    >
                                        <SlideContent
                                            course={currentCourse}
                                            gradient={getGradient(currentIndex)}
                                            onAction={() =>
                                                handleSlideAction(currentCourse)
                                            }
                                            isEnrolling={
                                                enrollingCourse ===
                                                currentCourse.id
                                            }
                                            isDragging={isDragging}
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation arrows — 50% on carousel edge (arrow=32px, padding=24px → left/right = 24px - 16px = 8px = left-2) */}
                {!loading && courses.length > 1 && (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                paginate(-1);
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer"
                            aria-label="Slide trước"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                paginate(1);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer"
                            aria-label="Slide tiếp theo"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </>
                )}

                {/* Bar-Shaped Indicators — below the banner */}
                {!loading && courses.length > 1 && (
                    <div className="flex items-center gap-2 mt-3 px-6">
                        {courses.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setDirection(index > currentIndex ? 1 : -1);
                                    setCurrentIndex(index);
                                }}
                                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                                    index === currentIndex
                                        ? "w-10 bg-indigo-500"
                                        : "w-6 bg-gray-300 hover:bg-gray-400"
                                }`}
                                aria-label={`Đi đến slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* --- STATS + ACTIONS ROW — same px-6 as carousel for alignment --- */}
            <div className="relative px-6 pb-6 sm:pb-8">
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Stats */}
                    <div className="flex items-center gap-6 sm:gap-8">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                <Users className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-900 leading-tight">
                                    {platformStats
                                        ? formatStatNumber(
                                              platformStats.totalStudents,
                                          )
                                        : "—"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Học viên
                                </p>
                            </div>
                        </div>

                        <div className="w-px h-8 bg-gray-200" />

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                                <GraduationCap className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-900 leading-tight">
                                    {platformStats
                                        ? platformStats.totalCourses
                                        : "—"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Khóa học
                                </p>
                            </div>
                        </div>

                        <div className="w-px h-8 bg-gray-200" />

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-900 leading-tight">
                                    {platformStats
                                        ? platformStats.avgRating || "—"
                                        : "—"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Đánh giá
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push("/roadmap")}
                            className="px-5 py-2.5 bg-white border border-gray-200 hover:border-indigo-200 text-gray-700 hover:text-indigo-600 font-medium rounded-full transition-all hover:bg-indigo-50 flex items-center gap-2 text-sm cursor-pointer"
                        >
                            <BookOpen className="w-4 h-4" />
                            <span>Lộ trình học</span>
                        </button>

                        <button
                            onClick={() => {
                                const el =
                                    document.getElementById("courses-section");
                                if (el)
                                    el.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="group px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-full shadow-lg shadow-indigo-200 transition-all hover:shadow-indigo-300 hover:-translate-y-0.5 flex items-center gap-2 text-sm cursor-pointer"
                        >
                            <span>Khám phá khóa học</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ============================================================
// Slide Content Component
// ============================================================

function SlideContent({
    course,
    gradient,
    onAction,
    isEnrolling,
    isDragging,
}: {
    course: Course;
    gradient: { from: string; to: string };
    onAction: () => void;
    isEnrolling: boolean;
    isDragging: boolean;
}) {
    const levelDisplay = LEVEL_MAP[course.level] || "Cơ bản";

    return (
        <div
            className="w-full h-full flex items-center"
            style={{
                background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
            }}
        >
            {/* Left Column — Text */}
            <div className="flex-[3] px-8 sm:px-10 py-6 flex flex-col justify-center min-w-0">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-3">
                    {course.isPro ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-400/90 backdrop-blur-sm text-amber-900 text-xs font-bold rounded-full">
                            <Zap className="w-3 h-3" /> PRO
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-400/90 backdrop-blur-sm text-green-900 text-xs font-bold rounded-full">
                            <Sparkles className="w-3 h-3" /> Miễn phí
                        </span>
                    )}
                    <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                        {levelDisplay}
                    </span>
                </div>

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2 line-clamp-2">
                    {course.title}
                </h2>

                {/* Description */}
                <p className="text-sm sm:text-base text-white/80 leading-relaxed mb-4 line-clamp-2 max-w-lg">
                    {course.subtitle ||
                        `Khám phá khóa học chất lượng cao từ các chuyên gia hàng đầu. Nâng cao kỹ năng và xây dựng sự nghiệp vững chắc.`}
                </p>

                {/* Marketing stats */}
                <div className="flex items-center gap-4 mb-4 text-white/70 text-sm">
                    <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {course.students.toLocaleString()} học viên
                    </span>
                    <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {levelDisplay}
                    </span>
                    <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {course.rating > 0 ? course.rating.toFixed(1) : "4.8"}
                    </span>
                </div>

                {/* CTA + Price */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isDragging && !isEnrolling) onAction();
                        }}
                        disabled={isEnrolling}
                        className="px-5 py-2.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white hover:text-gray-900 transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                        {isEnrolling ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                <span>Đang xử lý...</span>
                            </>
                        ) : course.isFree ? (
                            <>
                                <span>Học ngay miễn phí</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        ) : (
                            <>
                                <span>Xem chi tiết</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>

                    {course.isPro && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-white/50 line-through">
                                {new Intl.NumberFormat("vi-VN").format(
                                    calculatePricing(course.priceAmount)
                                        .originalPrice,
                                )}
                                ₫
                            </span>
                            <span className="text-lg font-bold text-white">
                                {new Intl.NumberFormat("vi-VN").format(
                                    course.priceAmount,
                                )}
                                ₫
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column — Image */}
            <div className="hidden sm:flex flex-[2] items-center justify-center pr-8 py-6">
                <div className="relative w-full max-w-[280px] aspect-[16/10] rounded-xl overflow-hidden shadow-2xl shadow-black/20">
                    {course.thumbnailUrl ? (
                        <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                            <Sparkles className="w-12 h-12 text-white/40" />
                        </div>
                    )}

                    {/* Decorative overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                    {/* Students count badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/40 backdrop-blur-sm rounded-full">
                        <Users className="w-3 h-3 text-white" />
                        <span className="text-xs text-white font-medium">
                            {course.students.toLocaleString()} học viên
                        </span>
                    </div>
                </div>
            </div>

            {/* Loading overlay */}
            {isEnrolling && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                    <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
                        <p className="text-sm font-medium opacity-90">
                            {course.isFree
                                ? "Đang đăng ký..."
                                : "Đang kiểm tra..."}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
