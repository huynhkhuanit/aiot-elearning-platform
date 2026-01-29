"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Brain, Target, Clock, Zap } from 'lucide-react';
import Link from 'next/link';
import OnboardingForm from '@/components/AIRoadmap/OnboardingForm';
import type { UserProfile } from '@/types/ai-roadmap';
import { useAuth } from '@/contexts/AuthContext';

export default function GenerateRoadmapPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const handleSubmit = async (profile: UserProfile) => {
    if (!isAuthenticated) {
      setError('Vui lòng đăng nhập để tạo lộ trình');
      return;
    }

    setIsLoading(true);
    setError(null);
    setWarning(null);

    try {
      const response = await fetch('/api/ai-roadmap/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ profile }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Không thể tạo lộ trình');
      }

      // Show warning if exists (e.g., database not set up)
      if (data.warning) {
        setWarning(data.warning);
        // Still proceed to show roadmap
      }

      // If temp ID, save to localStorage for viewing
      if (data.data.id.startsWith('temp-')) {
        const tempRoadmap = {
          id: data.data.id,
          ...data.data,
          saved_at: new Date().toISOString(),
        };
        localStorage.setItem(`temp-roadmap-${data.data.id}`, JSON.stringify(tempRoadmap));
      }

      // Redirect to the generated roadmap (even if temp ID)
      router.push(`/roadmap/my/${data.data.id}`);
    } catch (err) {
      console.error('Error generating roadmap:', err);
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/roadmap" 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Quay lại</span>
            </Link>
            <div className="flex items-center gap-2 text-indigo-600">
              <Brain className="w-5 h-5" />
              <span className="font-semibold">AI Roadmap Generator</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-5 gap-12 items-start">
          {/* Left Side - Info */}
          <div className="lg:col-span-2 lg:sticky lg:top-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Powered by AI
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Tạo lộ trình học tập
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"> cá nhân hóa</span>
              </h1>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                AI sẽ phân tích mục tiêu và trình độ của bạn để tạo ra lộ trình học tập 
                chi tiết, phù hợp với thời gian và phong cách học của bạn.
              </p>

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Cá nhân hóa 100%</h3>
                    <p className="text-sm text-gray-500">Lộ trình được tạo riêng dựa trên profile của bạn</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Phù hợp thời gian</h3>
                    <p className="text-sm text-gray-500">Tự động điều chỉnh theo thời gian bạn có</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Tạo nhanh chóng</h3>
                    <p className="text-sm text-gray-500">Chỉ mất 15-30 giây để tạo lộ trình hoàn chỉnh</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Side - Form */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {!isAuthenticated ? (
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Brain className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Đăng nhập để bắt đầu
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Bạn cần đăng nhập để AI có thể lưu và theo dõi tiến độ lộ trình của bạn
                  </p>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Đăng nhập ngay
                  </Link>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <span className="text-red-600 font-semibold">⚠️ Lỗi:</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-red-700 font-medium">{error}</p>
                          {error.includes('quota') && (
                            <div className="mt-2 text-sm text-red-600">
                              <p className="font-semibold mb-1">Giải pháp:</p>
                              <ul className="list-disc list-inside space-y-1">
                                <li>Kiểm tra OpenAI billing tại <a href="https://platform.openai.com/account/billing" target="_blank" rel="noopener" className="underline">platform.openai.com</a></li>
                                <li>Sử dụng API key khác có quota</li>
                                <li>Chờ quota reset (thường là hàng tháng)</li>
                              </ul>
                            </div>
                          )}
                          {error.includes('FastAPI') && (
                            <div className="mt-2 text-sm text-red-600">
                              <p className="font-semibold mb-1">Giải pháp:</p>
                              <ul className="list-disc list-inside space-y-1">
                                <li>Kiểm tra FastAPI service đã chạy chưa: <code className="bg-red-100 px-1 rounded">cd ai-service && python main.py</code></li>
                                <li>Kiểm tra port 8000 có bị chiếm không</li>
                                <li>Kiểm tra <code className="bg-red-100 px-1 rounded">FASTAPI_BASE_URL</code> trong .env.local</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {warning && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <span className="text-yellow-600 font-semibold">ℹ️ Lưu ý:</span>
                        <p className="text-yellow-700 flex-1">{warning}</p>
                      </div>
                    </div>
                  )}
                  <OnboardingForm onSubmit={handleSubmit} isLoading={isLoading} />
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
