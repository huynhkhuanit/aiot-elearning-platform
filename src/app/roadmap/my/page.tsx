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
  Brain,
  Sparkles,
  BookOpen,
  Layout,
  Server,
  Database,
  Smartphone,
  Cloud,
  Code,
  Cpu,
  MapPin,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

// Function to determine icon and color based on title keywords
const getRoadmapStyle = (title: string) => {
  const t = title.toLowerCase();
  
  if (t.includes('react') || t.includes('frontend') || t.includes('vue') || t.includes('angular') || t.includes('web') || t.includes('javascript') || t.includes('typescript') || t.includes('html') || t.includes('css') || t.includes('ui')) {
    return { icon: Layout, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', progress: 'bg-blue-500' };
  }
  if (t.includes('node') || t.includes('backend') || t.includes('api') || t.includes('java') || t.includes('golang') || t.includes('spring') || t.includes('dotnet') || t.includes('c#')) {
    return { icon: Server, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', progress: 'bg-emerald-500' };
  }
  if (t.includes('data') || t.includes('sql') || t.includes('db') || t.includes('mongo') || t.includes('postgres') || t.includes('mysql')) {
    return { icon: Database, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', progress: 'bg-cyan-500' };
  }
  if (t.includes('mobile') || t.includes('android') || t.includes('ios') || t.includes('flutter') || t.includes('swift') || t.includes('kotlin')) {
    return { icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', progress: 'bg-purple-500' };
  }
  if (t.includes('cloud') || t.includes('aws') || t.includes('azure') || t.includes('devops') || t.includes('docker') || t.includes('kube') || t.includes('deploy')) {
    return { icon: Cloud, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', progress: 'bg-orange-500' };
  }
  if (t.includes('python') || t.includes('ai') || t.includes('ml') || t.includes('machine') || t.includes('intelligen') || t.includes('gpt') || t.includes('deep')) {
    return { icon: Brain, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200', progress: 'bg-pink-500' };
  }
  if (t.includes('c++') || t.includes('rust') || t.includes('embedded') || t.includes('system') || t.includes('linux')) {
    return { icon: Cpu, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', progress: 'bg-red-500' };
  }
  
  return { icon: Code, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', progress: 'bg-indigo-500' };
};

export default function MyRoadmapsPage() {
  const { isAuthenticated } = useAuth();
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

  const handleDelete = async (e: React.MouseEvent, roadmapId: string) => {
    e.preventDefault();
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-7 h-7 text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Đăng nhập để tiếp tục</h2>
          <p className="text-gray-500 text-sm mb-4">
            Vui lòng đăng nhập để xem các lộ trình AI của bạn
          </p>
          <Link href="/auth/login">
            <Button className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2 rounded-lg font-medium text-sm">
              Đăng nhập
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100">
        <PageContainer size="lg" className="py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <Link href="/roadmap" className="hover:text-gray-900 transition-colors flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>Lộ trình</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <span className="text-gray-700 font-medium">Của tôi</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Lộ trình của tôi</h1>
              <p className="text-gray-500 text-sm">Quản lý tiến độ và kỹ năng của bạn</p>
            </div>
            <Link href="/roadmap/generate">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm">
                <Plus className="w-4 h-4" />
                Tạo lộ trình
              </Button>
            </Link>
          </div>
        </PageContainer>
      </div>

      {/* Content Section */}
      <PageContainer size="lg" className="py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300 mb-3" />
            <span className="text-gray-400 text-sm">Đang tải...</span>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-3">
              <Target className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-gray-900 font-semibold mb-1">Đã xảy ra lỗi</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <Button onClick={fetchRoadmaps} variant="outline" size="sm">
              Thử lại
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && roadmaps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-gray-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Chưa có lộ trình</h2>
            <p className="text-gray-500 text-sm text-center max-w-sm mb-5">
              Bắt đầu tạo lộ trình học tập được cá nhân hóa bởi AI
            </p>
            <Link href="/roadmap/generate">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 px-5 py-2 rounded-lg font-medium text-sm">
                <Plus className="w-4 h-4" />
                Tạo lộ trình đầu tiên
              </Button>
            </Link>
          </div>
        )}

        {/* Roadmap List */}
        {!isLoading && !error && roadmaps.length > 0 && (
          <div className="space-y-5">
            {/* Stats Summary - Compact inline */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600"><strong className="text-gray-900">{roadmaps.length}</strong> lộ trình</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100">
                <Target className="w-4 h-4 text-green-500" />
                <span className="text-gray-600"><strong className="text-gray-900">{roadmaps.filter(r => r.progress_percentage === 100).length}</strong> hoàn thành</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-gray-600"><strong className="text-gray-900">{roadmaps.filter(r => r.progress_percentage > 0 && r.progress_percentage < 100).length}</strong> đang học</span>
              </div>
            </div>

            {/* Roadmap Grid - Compact cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {roadmaps.map((roadmap) => {
                const style = getRoadmapStyle(roadmap.title);
                const Icon = style.icon;
                
                return (
                  <div key={roadmap.id} className="relative group">
                    <Link href={`/roadmap/my/${roadmap.id}`} className="block h-full">
                      <div className={`bg-white rounded-xl border ${style.border} h-full transition-shadow hover:shadow-md overflow-hidden`}>
                        <div className="p-4">
                          {/* Header */}
                          <div className="flex items-start gap-2.5 mb-3">
                            <div className={`w-9 h-9 rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <Icon className={`w-[18px] h-[18px] ${style.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[14px] font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                {roadmap.title}
                              </div>
                              <div className="text-[10px] text-gray-500 truncate mt-0.5 font-medium">
                                {roadmap.description || `Lộ trình học tập ${roadmap.title}`}
                              </div>
                            </div>
                          </div>

                          {/* Meta */}
                          <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-4">
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {roadmap.total_nodes} CHỦ ĐỀ
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(roadmap.created_at)}
                            </span>
                          </div>

                          {/* Progress */}
                          <div className="mt-auto">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Tiến độ</span>
                              <span className={`text-[11px] font-bold ${style.color}`}>
                                {roadmap.progress_percentage}%
                              </span>
                            </div>
                            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${style.progress} transition-all duration-500`} 
                                style={{ width: `${roadmap.progress_percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(e, roadmap.id)}
                      className="absolute top-2 right-2 w-7 h-7 text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
}

