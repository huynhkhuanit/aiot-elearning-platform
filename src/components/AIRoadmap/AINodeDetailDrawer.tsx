"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  Clock,
  ExternalLink,
  Youtube,
  Search,
  BookOpen,
  Code,
  Wrench,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { RoadmapNode, NodeStatus, RecommendedCourse } from '@/types/ai-roadmap';

interface AINodeDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  node: RoadmapNode | null;
  status: NodeStatus;
  onMarkComplete: (nodeId: string) => void;
}

export default function AINodeDetailDrawer({
  isOpen,
  onClose,
  node,
  status,
  onMarkComplete,
}: AINodeDetailDrawerProps) {
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // Fetch recommended courses when drawer opens
  useEffect(() => {
    if (isOpen && node) {
      fetchRecommendedCourses();
    }
  }, [isOpen, node]);

  const fetchRecommendedCourses = async () => {
    if (!node) return;

    setIsLoadingCourses(true);
    try {
      const keywords = node.data.learning_resources.keywords;
      const response = await fetch(`/api/courses?search=${keywords.join(' ')}&limit=3`);
      const data = await response.json();

      if (data.data) {
        setRecommendedCourses(data.data.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  if (!node) return null;

  const { data } = node;
  const keywords = data.learning_resources.keywords;

  // Generate search URLs
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(keywords.join(' '))}`;
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(keywords.join(' '))}`;

  // Get type info
  const getTypeInfo = () => {
    switch (node.type) {
      case 'core':
        return { label: 'Kiến thức cốt lõi', icon: <BookOpen className="w-4 h-4" />, color: 'bg-indigo-100 text-indigo-700' };
      case 'optional':
        return { label: 'Kiến thức tùy chọn', icon: <BookOpen className="w-4 h-4" />, color: 'bg-slate-100 text-slate-700' };
      case 'project':
        return { label: 'Dự án thực hành', icon: <Wrench className="w-4 h-4" />, color: 'bg-amber-100 text-amber-700' };
      default:
        return { label: 'Topic', icon: <Code className="w-4 h-4" />, color: 'bg-gray-100 text-gray-700' };
    }
  };

  // Get difficulty info
  const getDifficultyInfo = () => {
    switch (data.difficulty) {
      case 'beginner':
        return { label: 'Cơ bản', color: 'bg-green-100 text-green-700' };
      case 'intermediate':
        return { label: 'Trung cấp', color: 'bg-yellow-100 text-yellow-700' };
      case 'advanced':
        return { label: 'Nâng cao', color: 'bg-red-100 text-red-700' };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const typeInfo = getTypeInfo();
  const difficultyInfo = getDifficultyInfo();

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
            className="fixed inset-0 bg-black/20 z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-[70] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
              <div className="px-6 py-5">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>

                <div className="pr-10">
                  {/* Type & Difficulty Badges */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                      {typeInfo.icon}
                      {typeInfo.label}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${difficultyInfo.color}`}>
                      {difficultyInfo.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {data.label}
                  </h2>

                  {/* Estimated Time */}
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Thời gian ước tính: {data.estimated_hours} giờ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Mô tả
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {data.description}
                </p>
              </div>

              {/* Keywords */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Từ khóa tìm kiếm
                </h3>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* External Search Links */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Tìm tài liệu học
                </h3>
                <div className="space-y-2">
                  <a
                    href={googleSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        <Search className="w-5 h-5 text-blue-500" />
                      </div>
                      <span className="font-medium text-gray-700">Tìm trên Google</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </a>

                  <a
                    href={youtubeSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        <Youtube className="w-5 h-5 text-red-500" />
                      </div>
                      <span className="font-medium text-gray-700">Tìm trên YouTube</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </a>
                </div>
              </div>

              {/* Recommended Courses */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Khóa học liên quan
                </h3>
                
                {isLoadingCourses ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  </div>
                ) : recommendedCourses.length > 0 ? (
                  <div className="space-y-2">
                    {recommendedCourses.map((course) => (
                      <a
                        key={course.id}
                        href={`/courses/${course.slug}`}
                        className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-indigo-50 rounded-xl transition-colors group"
                      >
                        {course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-indigo-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate group-hover:text-indigo-600">
                            {course.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {course.level === 'BEGINNER' ? 'Cơ bản' :
                             course.level === 'INTERMEDIATE' ? 'Trung cấp' : 'Nâng cao'}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-xl">
                    Chưa có khóa học phù hợp
                  </p>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
              <Button
                onClick={() => onMarkComplete(node.id)}
                className={`w-full py-3 flex items-center justify-center gap-2 ${
                  status === 'completed'
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {status === 'completed' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Đã hoàn thành</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Đánh dấu hoàn thành</span>
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
