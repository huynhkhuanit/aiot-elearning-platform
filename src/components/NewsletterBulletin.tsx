"use client";

import { useState } from "react";
import { Megaphone, X, ExternalLink, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

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

  return (
    <>
      {/* Floating Button - Bottom Left */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 left-6 z-40 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:shadow-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label="Mở bảng tin"
      >
        <Megaphone className="w-5 h-5" />
        
        {/* Notification dot */}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="w-2 h-2 bg-white rounded-full" />
          </span>
        )}
      </button>

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

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[303px] md:max-w-[636px] max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📢</span>
                  <h2 className="text-base font-semibold text-gray-900">Bảng tin</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Content - Markdown Style */}
              <div className="p-5 overflow-y-auto max-h-[calc(85vh-120px)] prose prose-sm max-w-none">
                
                {/* Section: Tin mới */}
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Có gì mới?
                </h3>
                
                <ul className="space-y-2 mb-6 text-sm text-gray-600 list-none pl-0">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span><strong>AI Roadmap</strong> — Tạo lộ trình học tập cá nhân hóa với trí tuệ nhân tạo.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Code Playground</strong> — Môi trường lập trình trực tiếp trong trình duyệt.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Chứng chỉ khóa học</strong> — Nhận chứng chỉ sau khi hoàn thành khóa học.</span>
                  </li>
                </ul>

                {/* Section: Bài viết nổi bật */}
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Bài viết nổi bật
                </h3>

                <div className="space-y-3 mb-6">
                  <Link 
                    href="/blog/huong-dan-hoc-lap-trinh" 
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors no-underline"
                    onClick={handleClose}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-0.5">Hướng dẫn học lập trình hiệu quả</p>
                        <p className="text-xs text-gray-500">5 phút đọc • 2.5k lượt xem</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                  </Link>
                  
                  <Link 
                    href="/blog/roadmap-frontend-2026" 
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors no-underline"
                    onClick={handleClose}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-0.5">Roadmap Frontend Developer 2026</p>
                        <p className="text-xs text-gray-500">8 phút đọc • 4.1k lượt xem</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                  </Link>
                </div>

                {/* Section: Cập nhật gần đây */}
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  Cập nhật gần đây
                </h3>

                <ul className="space-y-1.5 text-xs text-gray-500 list-none pl-0">
                  <li className="flex items-center gap-2">
                    <span className="text-gray-400">01/02</span>
                    <span className="text-gray-300">—</span>
                    <span>Cải thiện giao diện trang lộ trình</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-gray-400">28/01</span>
                    <span className="text-gray-300">—</span>
                    <span>Thêm tính năng Roadmap Tree View</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-gray-400">25/01</span>
                    <span className="text-gray-300">—</span>
                    <span>Sửa lỗi video player không chuyển bài</span>
                  </li>
                </ul>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-400 text-center">
                  CodeSense AIoT • Học lập trình thông minh 🚀
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}


