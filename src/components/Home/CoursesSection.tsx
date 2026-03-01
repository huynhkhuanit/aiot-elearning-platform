"use client";

import { ArrowRight, Clock, Eye } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import AvatarWithProBadge from "@/components/AvatarWithProBadge";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

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
    gradient: string;
    featured?: boolean;
    totalLessons: number;
    isEnrolled?: boolean;
    thumbnailUrl?: string | null;
    instructor?: {
        name?: string;
        username?: string;
        avatar?: string | null;
        isPro?: boolean;
    };
}

// Gradients cho PRO courses (màu sắc đa dạng)
const GRADIENTS_PRO = [
    "from-indigo-500 to-purple-600",
    "from-blue-500 to-indigo-600",
    "from-purple-500 to-pink-600",
    "from-yellow-500 to-orange-600",
];

// Gradients cho FREE courses (sử dụng primary color Indigo)
const GRADIENTS_FREE = [
    "from-indigo-500 to-indigo-600",
    "from-indigo-600 to-indigo-700",
    "from-indigo-400 to-indigo-600",
];

// Helper function to calculate original price and discount for PRO courses
const calculatePricing = (currentPrice: number) => {
    // Original price is ~40% higher than current price (seller strategy)
    const originalPrice = Math.round(currentPrice * 1.4);
    // Round to nearest 100k for cleaner display
    const roundedOriginalPrice = Math.round(originalPrice / 100000) * 100000;
    const discountPercent = Math.round(
        ((roundedOriginalPrice - currentPrice) / roundedOriginalPrice) * 100,
    );

    return {
        originalPrice: roundedOriginalPrice,
        currentPrice: currentPrice,
        discountPercent,
    };
};

