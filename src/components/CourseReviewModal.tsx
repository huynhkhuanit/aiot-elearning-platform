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

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            <CourseReviews
                                courseSlug={courseSlug}
                                courseRating={0}
                                ratingCount={0}
                                isEnrolled={true}
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
    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="fixed bottom-6 left-20 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
            title="Đánh giá khóa học"
        >
            <Star className="w-4 h-4 fill-white" />
            <span>Đánh giá</span>
        </motion.button>
    );
}
