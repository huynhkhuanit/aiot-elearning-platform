"use client";

import { useState } from "react";
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

  return (
    <>
      {/* Floating Button - Minimal circle style */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 left-6 z-40 w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
        aria-label="Mở bảng tin"
      >
        <Megaphone className="w-5 h-5" />
        
        {/* Notification dot */}
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
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

            {/* Modal Content - Fixed sizes: 303px mobile, 636px desktop */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{ 
                width: '100%',
                maxWidth: '303px'
              }}
              className="newsletter-modal relative bg-white rounded-xl shadow-xl max-h-[85vh] overflow-hidden md:!max-w-[636px]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button - top right */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 z-10 w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                aria-label="Đóng"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>

              {/* Content */}
              <div className="p-4 pt-10 overflow-y-auto max-h-[85vh]">
                
                {/* Title with icon instead of # */}
                <div className="flex items-center gap-2 mb-1">
                  <Megaphone className="w-4 h-4 text-gray-700" />
                  <span style={{ fontSize: '14px', fontWeight: 600 }} className="text-gray-900">
                    Bảng tin CodeSense AIoT
                  </span>
                </div>
                <p style={{ fontSize: '12px' }} className="text-gray-500 mb-4">
                  Cập nhật mới nhất từ hệ thống 🚀
                </p>

                {/* Divider */}
                <div className="border-t border-gray-100 mb-4" />

                {/* Section: Có gì mới? */}
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span style={{ fontSize: '13px', fontWeight: 600 }} className="text-gray-900">
                    Có gì mới?
                  </span>
                </div>
                
                <ul className="space-y-2 mb-6">
                  {bulletinData.newFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2" style={{ fontSize: '12px' }}>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong className="text-gray-900">{feature.title}</strong>
                        <span className="text-gray-600"> — {feature.description}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Section: Bài viết nổi bật */}
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span style={{ fontSize: '13px', fontWeight: 600 }} className="text-gray-900">
                    Bài viết nổi bật
                  </span>
                </div>

                <div className="space-y-2 mb-6">
                  {bulletinData.articles.map((article, index) => (
                    <Link 
                      key={index}
                      href={article.href}
                      onClick={handleClose}
                      className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: '12px' }} className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {article.title}
                        </p>
                        <p style={{ fontSize: '11px' }} className="text-gray-500 mt-0.5">
                          {article.readTime} • {article.views} lượt xem
                        </p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors flex-shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>

                {/* Section: Changelog */}
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span style={{ fontSize: '13px', fontWeight: 600 }} className="text-gray-900">
                    Cập nhật gần đây
                  </span>
                </div>

                <ul className="space-y-1.5">
                  {bulletinData.changelog.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-600" style={{ fontSize: '11px' }}>
                      <code className="text-gray-400 bg-gray-100 px-1 py-0.5 rounded font-mono flex-shrink-0" style={{ fontSize: '10px' }}>
                        {item.date}
                      </code>
                      <span>{item.content}</span>
                    </li>
                  ))}
                </ul>

                {/* Footer */}
                <div className="mt-6 pt-3 border-t border-gray-100">
                  <p style={{ fontSize: '11px' }} className="text-gray-400 text-center">
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
