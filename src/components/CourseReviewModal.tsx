"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CourseReviews from "@/components/CourseReviews";

interface CourseReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseSlug: string;
    courseTitle: string;
}

export default function CourseReviewModal({
    isOpen,
    onClose,
    courseSlug,
    courseTitle,
}: CourseReviewModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.95 }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 300,
                        }}
                        className="fixed inset-4 lg:inset-x-[10%] lg:inset-y-8 bg-[#0e1117] border border-white/10 rounded-2xl z-[61] flex flex-col overflow-hidden shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    Đánh giá khóa học
                                </h2>
                                <p className="text-sm text-gray-400 truncate max-w-md">
                                    {courseTitle}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content — embedded mode strips the section wrapper */}
                        <div className="flex-1 overflow-y-auto">
                            <CourseReviews
                                courseSlug={courseSlug}
                                courseRating={0}
                                ratingCount={0}
                                isEnrolled={true}
                                embedded={true}
                            />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ═══════════════════════════════════════════
// Floating Review Button (like Q&A Button)
// ═══════════════════════════════════════════
export function CourseReviewButton({ onClick }: { onClick: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="fixed left-20 bottom-6 z-50 bg-amber-500 hover:bg-amber-400 text-white rounded-full p-3 shadow-lg shadow-amber-500/25 transition-all duration-300 transform hover:scale-105 group"
            aria-label="Đánh giá khóa học"
        >
            <div className="relative">
                <Star className="w-5 h-5" />
            </div>

            {/* Tooltip */}
            <div
                className={`absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-zinc-900 text-zinc-100 text-sm px-3 py-2 rounded-lg shadow-xl transition-all duration-200 border border-zinc-800 ${
                    isHovered ? "opacity-100 visible" : "opacity-0 invisible"
                }`}
            >
                Đánh giá khóa học
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-zinc-900"></div>
            </div>
        </button>
    );
}
