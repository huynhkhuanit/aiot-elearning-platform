"use client";

import { useState } from "react";
import { Megaphone, X, Sparkles, Zap, Bug, ExternalLink } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Dữ liệu tin tức mẫu - có thể thay bằng API sau
const bulletinItems = [
  {
    id: 1,
    date: "01/02/2026",
    type: "new" as const,
    title: "Ra mắt tính năng AI Roadmap",
    description: "Tạo lộ trình học tập cá nhân hóa với trí tuệ nhân tạo."
  },
  {
    id: 2,
    date: "28/01/2026",
    type: "update" as const,
    title: "Cập nhật giao diện Roadmap Tree",
    description: "Giao diện mới trực quan và dễ sử dụng hơn."
  },
  {
    id: 3,
    date: "25/01/2026",
    type: "fix" as const,
    title: "Sửa lỗi video player",
    description: "Khắc phục lỗi video không tự động chuyển bài."
  },
  {
    id: 4,
    date: "20/01/2026",
    type: "new" as const,
    title: "Thêm Code Playground",
    description: "Môi trường lập trình trực tiếp trong trình duyệt."
  }
];

const typeConfig = {
  new: {
    label: "Mới",
    icon: Sparkles,
    color: "text-emerald-600",
    bg: "bg-emerald-50"
  },
  update: {
    label: "Cập nhật",
    icon: Zap,
    color: "text-blue-600",
    bg: "bg-blue-50"
  },
  fix: {
    label: "Sửa lỗi",
    icon: Bug,
    color: "text-amber-600",
    bg: "bg-amber-50"
  }
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

      {/* Custom Modal - Simple Design */}
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
                  <h2 className="text-base font-semibold text-gray-900">Bảng tin cập nhật</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 overflow-y-auto max-h-[calc(85vh-120px)]">
                <p className="text-sm text-gray-500 mb-4">
                  Các cập nhật và tính năng mới nhất của CodeSense AIoT.
                </p>

                {/* Bulletin Cards */}
                <div className="space-y-3">
                  {bulletinItems.map((item) => {
                    const config = typeConfig[item.type];
                    const IconComponent = config.icon;
                    
                    return (
                      <div
                        key={item.id}
                        className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Badge + Date */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${config.bg} ${config.color}`}>
                                <IconComponent className="w-3 h-3" />
                                {config.label}
                              </span>
                              <span className="text-xs text-gray-400">{item.date}</span>
                            </div>
                            
                            {/* Title */}
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                              {item.title}
                            </h3>
                            
                            {/* Description */}
                            <p className="text-xs text-gray-500 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-400 text-center">
                  Cảm ơn bạn đã sử dụng CodeSense AIoT! 🚀
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

