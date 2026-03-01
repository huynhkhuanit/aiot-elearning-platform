"use client";

import { useState, useEffect } from "react";
import { Megaphone, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Bulletin entries — each is a news post with title, date, and content paragraphs
const bulletinEntries = [
    {
        id: 1,
        title: "Chào mừng đến với CodeSense AIoT",
        date: "01/03/2026",
        content: [
            "Chúng tôi rất vui khi giới thiệu đến bạn nền tảng học tập thông minh CodeSense AIoT — nơi kết hợp trí tuệ nhân tạo và IoT để mang đến trải nghiệm học lập trình hiệu quả nhất.",
            "Hệ thống cung cấp các khóa học từ cơ bản đến nâng cao, lộ trình học tập cá nhân hóa, và môi trường thực hành trực tiếp trên trình duyệt.",
        ],
    },
    {
        id: 2,
        title: "Tính năng mới: AI Roadmap & Code Playground",
        date: "28/02/2026",
        content: [
            "AI Roadmap giúp bạn tạo lộ trình học tập được cá nhân hóa dựa trên mục tiêu và trình độ hiện tại. Hệ thống sẽ đề xuất các khóa học phù hợp và theo dõi tiến trình của bạn.",
            "Code Playground cho phép bạn viết và chạy code trực tiếp trong trình duyệt mà không cần cài đặt bất kỳ phần mềm nào. Hỗ trợ nhiều ngôn ngữ lập trình phổ biến.",
        ],
    },
    {
        id: 3,
        title: "Cập nhật hệ thống",
        date: "25/02/2026",
        content: [
            "• Cải thiện giao diện trang lộ trình học tập",
            "• Thêm tính năng Roadmap Tree View",
            "• Sửa lỗi video player không tự chuyển bài",
            "• Tối ưu hiệu suất tải trang",
        ],
    },
];

export default function NewsletterBulletin() {
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(true);

    const handleOpen = () => {
        setIsOpen(true);
        setHasUnread(false);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    // ESC to close
    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        };
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    return (
        <>
            {/* Floating Button — minimal, F8-style */}
            <motion.button
                onClick={handleOpen}
                className="fixed bottom-6 left-6 z-40 w-11 h-11 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 rounded-full shadow-lg border border-gray-200 flex items-center justify-center transition-all duration-200 focus:outline-none cursor-pointer"
                aria-label="Mở bảng tin"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Megaphone className="w-[18px] h-[18px]" />
                {hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                )}
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50"
                            onClick={handleClose}
                        />

                        {/* Modal Content — F8 style */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 8 }}
                            transition={{
                                type: "spring",
                                duration: 0.35,
                                bounce: 0.2,
                            }}
                            className="relative w-full max-w-[640px] bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header — clean, F8 style */}
                            <div className="flex items-center justify-between px-7 pt-6 pb-4">
                                <h2
                                    className="text-xl font-bold text-gray-900"
                                    style={{
                                        fontSize: "20px",
                                        fontWeight: 700,
                                    }}
                                >
                                    Bản tin mới
                                </h2>
                                <button
                                    onClick={handleClose}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                                    aria-label="Đóng"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-gray-100 mx-7" />

                            {/* Content — scrollable */}
                            <div className="flex-1 overflow-y-auto px-7 py-5">
                                <div className="space-y-8">
                                    {bulletinEntries.map((entry) => (
                                        <article key={entry.id}>
                                            {/* Entry title with # prefix like F8 */}
                                            <div className="flex items-start gap-2 mb-3">
                                                <span
                                                    className="text-[#f05123] font-bold select-none"
                                                    style={{
                                                        fontSize: "16px",
                                                    }}
                                                >
                                                    #
                                                </span>
                                                <h3
                                                    className="font-semibold text-gray-900 leading-snug"
                                                    style={{
                                                        fontSize: "16px",
                                                    }}
                                                >
                                                    {entry.title}
                                                </h3>
                                            </div>

                                            {/* Content paragraphs */}
                                            <div className="space-y-3 pl-5">
                                                {entry.content.map(
                                                    (paragraph, pIdx) => (
                                                        <p
                                                            key={pIdx}
                                                            className="text-gray-700 leading-relaxed"
                                                            style={{
                                                                fontSize:
                                                                    "14.5px",
                                                            }}
                                                        >
                                                            {paragraph}
                                                        </p>
                                                    ),
                                                )}
                                            </div>

                                            {/* Date tag */}
                                            <div className="pl-5 mt-2">
                                                <span className="text-xs text-gray-400">
                                                    {entry.date}
                                                </span>
                                            </div>
                                        </article>
                                    ))}
                                </div>

                                {/* Footer text */}
                                <div className="mt-8 pt-5 border-t border-gray-100">
                                    <p className="text-sm text-gray-400 text-center">
                                        CodeSense AIoT • Học lập trình thông
                                        minh với AI & IoT
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