export default function CoursesSection() {
    const [proCourses, setProCourses] = useState<Course[]>([]);
    const [freeCourses, setFreeCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrollingCourse, setEnrollingCourse] = useState<string | null>(null);
    const toast = useToast();
    const { isAuthenticated, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/courses");
            const data = await response.json();

            if (data.success) {
                const courses = data.data.courses.map(
                    (course: any, index: number) => {
                        // Sử dụng gradient khác cho PRO và FREE courses
                        const gradients = course.isFree
                            ? GRADIENTS_FREE
                            : GRADIENTS_PRO;
                        const gradientIndex = course.isFree
                            ? index % gradients.length
                            : index % gradients.length;

                        return {
                            ...course,
                            gradient: gradients[gradientIndex],
                            featured: index === 0 && !course.isFree,
                            isEnrolled: false, // Sẽ cập nhật nếu người dùng đã đăng ký
                        };
                    },
                );

                const pro = courses.filter((c: Course) => c.isPro);
                const free = courses.filter((c: Course) => c.isFree);

                setProCourses(pro);
                setFreeCourses(free);
            } else {
                toast.error("Không thể tải danh sách khóa học");
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
            toast.error("Đã có lỗi xảy ra khi tải khóa học");
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (course: Course) => {
        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để đăng ký khóa học");
            return;
        }

        // Prevent multiple enrollments
        if (enrollingCourse) {
            console.log("[COURSE] Already enrolling, ignore");
            return;
        }

        try {
            setEnrollingCourse(course.id);

            const courseType = course.isFree ? "FREE" : "PRO";
            console.log(
                `[${courseType} COURSE] Starting enrollment: ${course.slug}`,
            );

            const response = await fetch(`/api/courses/${course.slug}/enroll`, {
                method: "POST",
                credentials: "include",
            });

            const data = await response.json();
            console.log(`[${courseType} COURSE] Enroll response:`, data);

            if (data.success) {
                toast.success(data.message || "Đăng ký khóa học thành công!");

                if (data.data?.upgradedToPro) {
                    console.log(`[${courseType} COURSE] User upgraded to PRO`);
                    // Reload page after delay to show new PRO status
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    // Navigate to learn page after short delay
                    console.log(
                        `[${courseType} COURSE] Enrollment successful, navigating to: /learn/${course.slug}`,
                    );
                    setTimeout(() => {
                        router.push(`/learn/${course.slug}`);
                    }, 800);
                }
            } else {
                // Handle specific error cases
                if (data.message && data.message.includes("đã đăng ký")) {
                    console.log(`[${courseType} COURSE] Already enrolled`);
                    toast.info(
                        "Bạn đã đăng ký khóa học này. Đang chuyển hướng...",
                    );
                    setTimeout(() => {
                        router.push(`/learn/${course.slug}`);
                    }, 800);
                } else {
                    console.error(
                        `[${courseType} COURSE] Enrollment failed:`,
                        data.message,
                    );
                    toast.error(data.message || "Không thể đăng ký khóa học");
                }
            }
        } catch (error) {
            console.error("[COURSE] Error during enrollment:", error);
            toast.error("Đã có lỗi xảy ra khi đăng ký. Vui lòng thử lại");
        } finally {
            // ✅ IMPORTANT: Always clear the enrolling state
            setEnrollingCourse(null);
        }
    };

    const handleProCourseClick = async (course: Course) => {
        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để tiếp tục");
            return;
        }

        // Prevent multiple checks
        if (enrollingCourse) {
            console.log("[PRO COURSE] Already checking, ignore");
            return;
        }

        try {
            setEnrollingCourse(course.id);
            console.log(
                `[PRO COURSE] Checking enrollment status for: ${course.slug}`,
            );

            const response = await fetch(`/api/courses/${course.slug}`, {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log(`[PRO COURSE] Course status:`, data);

            if (data.success) {
                // ✅ Check the isEnrolled field from API
                if (data.data.isEnrolled) {
                    console.log(
                        `[PRO COURSE] User already enrolled, navigating to learn page`,
                    );
                    router.push(`/learn/${course.slug}`);
                } else {
                    console.log(
                        `[PRO COURSE] User not enrolled, navigating to course details`,
                    );
                    router.push(`/courses/${course.slug}`);
                }
            } else {
                console.log(
                    `[PRO COURSE] Error checking status, navigating to course details as fallback`,
                );
                router.push(`/courses/${course.slug}`);
            }
        } catch (error) {
            console.error("[PRO COURSE] Error checking enrollment:", error);
            // Fallback to course details page
            router.push(`/courses/${course.slug}`);
        } finally {
            // ✅ IMPORTANT: Always clear the enrolling state
            setEnrollingCourse(null);
        }
    };

    // Skeleton loading component
    const SkeletonCard = () => (
        <div className="rounded-2xl shadow-lg overflow-hidden border border-gray-100 h-full flex flex-col bg-[#f7f7f7] animate-pulse">
            <div className="relative h-32 bg-gray-200 flex-shrink-0"></div>
            <div className="p-4 flex-1 flex flex-col">
                <div className="mb-3 flex-1">
                    <div className="h-5 w-3/4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-full bg-gray-200 rounded mb-3"></div>
                </div>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                        <div className="h-4 w-12 bg-gray-200 rounded"></div>
                        <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="h-6 w-24 bg-gray-200 rounded"></div>
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>
    );

    return (
        <section
            id="courses-section"
            className="py-16 bg-gradient-to-br from-gray-50 to-white"
        >
            <PageContainer size="lg">
                {loading ? (
                    <>
                        {/* PRO Courses Skeleton */}
                        <div className="mb-16">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <div className="text-lg font-bold text-gray-900 mb-2">
                                        Khóa học Pro
                                        <span className="ml-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1 rounded-full">
                                            PRO
                                        </span>
                                    </div>
                                    <p className="text-gray-600">
                                        Khóa học JavaScript chuyên sâu cho
                                        developer
                                    </p>
                                </div>
                                <a
                                    href="/roadmap"
                                    className="hidden md:flex items-center text-primary font-semibold hover:text-primary/80 transition-colors duration-200"
                                >
                                    Xem lộ trình
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </a>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {[...Array(4)].map((_, index) => (
                                    <SkeletonCard key={index} />
                                ))}
                            </div>
                        </div>
                        {/* FREE Courses Skeleton */}
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <div className="text-lg font-bold text-gray-900 mb-2">
                                        Khóa học miễn phí
                                    </div>
                                    <p className="text-gray-600">
                                        Học miễn phí với các khóa học chất lượng
                                    </p>
                                </div>
                                <a
                                    href="/roadmap"
                                    className="hidden md:flex items-center text-primary font-semibold hover:text-primary/80 transition-colors duration-200"
                                >
                                    Xem lộ trình
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </a>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {[...Array(4)].map((_, index) => (
                                    <SkeletonCard key={index} />
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {proCourses.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="mb-16"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <div className="text-lg font-bold text-gray-900 mb-2">
                                            Khóa học Pro
                                            <span className="ml-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1 rounded-full">
                                                PRO
                                            </span>
                                        </div>
                                        <p className="text-gray-600">
                                            Khóa học JavaScript chuyên sâu cho
                                            developer
                                        </p>
                                    </div>
                                    <a
                                        href="/roadmap"
                                        className="hidden md:flex items-center text-primary font-semibold hover:text-primary/80 transition-colors duration-200"
                                    >
                                        Xem lộ trình
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </a>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {proCourses.map((course, index) => (
                                        <motion.div
                                            key={course.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{
                                                duration: 0.3,
                                                delay: index * 0.03,
                                            }}
                                        >
                                            <CourseCard
                                                course={course}
                                                onEnroll={() =>
                                                    handleEnroll(course)
                                                }
                                                onProClick={() =>
                                                    handleProCourseClick(course)
                                                }
                                                isEnrolling={
                                                    enrollingCourse ===
                                                    course.id
                                                }
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                        {freeCourses.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <div className="text-lg font-bold text-gray-900 mb-2">
                                            Khóa học miễn phí
                                        </div>
                                        <p className="text-gray-600">
                                            Học miễn phí với các khóa học chất
                                            lượng
                                        </p>
                                    </div>
                                    <a
                                        href="/roadmap"
                                        className="hidden md:flex items-center text-primary font-semibold hover:text-primary/80 transition-colors duration-200"
                                    >
                                        Xem lộ trình
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </a>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {freeCourses.map((course, index) => (
                                        <motion.div
                                            key={course.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{
                                                duration: 0.3,
                                                delay: index * 0.02,
                                            }}
                                        >
                                            <CourseCard
                                                course={course}
                                                onEnroll={() =>
                                                    handleEnroll(course)
                                                }
                                                isEnrolling={
                                                    enrollingCourse ===
                                                    course.id
                                                }
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </PageContainer>
        </section>
    );
}

function CourseCard({
    course,
    onEnroll,
    onProClick,
    isEnrolling,
}: {
    course: Course;
    onEnroll: () => void;
    onProClick?: () => void;
    isEnrolling: boolean;
}) {
    const { isAuthenticated } = useAuth();
    const toast = useToast();
    const router = useRouter();

    const handleCardClick = () => {
        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để tiếp tục");
            return;
        }

        if (course.isFree) {
            if (isEnrolling) return;

            (async () => {
                try {
                    const response = await fetch(
                        `/api/courses/${course.slug}`,
                        {
                            credentials: "include",
                        },
                    );
                    const data = await response.json();

                    if (data.success && data.data.isEnrolled) {
                        router.push(`/learn/${course.slug}`);
                    } else {
                        onEnroll();
                    }
                } catch {
                    toast.error("Có lỗi xảy ra. Vui lòng thử lại");
                }
            })();
        } else {
            if (onProClick) onProClick();
        }
    };

    const instructorName =
        course.instructor?.name || course.instructor?.username || "Giảng viên";
    const instructorAvatar = course.instructor?.avatar;
    const instructorIsPro = course.instructor?.isPro ?? false;

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="group rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden bg-white h-full flex flex-col cursor-pointer border border-gray-100"
            onClick={handleCardClick}
        >
            {/* Banner */}
            <div
                className={`relative h-[170px] flex-shrink-0 overflow-hidden ${isEnrolling ? "opacity-50" : ""}`}
            >
                {course.thumbnailUrl ? (
                    <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                                parent.className = `relative h-[170px] bg-gradient-to-br ${course.gradient} flex items-center justify-center flex-shrink-0 overflow-hidden ${isEnrolling ? "opacity-50" : ""}`;
                            }
                        }}
                    />
                ) : (
                    <div
                        className={`absolute inset-0 bg-gradient-to-br ${course.gradient}`}
                    ></div>
                )}

                {/* Crown icon for Pro courses */}
                {course.isPro && !isEnrolling && (
                    <div className="absolute top-3 left-3 z-20">
                        <span className="text-xl drop-shadow-lg">👑</span>
                    </div>
                )}

                {/* Loading overlay */}
                {isEnrolling && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
                        <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
                            <div className="text-xs font-semibold opacity-90">
                                {course.isFree
                                    ? "Đang đăng ký..."
                                    : "Đang kiểm tra..."}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
                {/* Title */}
                <h3 className="course-card-title text-gray-900 mb-2 line-clamp-1 group-hover:text-primary transition-colors duration-200">
                    {course.title}
                </h3>

                {/* Price row */}
                <div className="mb-3">
                    {course.isPro ? (
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm text-gray-400 line-through">
                                {new Intl.NumberFormat("vi-VN").format(
                                    calculatePricing(course.priceAmount)
                                        .originalPrice,
                                )}
                                đ
                            </span>
                            <span className="text-base font-bold text-[#f05123]">
                                {new Intl.NumberFormat("vi-VN").format(
                                    course.priceAmount,
                                )}
                                đ
                            </span>
                        </div>
                    ) : (
                        <span className="text-base font-bold text-[#f05123]">
                            {course.price === "Miễn phí"
                                ? "Miễn phí"
                                : course.price}
                        </span>
                    )}
                </div>

                {/* Author + Stats row */}
                <div className="flex items-center justify-between text-[13px] text-gray-500 mt-auto">
                    {/* Author */}
                    <div className="flex items-center gap-1.5 min-w-0">
                        <AvatarWithProBadge
                            avatarUrl={instructorAvatar}
                            fullName={instructorName}
                            isPro={instructorIsPro}
                            size="2xs"
                        />
                        <span className="truncate text-gray-600">
                            {instructorName}
                        </span>
                    </div>

                    {/* Student count */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Eye className="w-3.5 h-3.5 text-gray-400" />
                        <span>{course.students.toLocaleString()}</span>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{course.duration}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
