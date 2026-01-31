"use client";

import { useState } from "react";
import { 
  Code, Database, Layout, Smartphone, Server, Cloud, 
  ArrowRight, Star, Users, Clock, Zap, CheckCircle,
  Trophy, Target, Shield, Globe, Brain, Sparkles,
  Plus, X, Map, FolderOpen
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import PageContainer from "@/components/PageContainer";
import Badge from "@/components/Badge";

// Roadmap Data Summary
const roadmaps = [
  {
    id: "frontend",
    title: "Front-end Developer",
    description: "Làm chủ giao diện web với HTML, CSS, JS và React.",
    icon: Layout,
    color: "blue",
    gradient: "from-blue-600 to-indigo-600",
    bgGradient: "from-blue-50 to-indigo-50",
    stats: { courses: 8, duration: "8-12 tháng", students: "45k+" },
    tags: ["React", "Next.js", "Tailwind"]
  },
  {
    id: "backend",
    title: "Back-end Developer",
    description: "Xây dựng hệ thống vững chắc với Node.js và Database.",
    icon: Server,
    color: "purple",
    gradient: "from-purple-600 to-violet-600",
    bgGradient: "from-purple-50 to-violet-50",
    stats: { courses: 10, duration: "10-15 tháng", students: "32k+" },
    tags: ["Node.js", "MySQL", "Microservices"]
  },
  {
    id: "fullstack",
    title: "Full-stack Developer",
    description: "Trở thành lập trình viên toàn diện, cân mọi dự án.",
    icon: Database,
    color: "indigo",
    gradient: "from-indigo-600 to-blue-600",
    bgGradient: "from-indigo-50 to-blue-50",
    stats: { courses: 15, duration: "12-18 tháng", students: "28k+" },
    tags: ["MERN Stack", "DevOps", "System Design"]
  },
  {
    id: "mobile",
    title: "Mobile Developer",
    description: "Phát triển ứng dụng đa nền tảng với React Native.",
    icon: Smartphone,
    color: "green",
    gradient: "from-emerald-600 to-teal-600",
    bgGradient: "from-emerald-50 to-teal-50",
    stats: { courses: 12, duration: "8-12 tháng", students: "22k+" },
    tags: ["React Native", "iOS", "Android"]
  },
  {
    id: "devops",
    title: "DevOps Engineer",
    description: "Vận hành, triển khai và tự động hóa hệ thống.",
    icon: Cloud,
    color: "red",
    gradient: "from-red-600 to-orange-600",
    bgGradient: "from-red-50 to-orange-50",
    stats: { courses: 14, duration: "10-15 tháng", students: "18k+" },
    tags: ["AWS", "Docker", "Kubernetes"]
  }
];

const features = [
  {
    title: "Lộ trình bài bản",
    description: "Được thiết kế bởi các chuyên gia hàng đầu, đi từ cơ bản đến nâng cao.",
    icon: Target,
    color: "text-blue-600",
    bg: "bg-blue-100"
  },
  {
    title: "Dự án thực tế",
    description: "Học đi đôi với hành qua các dự án thực tế sau mỗi giai đoạn.",
    icon: Trophy,
    color: "text-yellow-600",
    bg: "bg-yellow-100"
  },
  {
    title: "Chứng chỉ uy tín",
    description: "Nhận chứng chỉ hoàn thành được công nhận bởi các doanh nghiệp.",
    icon: Shield,
    color: "text-green-600",
    bg: "bg-green-100"
  },
  {
    title: "Cộng đồng hỗ trợ",
    description: "Tham gia cộng đồng học tập sôi nổi, giải đáp thắc mắc 24/7.",
    icon: Globe,
    color: "text-purple-600",
    bg: "bg-purple-100"
  }
];

export default function RoadmapPage() {
  const [isFabOpen, setIsFabOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
        <PageContainer size="lg" className="py-16 lg:py-20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
            {/* Left Content */}
            <div className="lg:max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                <Star className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-indigo-300">
                  Lộ trình chuẩn 2025
                </span>
              </div>
              
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                Định hướng sự nghiệp <br className="hidden lg:block" />
                <span className="text-indigo-400">công nghệ</span> của bạn
              </h1>
              
              <p className="text-gray-400 text-base lg:text-lg mb-8 leading-relaxed">
                Hệ thống lộ trình học tập được thiết kế bài bản, giúp bạn phát triển từ cơ bản đến chuyên gia.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Link href="/roadmap/generate">
                  <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Tạo lộ trình AI
                  </button>
                </Link>
                <Link href="/roadmap/my">
                  <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-lg transition-colors border border-white/10 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Lộ trình của tôi
                  </button>
                </Link>
              </div>
            </div>
            
            {/* Right Stats */}
            <div className="grid grid-cols-3 gap-6 lg:gap-8">
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">5+</div>
                <div className="text-sm text-gray-400">Lộ trình chuẩn</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-indigo-400 mb-1">AI</div>
                <div className="text-sm text-gray-400">Cá nhân hóa</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">100k+</div>
                <div className="text-sm text-gray-400">Học viên</div>
              </div>
            </div>
          </div>
        </PageContainer>
      </div>

      {/* Roadmaps Grid */}
      <PageContainer size="lg" className="py-16 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Lộ trình học tập</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Các lộ trình được thiết kế bởi chuyên gia hoặc tạo lộ trình cá nhân hóa với AI
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Standard Roadmap Cards */}

          {roadmaps.map((roadmap, index) => (
            <motion.div
              key={roadmap.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/roadmap/${roadmap.id}`} className="block h-full group">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                  {/* Hover Gradient Border Effect */}
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${roadmap.gradient} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
                  
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${roadmap.bgGradient} flex items-center justify-center text-${roadmap.color}-600 group-hover:scale-110 transition-transform duration-300`}>
                      <roadmap.icon className="w-7 h-7" />
                    </div>
                    <div className="bg-gray-50 px-3 py-1 rounded-full text-xs font-semibold text-gray-500 group-hover:bg-gray-100 transition-colors">
                      {roadmap.stats.students} học viên
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {roadmap.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                    {roadmap.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {roadmap.tags.map((tag, i) => (
                      <span key={i} className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-50 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1.5" />
                      {roadmap.stats.duration}
                    </div>
                    <div className="flex items-center text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform">
                      Chi tiết <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </PageContainer>

      {/* Features Section */}
      <div className="bg-white py-20 border-t border-gray-100">
        <PageContainer size="lg">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tại sao chọn CodeSense AIoT?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Chúng tôi không chỉ cung cấp kiến thức, mà còn đồng hành cùng bạn trên con đường phát triển sự nghiệp.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center group"
              >
                <div className={`w-16 h-16 mx-auto rounded-2xl ${feature.bg} flex items-center justify-center ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </PageContainer>
      </div>

      {/* CTA Section */}
      <div className="py-20">
        <PageContainer size="lg">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-10 lg:p-16 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">Sẵn sàng bắt đầu hành trình của bạn?</h2>
              <p className="text-indigo-100 text-lg mb-10">
                Tham gia cùng hàng nghìn học viên khác và bắt đầu xây dựng sự nghiệp mơ ước ngay hôm nay.
              </p>
              <button className="px-10 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Đăng ký ngay - Miễn phí
              </button>
            </div>
          </div>
        </PageContainer>
      </div>

      {/* FAB Speed Dial - AI Roadmap Creator */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Backdrop overlay when FAB is open */}
        <AnimatePresence>
          {isFabOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] -z-10"
              onClick={() => setIsFabOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Speed Dial Actions */}
        <AnimatePresence>
          {isFabOpen && (
            <div className="absolute bottom-16 right-0 flex flex-col gap-3 items-end mb-3">
              {/* Action 1: Lộ trình của tôi */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ duration: 0.2, delay: 0.05 }}
              >
                <Link 
                  href="/roadmap/my"
                  className="flex items-center gap-3 group"
                  onClick={() => setIsFabOpen(false)}
                >
                  <motion.span 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-lg shadow-lg whitespace-nowrap border border-gray-100 group-hover:bg-gray-50"
                  >
                    Lộ trình của tôi
                  </motion.span>
                  <div className="w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-colors border border-gray-100 group-hover:scale-105">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                </Link>
              </motion.div>

              {/* Action 2: Tạo lộ trình AI */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Link 
                  href="/roadmap/generate"
                  className="flex items-center gap-3 group"
                  onClick={() => setIsFabOpen(false)}
                >
                  <motion.span 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg shadow-lg whitespace-nowrap group-hover:shadow-xl"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Tạo lộ trình AI
                    </span>
                  </motion.span>
                  <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white group-hover:shadow-xl transition-shadow group-hover:scale-105">
                    <Brain className="w-5 h-5" />
                  </div>
                </Link>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
            isFabOpen 
              ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200' 
              : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white hover:shadow-2xl hover:scale-105'
          }`}
          whileTap={{ scale: 0.95 }}
          aria-label="Menu lộ trình AI"
        >
          <motion.div
            animate={{ rotate: isFabOpen ? 45 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {isFabOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Plus className="w-6 h-6" />
            )}
          </motion.div>
        </motion.button>
      </div>
    </div>
  );
}