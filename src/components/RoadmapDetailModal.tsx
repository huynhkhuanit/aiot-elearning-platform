"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Check, Clock, BookOpen, Play, FileText, 
  HelpCircle, Code, ExternalLink, ChevronRight,
  CheckCircle2, Circle, BookMarked, SkipForward
} from 'lucide-react';

interface LearningContent {
  id: string;
  title: string;
  type: 'video' | 'article' | 'practice' | 'quiz';
  duration?: string;
  completed?: boolean;
}

interface RoadmapDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeData: {
    id: string;
    title: string;
    description?: string;
    type: 'core' | 'optional' | 'beginner' | 'alternative' | 'project';
    status: 'available' | 'completed' | 'current' | 'locked' | 'done' | 'learning' | 'skipped' | 'in_progress' | 'pending';
    duration?: string;
    difficulty?: 'Cơ bản' | 'Trung cấp' | 'Nâng cao';
    technologies?: string[];
    learningContents?: LearningContent[];
  } | null;
  isCompleted?: boolean;
  onToggleComplete?: (nodeId: string, checked?: boolean) => void;
}

/**
 * Get type label with roadmap.sh naming
 */
const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    core: 'Chủ đề chính',
    optional: 'Chủ đề phụ',
    beginner: 'Cơ bản',
    alternative: 'Thay thế',
    project: 'Dự án',
  };
  return labels[type] || type;
};

/**
 * Get type color with roadmap.sh style (yellow, cream, green, etc.)
 */
const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    core: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    optional: 'bg-amber-50 text-amber-800 border-amber-200',
    beginner: 'bg-green-100 text-green-800 border-green-300',
    alternative: 'bg-gray-100 text-gray-700 border-gray-300',
    project: 'bg-orange-100 text-orange-800 border-orange-300',
  };
  return colors[type] || colors.optional;
};

/**
 * Get status badge
 */
const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    done: { 
      label: 'Đã hoàn thành', 
      className: 'bg-gray-200 text-gray-700',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />
    },
    completed: { 
      label: 'Đã hoàn thành', 
      className: 'bg-gray-200 text-gray-700',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />
    },
    learning: { 
      label: 'Đang học', 
      className: 'bg-purple-100 text-purple-700',
      icon: <BookMarked className="w-3.5 h-3.5" />
    },
    current: { 
      label: 'Đang học', 
      className: 'bg-purple-100 text-purple-700',
      icon: <BookMarked className="w-3.5 h-3.5" />
    },
    in_progress: { 
      label: 'Đang học', 
      className: 'bg-purple-100 text-purple-700',
      icon: <BookMarked className="w-3.5 h-3.5" />
    },
    skipped: { 
      label: 'Đã bỏ qua', 
      className: 'bg-slate-600 text-white',
      icon: <SkipForward className="w-3.5 h-3.5" />
    },
    locked: { 
      label: 'Đã khóa', 
      className: 'bg-gray-100 text-gray-500',
      icon: null
    },
  };
  return statusConfig[status] || null;
};

