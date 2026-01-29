"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Clock,
  Target,
  Trash2,
  ChevronRight,
  Loader2,
  MapPin,
  Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';

interface RoadmapSummary {
  id: string;
  title: string;
  description: string | null;
  total_nodes: number;
  completed_nodes: number;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export default function MyRoadmapsPage() {
  const { user, isAuthenticated } = useAuth();
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRoadmaps();
    }
  }, [isAuthenticated]);

  const fetchRoadmaps = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ai-roadmap/my', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setRoadmaps(data.data);
      } else {
        setError(data.error || 'Failed to fetch roadmaps');
      }
    } catch (err) {
      console.error('Error fetching roadmaps:', err);
      setError('Không thể tải danh sách lộ trình');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (roadmapId: string) => {
    if (!confirm('Bạn có chắc muốn xóa lộ trình này?')) return;

    try {
      const response = await fetch(`/api/ai-roadmap/${roadmapId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setRoadmaps(prev => prev.filter(r => r.id !== roadmapId));
      }
    } catch (err) {
      console.error('Error deleting roadmap:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Đăng nhập để xem lộ trình</h2>
          <p className="text-gray-600 mb-6">Bạn cần đăng nhập để xem các lộ trình AI của mình</p>
          <Link href="/auth/login">
            <Button className="bg-indigo-600 hover:bg-indigo-700">Đăng nhập</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/roadmap"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Lộ trình AI của tôi</h1>
                <p className="text-gray-500">Quản lý các lộ trình học tập được AI tạo riêng cho bạn</p>
              </div>
            </div>
            <Link href="/roadmap/generate">
              <Button className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Tạo lộ trình mới
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500">{error}</p>
            <Button onClick={fetchRoadmaps} className="mt-4">
              Thử lại
            </Button>
          </div>
        ) : roadmaps.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-10 h-10 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Chưa có lộ trình nào
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Tạo lộ trình học tập đầu tiên của bạn với AI để bắt đầu hành trình học tập
            </p>
            <Link href="/roadmap/generate">
              <Button className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                Tạo lộ trình đầu tiên
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {roadmaps.map((roadmap, index) => (
              <motion.div
                key={roadmap.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      {/* Progress Indicator */}
                      <div className="w-2 bg-gradient-to-b from-indigo-500 to-purple-500" />
                      
                      {/* Content */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Link href={`/roadmap/my/${roadmap.id}`}>
                              <h3 className="text-lg font-bold text-gray-900 hover:text-indigo-600 transition-colors mb-1">
                                {roadmap.title}
                              </h3>
                            </Link>
                            {roadmap.description && (
                              <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                                {roadmap.description}
                              </p>
                            )}

                            {/* Stats */}
                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <div className="flex items-center gap-1.5">
                                <Target className="w-4 h-4" />
                                <span>{roadmap.total_nodes} topics</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                <span>{formatDate(roadmap.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Progress Circle & Actions */}
                          <div className="flex items-center gap-4 ml-6">
                            {/* Progress Circle */}
                            <div className="relative w-16 h-16">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="28"
                                  fill="none"
                                  stroke="#e5e7eb"
                                  strokeWidth="5"
                                />
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="28"
                                  fill="none"
                                  stroke="#6366f1"
                                  strokeWidth="5"
                                  strokeLinecap="round"
                                  strokeDasharray={`${roadmap.progress_percentage * 1.76} 176`}
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold text-gray-900">
                                  {roadmap.progress_percentage}%
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <Link href={`/roadmap/my/${roadmap.id}`}>
                                <Button variant="outline" size="sm" className="flex items-center gap-1">
                                  Xem
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(roadmap.id)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>{roadmap.completed_nodes} / {roadmap.total_nodes} hoàn thành</span>
                            <span>{roadmap.progress_percentage}%</span>
                          </div>
                          <Progress value={roadmap.progress_percentage} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
