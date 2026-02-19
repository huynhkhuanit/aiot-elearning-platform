"use client";

import { useState, useEffect } from "react";
import { Megaphone, X, ChevronRight, ExternalLink, Sparkles, FileText, Clock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

// Dữ liệu bảng tin - có thể chuyển sang API sau
const bulletinData = {
  newFeatures: [
    {
      title: "AI Roadmap",
      description: "Tạo lộ trình học tập cá nhân hóa với trí tuệ nhân tạo."
    },
    {
      title: "Code Playground",
      description: "Môi trường lập trình trực tiếp trong trình duyệt."
    },
    {
      title: "Chứng chỉ khóa học",
      description: "Nhận chứng chỉ sau khi hoàn thành khóa học."
    }
  ],
  articles: [
    {
      title: "Hướng dẫn học lập trình hiệu quả",
      readTime: "5 phút đọc",
      views: "2.5k",
      href: "/blog/huong-dan-hoc-lap-trinh"
    },
    {
      title: "Roadmap Frontend Developer 2026",
      readTime: "8 phút đọc",
      views: "4.1k",
      href: "/blog/roadmap-frontend-2026"
    }
  ],
  changelog: [
    { date: "01/02", content: "Cải thiện giao diện trang lộ trình" },
    { date: "28/01", content: "Thêm tính năng Roadmap Tree View" },
    { date: "25/01", content: "Sửa lỗi video player không chuyển bài" }
  ]
};

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

  // ESC để đóng modal
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
      {/* Floating Button - Indigo gradient theme */}
      <motion.button
        onClick={handleOpen}
        className="fixed bottom-6 left-6 z-40 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-200/60 hover:shadow-indigo-300/70 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label="Mở bảng tin"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Megaphone className="w-5 h-5" />
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full border-2 border-white animate-pulse" />
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
              className="relative w-full max-w-[380px] md:max-w-[420px] bg-white rounded-2xl shadow-2xl shadow-indigo-100/50 overflow-hidden max-h-[85vh] flex flex-col border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Gradient accent */}
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15)_0%,transparent_70%)]" />
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(99,102,241,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.06)_1px,transparent_1px)] bg-[size:16px_16px]" />
                
                <div className="relative flex items-center justify-between p-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
                      <Megaphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="modal-title text-gray-900">Bảng tin CodeSense AIoT</h2>
                      <p className="text-sm text-gray-500 mt-0.5">Cập nhật mới nhất từ hệ thống</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    aria-label="Đóng"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 pt-0">
                {/* Section: Có gì mới? */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Có gì mới?</span>
                  </div>
                  <ul className="space-y-2.5">
                    {bulletinData.newFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2.5 pl-1">
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                        <div className="body-text">
                          <span className="font-medium text-gray-900">{feature.title}</span>
                          <span className="text-gray-600"> — {feature.description}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Section: Bài viết nổi bật */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Bài viết nổi bật</span>
                  </div>
                  <div className="space-y-2">
                    {bulletinData.articles.map((article, index) => (
                      <Link
                        key={index}
                        href={article.href}
                        onClick={handleClose}
                        className="group flex items-center justify-between p-3.5 bg-gray-50 hover:bg-indigo-50/80 border border-gray-100 hover:border-indigo-100 rounded-xl transition-all duration-200"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="body-text font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {article.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {article.readTime} • {article.views} lượt xem
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors flex-shrink-0 ml-2" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Section: Changelog */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Cập nhật gần đây</span>
                  </div>
                  <ul className="space-y-2">
                    {bulletinData.changelog.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-600" style={{ fontSize: "13px" }}>
                        <code className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-mono text-xs flex-shrink-0">
                          {item.date}
                        </code>
                        <span>{item.content}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer */}
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-400 text-center">
                    CodeSense AIoT • Học lập trình thông minh
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
