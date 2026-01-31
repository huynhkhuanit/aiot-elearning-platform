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
import { motion } from 'framer-motion';

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
  
  // Frontend Group (Blue)
  if (t.includes('react') || t.includes('frontend') || t.includes('vue') || t.includes('angular') || t.includes('web') || t.includes('javascript') || t.includes('typescript') || t.includes('html') || t.includes('css') || t.includes('ui')) {
    return { icon: Layout, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', progress: 'bg-blue-600' };
  }
  // Backend Group (Emerald) - Check javascript first to avoid overlaps
  if (t.includes('node') || t.includes('backend') || t.includes('api') || t.includes('java') || t.includes('golang') || t.includes('spring') || t.includes('dotnet') || t.includes('c#')) {
    return { icon: Server, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', progress: 'bg-emerald-600' };
  }
  // Data/DB Group (Cyan)
  if (t.includes('data') || t.includes('sql') || t.includes('db') || t.includes('mongo') || t.includes('postgres') || t.includes('mysql')) {
    return { icon: Database, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100', progress: 'bg-cyan-600' };
  }
  // Mobile Group (Purple)
  if (t.includes('mobile') || t.includes('android') || t.includes('ios') || t.includes('flutter') || t.includes('swift') || t.includes('kotlin')) {
    return { icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', progress: 'bg-purple-600' };
  }
  // Cloud/DevOps Group (Orange)
  if (t.includes('cloud') || t.includes('aws') || t.includes('azure') || t.includes('devops') || t.includes('docker') || t.includes('kube') || t.includes('deploy')) {
    return { icon: Cloud, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', progress: 'bg-orange-600' };
  }
  // AI/ML Group (Pink)
  if (t.includes('python') || t.includes('ai') || t.includes('ml') || t.includes('machine') || t.includes('intelligen') || t.includes('gpt') || t.includes('deep')) {
    return { icon: Brain, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100', progress: 'bg-pink-600' };
  }
  // Low-level/Systems Group (Red)
  if (t.includes('c++') || t.includes('rust') || t.includes('embedded') || t.includes('system') || t.includes('linux')) {
    return { icon: Cpu, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', progress: 'bg-red-600' };
  }
  
  // Default generic tech style (Indigo)
  return { icon: Code, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', progress: 'bg-indigo-600' };
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
    <div className="min-h-screen bg-gray-50/50 font-sans">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-xl bg-white/80">
        <PageContainer size="lg" className="py-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Link href="/roadmap" className="hover:text-gray-900 transition-colors flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>Lộ trình</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-gray-900 font-medium bg-gray-100 px-2 py-0.5 rounded-md text-xs">Của tôi</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Lộ trình của tôi
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Quản lý tiến độ học tập và phát triển kỹ năng của bạn
              </p>
            </div>
            <Link href="/roadmap/generate">
              <Button className="bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 text-white shadow-lg shadow-gray-200/50 flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all hover:-translate-y-0.5">
                <Plus className="w-4 h-4" />
                Tạo lộ trình mới
              </Button>
            </Link>
          </div>
        </PageContainer>
      </div>

      {/* Content Section */}
      <PageContainer size="lg" className="py-10">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-gray-300 mb-4" />
            <span className="text-gray-400 font-medium">Đang tải dữ liệu...</span>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-gray-900 font-bold mb-2 text-lg">Đã xảy ra lỗi</p>
            <p className="text-gray-500 mb-6">{error}</p>
            <Button onClick={fetchRoadmaps} variant="outline" className="font-medium">
              Thử lại ngay
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && roadmaps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Sparkles className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Chưa có lộ trình nào
            </h2>
            <p className="text-gray-500 text-center max-w-md mb-8 leading-relaxed">
              Hãy bắt đầu hành trình chinh phục công nghệ bằng cách tạo lộ trình học tập đầu tiên được cá nhân hóa bởi AI.
            </p>
            <Link href="/roadmap/generate">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-8 py-3 rounded-xl font-semibold shadow-xl shadow-indigo-100 transition-all hover:-translate-y-0.5">
                <Plus className="w-5 h-5" />
                Tạo lộ trình đầu tiên
              </Button>
            </Link>
          </div>
        )}

        {/* Roadmap List */}
        {!isLoading && !error && roadmaps.length > 0 && (
          <div className="space-y-8">
            {/* Stats Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Tổng lộ trình', value: roadmaps.length, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Đã hoàn thành', value: roadmaps.filter(r => r.progress_percentage === 100).length, icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Đang học', value: roadmaps.filter(r => r.progress_percentage > 0 && r.progress_percentage < 100).length, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Tổng chủ đề', value: roadmaps.reduce((acc, r) => acc + r.total_nodes, 0), icon: Layout, color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hidden sm:flex">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</div>
                  </div>
                </div>
              ))}
              {/* Mobile Stats (Simplified) */}
              <div className="col-span-2 sm:hidden grid grid-cols-2 gap-3">
                 <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="text-2xl font-bold text-gray-900">{roadmaps.length}</div>
                    <div className="text-xs text-gray-500">Tổng lộ trình</div>
                 </div>
                 <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="text-2xl font-bold text-green-600">{roadmaps.filter(r => r.progress_percentage === 100).length}</div>
                    <div className="text-xs text-gray-500">Hoàn thành</div>
                 </div>
              </div>
            </div>

            {/* Roadmap Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roadmaps.map((roadmap, index) => {
                const style = getRoadmapStyle(roadmap.title);
                const Icon = style.icon;
                
                return (
                  <motion.div
                    key={roadmap.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative group"
                  >
                    <Link href={`/roadmap/my/${roadmap.id}`} className="block h-full">
                      <div className={`bg-white rounded-2xl border ${style.border} h-full transition-all duration-300 hover:shadow-xl hover:shadow-gray-100 hover:-translate-y-1 overflow-hidden flex flex-col`}>
                        <div className="p-6 flex-1 flex flex-col">
                          {/* Card Header */}
                          <div className="mb-5">
                            <div className={`w-14 h-14 rounded-2xl ${style.bg} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                              <Icon className={`w-7 h-7 ${style.color}`} />
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="mb-6 flex-1 text-left">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                              {roadmap.title}
                            </h3>
                            <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed h-10">
                              {roadmap.description || `Lộ trình học tập ${roadmap.title} chi tiết.`}
                            </p>
                          </div>

                          {/* Meta Info */}
                          <div className="flex items-center gap-4 text-xs font-medium text-gray-400 mb-6">
                            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md">
                              <Target className="w-3.5 h-3.5" />
                              <span>{roadmap.total_nodes} topics</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatDate(roadmap.created_at)}</span>
                            </div>
                          </div>

                          {/* Progress Section (Always at bottom) */}
                          <div className="mt-auto">
                            <div className="flex items-end justify-between mb-2">
                              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tiến độ</span>
                              <span className={`text-sm font-bold ${style.color}`}>
                                {roadmap.progress_percentage}%
                              </span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${style.progress} transition-all duration-500 ease-out`} 
                                style={{ width: `${roadmap.progress_percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Footer Action */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 group-hover:bg-gray-50/80 transition-colors flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900">Xem chi tiết</span>
                          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-all">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* Delete Button (Absolutely Positioned) */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(e, roadmap.id)}
                      className="absolute top-5 right-5 z-20 text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