const getDifficultyColor = (difficulty?: string) => {
  switch (difficulty) {
    case 'Cơ bản':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'Trung cấp':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'Nâng cao':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getContentIcon = (type: string) => {
  switch (type) {
    case 'video':
      return <Play className="w-4 h-4" />;
    case 'article':
      return <FileText className="w-4 h-4" />;
    case 'practice':
      return <Code className="w-4 h-4" />;
    case 'quiz':
      return <HelpCircle className="w-4 h-4" />;
    default:
      return <BookOpen className="w-4 h-4" />;
  }
};

const RoadmapDetailModal: React.FC<RoadmapDetailModalProps> = ({
  isOpen,
  onClose,
  nodeData,
  isCompleted = false,
  onToggleComplete
}) => {
  if (!nodeData) return null;

  const statusBadge = getStatusBadge(nodeData.status);
  const isDone = nodeData.status === 'done' || nodeData.status === 'completed' || isCompleted;
  const isLearning = nodeData.status === 'learning' || nodeData.status === 'current' || nodeData.status === 'in_progress';
  const isSkipped = nodeData.status === 'skipped';

  const defaultLearningContents: LearningContent[] = [
    { id: '1', title: `Giới thiệu về ${nodeData.title}`, type: 'video', duration: '15 phút' },
    { id: '2', title: 'Các khái niệm cốt lõi', type: 'article', duration: '20 phút' },
    { id: '3', title: 'Thực hành cùng ví dụ', type: 'practice', duration: '30 phút' },
    { id: '4', title: 'Kiểm tra kiến thức', type: 'quiz', duration: '10 phút' },
  ];

  const learningContents = nodeData.learningContents || defaultLearningContents;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />

          {/* Sidebar Panel - Roadmap.sh style */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] overflow-y-auto"
          >
            {/* Header with roadmap.sh style */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
              <div className="px-6 py-5">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>

                <div className="pr-10">
                  {/* Badges row */}
                  <div className="flex items-center flex-wrap gap-2 mb-3">
                    {/* Type Badge */}
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${getTypeColor(nodeData.type)}`}>
                      {getTypeLabel(nodeData.type)}
                    </span>
                    
                    {/* Difficulty Badge */}
                    {nodeData.difficulty && (
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${getDifficultyColor(nodeData.difficulty)}`}>
                        {nodeData.difficulty}
                      </span>
                    )}
                    
                    {/* Status Badge */}
                    {statusBadge && (
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 ${statusBadge.className}`}>
                        {statusBadge.icon}
                        {statusBadge.label}
                      </span>
                    )}
                  </div>

                  {/* Title with status styling */}
                  <h2 className={`text-xl font-semibold text-gray-900 mb-2 ${
                    isDone || isSkipped ? 'line-through text-gray-500' : ''
                  } ${isLearning ? 'underline' : ''}`}>
                    {nodeData.title}
                  </h2>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {nodeData.duration && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{nodeData.duration}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Progress indicator for learning */}
              {isLearning && (
                <div className="h-1 bg-purple-500 animate-pulse" />
              )}
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-8">
              {/* Description */}
              {nodeData.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    Mô tả
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {nodeData.description}
                  </p>
                </div>
              )}

              {/* Technologies with roadmap.sh style */}
              {nodeData.technologies && nodeData.technologies.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Code className="w-4 h-4 text-gray-500" />
                    Công nghệ liên quan
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {nodeData.technologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors cursor-default"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Keyboard shortcuts guide */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Phím tắt</h4>
                <div className="space-y-1.5 text-xs text-blue-700">
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-[10px] font-mono">Right-click</kbd>
                    <span>Đánh dấu hoàn thành</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-[10px] font-mono">Shift + Click</kbd>
                    <span>Đánh dấu đang học</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-[10px] font-mono">Alt + Click</kbd>
                    <span>Đánh dấu bỏ qua</span>
                  </div>
                </div>
              </div>

              {/* Learning Contents */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Play className="w-4 h-4 text-gray-500" />
                  Nội dung học tập
                </h3>
                <div className="space-y-3">
                  {learningContents.map((content, index) => (
                    <motion.div
                      key={content.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group p-3 rounded-xl border transition-all cursor-pointer ${
                        isDone 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-white border-gray-200 hover:border-yellow-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Status indicator */}
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          isDone 
                            ? 'bg-gray-400 text-white' 
                            : 'bg-yellow-100 text-yellow-700 group-hover:bg-yellow-200'
                        }`}>
                          {isDone ? (
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          ) : (
                            getContentIcon(content.type)
                          )}
                        </div>
                        
                        {/* Content info */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium transition-colors ${
                            isDone 
                              ? 'text-gray-500 line-through' 
                              : 'text-gray-900 group-hover:text-yellow-700'
                          }`}>
                            {content.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            {content.duration && (
                              <span className="text-xs text-gray-500">
                                {content.duration}
                              </span>
                            )}
                            <span className="text-xs capitalize text-gray-400">
                              {content.type === 'video' && 'Video'}
                              {content.type === 'article' && 'Bài đọc'}
                              {content.type === 'practice' && 'Thực hành'}
                              {content.type === 'quiz' && 'Quiz'}
                            </span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-colors ${
                          isDone 
                            ? 'text-gray-300' 
                            : 'text-gray-300 group-hover:text-yellow-500'
                        }`} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Resources Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                  Tài nguyên bổ sung
                </h3>
                <div className="space-y-2">
                  <a 
                    href="#" 
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-yellow-50 transition-colors group border border-transparent hover:border-yellow-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-700">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-yellow-700 transition-colors">
                        Tài liệu chính thức
                      </p>
                      <p className="text-xs text-gray-500">docs.example.com</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                  <a 
                    href="#" 
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors group border border-transparent hover:border-purple-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                      <Play className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-purple-700 transition-colors">
                        Video hướng dẫn
                      </p>
                      <p className="text-xs text-gray-500">youtube.com</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                </div>
              </div>
            </div>

            {/* Action Buttons - Roadmap.sh style */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              {nodeData.status === 'locked' ? (
                <button
                  disabled
                  className="w-full py-3 text-sm font-medium text-gray-400 bg-gray-100 rounded-xl cursor-not-allowed"
                >
                  🔒 Đã khóa - Hoàn thành các bước trước
                </button>
              ) : (
                <div className="space-y-2">
                  {/* Main action button */}
                  <button
                    onClick={() => onToggleComplete && onToggleComplete(nodeData.id, !isDone)}
                    className={`w-full py-3 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${
                      isDone
                        ? 'text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200'
                        : 'text-white bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isDone ? (
                      <>
                        <Circle className="w-4 h-4" />
                        <span>Bỏ đánh dấu hoàn thành</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Đánh dấu hoàn thành</span>
                      </>
                    )}
                  </button>
                  
                  {/* Secondary button - Start learning */}
                  {!isDone && !isLearning && (
                    <button
                      onClick={() => onToggleComplete && onToggleComplete(nodeData.id, false)}
                      className="w-full py-3 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200"
                    >
                      <BookMarked className="w-4 h-4" />
                      <span>Bắt đầu học</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RoadmapDetailModal;
