"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Clock,
  Target,
  Trash2,
  ChevronRight,
  Loader2,
  MapPin,
  Brain,
  Sparkles,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import PageContainer from '@/components/PageContainer';

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

  // Login Required State
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Brain className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Đăng nhập để tiếp tục</h2>
          <p className="text-gray-500 text-sm mb-6">
            Vui lòng đăng nhập để xem các lộ trình AI của bạn
          </p>
          <Link href="/auth/login">
            <Button className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg font-medium">
              Đăng nhập
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100">
        <PageContainer size="lg" className="py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/roadmap" className="hover:text-gray-900 transition-colors">
              Lộ trình
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Lộ trình của tôi</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Lộ trình của tôi
              </h1>
              <p className="text-gray-500 text-sm">
                Quản lý và theo dõi tiến độ các lộ trình học tập AI
              </p>
            </div>
            <Link href="/roadmap/generate">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium">
                <Plus className="w-4 h-4" />
                Tạo lộ trình mới
              </Button>
            </Link>
          </div>
        </PageContainer>
      </div>

      {/* Content Section */}
      <PageContainer size="lg" className="py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-3" />
            <span className="text-gray-500 text-sm">Đang tải lộ trình...</span>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <Target className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-gray-900 font-medium mb-2">Đã xảy ra lỗi</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <Button onClick={fetchRoadmaps} variant="outline" className="font-medium">
              Thử lại
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && roadmaps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Chưa có lộ trình nào
            </h2>
            <p className="text-gray-500 text-sm text-center max-w-sm mb-6">
              Tạo lộ trình học tập đầu tiên với AI để bắt đầu hành trình phát triển kỹ năng
            </p>
            <Link href="/roadmap/generate">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium">
                <Sparkles className="w-4 h-4" />
                Tạo lộ trình đầu tiên
              </Button>
            </Link>
          </div>
        )}

        {/* Roadmap List */}
        {!isLoading && !error && roadmaps.length > 0 && (
          <div className="space-y-4">
            {/* Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">{roadmaps.length}</div>
                <div className="text-sm text-gray-500">Tổng lộ trình</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="text-2xl font-bold text-indigo-600">
                  {roadmaps.filter(r => r.progress_percentage === 100).length}
                </div>
                <div className="text-sm text-gray-500">Đã hoàn thành</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">
                  {roadmaps.filter(r => r.progress_percentage > 0 && r.progress_percentage < 100).length}
                </div>
                <div className="text-sm text-gray-500">Đang học</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">
                  {roadmaps.reduce((acc, r) => acc + r.total_nodes, 0)}
                </div>
                <div className="text-sm text-gray-500">Tổng chủ đề</div>
              </div>
            </div>

            {/* Roadmap Cards */}
            <div className="space-y-3">
              {roadmaps.map((roadmap) => (
                <div
                  key={roadmap.id}
                  className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                        <BookOpen className="w-6 h-6 text-indigo-600" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <Link href={`/roadmap/my/${roadmap.id}`}>
                              <h3 className="text-base font-semibold text-gray-900 hover:text-indigo-600 transition-colors truncate">
                                {roadmap.title}
                              </h3>
                            </Link>
                            {roadmap.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                {roadmap.description}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <Link href={`/roadmap/my/${roadmap.id}`}>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-gray-700 border-gray-200 hover:bg-gray-50 font-medium"
                              >
                                Tiếp tục
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(roadmap.id)}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Meta & Progress */}
                        <div className="mt-4 flex items-center gap-6">
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <Target className="w-4 h-4" />
                              <span>{roadmap.total_nodes} chủ đề</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              <span>{formatDate(roadmap.created_at)}</span>
                            </div>
                          </div>
                          
                          {/* Progress */}
                          <div className="flex-1 flex items-center gap-3">
                            <Progress 
                              value={roadmap.progress_percentage} 
                              className="h-1.5 flex-1 bg-gray-100" 
                            />
                            <span className={`text-sm font-medium ${
                              roadmap.progress_percentage === 100 
                                ? 'text-green-600' 
                                : roadmap.progress_percentage > 0 
                                  ? 'text-indigo-600' 
                                  : 'text-gray-400'
                            }`}>
                              {roadmap.progress_percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
