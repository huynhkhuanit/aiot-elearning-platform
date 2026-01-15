"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Star, Users, Clock, Award, CheckCircle, PlayCircle, 
  BookOpen, Target, TrendingUp, Shield, ChevronDown, ChevronUp, ChevronRight, Quote, Zap,
  Code2, Layers, Database, Layout, Package, Settings, Terminal, GitBranch,
  Share2, Heart, AlertCircle, Check, MonitorPlay, FileText, Download,
  Play, Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

import PageContainer from "@/components/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface CourseDetail {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  description: string;
  price: string;
  priceAmount: number;
  rating: number;
  students: number;
  duration: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  isPro: boolean;
  isFree: boolean;
  totalLessons: number;
  instructor: {
    name: string;
    avatar: string;
    bio?: string;
    role?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  learningOutcomes?: string[];
  updatedAt?: string;
  thumbnail_url?: string;
  sections?: {
    id: string;
    title: string;
    order: number;
    lessons: {
      id: string;
      title: string;
      duration: string;
      durationMinutes: number;
      isFree: boolean;
      type: string;
      order: number;
    }[];
  }[];
}

const LEVEL_MAP: Record<string, string> = {
  BEGINNER: "Cơ bản",
  INTERMEDIATE: "Trung cấp",
  ADVANCED: "Nâng cao",
};

// Helper function to calculate original price and discount for PRO courses
const calculatePricing = (currentPrice: number) => {
  // Original price is ~40% higher than current price (seller strategy)
  const originalPrice = Math.round(currentPrice * 1.4);
  // Round to nearest 100k for cleaner display
  const roundedOriginalPrice = Math.round(originalPrice / 100000) * 100000;
  const discountPercent = Math.round(((roundedOriginalPrice - currentPrice) / roundedOriginalPrice) * 100);
  
  return {
    originalPrice: roundedOriginalPrice,
    currentPrice: currentPrice,
    discountPercent,
  };
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (slug) {
      fetchCourseDetail();
    }
  }, [slug]);

  const fetchCourseDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${slug}`);
      const data = await response.json();

      if (data.success) {
        setCourse(data.data);
        // Expand the first section by default if available
        if (data.data.sections && data.data.sections.length > 0) {
          setExpandedSection(data.data.sections[0].id);
        }
      } else {
        toast.error("Không thể tải thông tin khóa học");
        router.push("/");
      }
    } catch (error) {
      console.error("Error fetching course:", error);
      toast.error("Đã có lỗi xảy ra");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để đăng ký khóa học");
      setTimeout(() => {
        router.push("/auth/login");
      }, 500);
      return;
    }

    if (enrolling) return;

    try {
      setEnrolling(true);
      
      const response = await fetch(`/api/courses/${slug}/enroll`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || "Đăng ký khóa học thành công!");
        
        if (data.data?.upgradedToPro) {
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setTimeout(() => {
            router.push(`/learn/${slug}`);
          }, 1000);
        }
      } else {
        if (data.message && data.message.includes('đã đăng ký')) {
          toast.info("Bạn đã đăng ký khóa học này. Đang chuyển hướng...");
          setTimeout(() => {
            router.push(`/learn/${slug}`);
          }, 800);
        } else {
          toast.error(data.message || "Không thể đăng ký khóa học. Vui lòng thử lại");
        }
      }
    } catch (error) {
      console.error("Enrollment error:", error);
      toast.error("Đã có lỗi xảy ra khi đăng ký. Vui lòng thử lại");
    } finally {
      setEnrolling(false);
    }
  };

  // Generate default learning outcomes if not present
  const getDefaultLearningOutcomes = () => {
    const categoryName = course?.category?.name || "lập trình";
    const level = course?.level || "BEGINNER";
    
    const outcomes = [
      `Nắm vững kiến thức nền tảng về ${categoryName}`,
      `Hiểu rõ các khái niệm cơ bản và nâng cao`,
      `Thực hành với các dự án thực tế`,
      `Áp dụng kiến thức vào công việc ngay lập tức`,
      `Xây dựng ứng dụng hoàn chỉnh từ đầu đến cuối`,
      `Hiểu về best practices và coding standards`,
      `Tối ưu hóa hiệu suất và bảo mật`,
      `Debug và xử lý lỗi hiệu quả`,
    ];

    if (level === "ADVANCED") {
      outcomes.push(
        "Kiến trúc hệ thống quy mô lớn",
        "Tối ưu hóa performance cao cấp"
      );
    }

    if (course?.isPro) {
      outcomes.push(
        "Truy cập vào nội dung độc quyền PRO",
        "Nhận chứng chỉ hoàn thành khóa học"
      );
    }

    return outcomes;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Đang tải khóa học...</p>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const learningOutcomes = course.learningOutcomes || getDefaultLearningOutcomes();
  const pricing = calculatePricing(course.priceAmount);
  const sections = course.sections || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-[#1C1D1F] text-white py-12 lg:py-16 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-900/20 to-transparent pointer-events-none"></div>
        
        <PageContainer>
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Left Content */}
            <div className="lg:col-span-2 relative z-10">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-indigo-200 mb-6 font-medium">
                <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
                <ChevronRight className="w-4 h-4" />
                <Link href={`/#courses`} className="hover:text-white transition-colors">
                  Khóa học
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white truncate max-w-[200px]">{course.title}</span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                {course.title}
              </h1>
              
              <p className="text-lg text-gray-300 mb-6 leading-relaxed max-w-2xl">
                {course.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-sm mb-8">
                <div className="flex items-center gap-1">
                  <span className="bg-yellow-400 text-black px-1.5 py-0.5 rounded font-bold text-xs">BESTSELLER</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-400">
                  <span className="font-bold text-base">{course.rating}</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.floor(course.rating) ? "fill-current" : "text-gray-600"}`} />
                    ))}
                  </div>
                  <span className="text-indigo-200 underline ml-1">({course.students.toLocaleString()} đánh giá)</span>
                </div>
                <div className="flex items-center gap-1 text-white">
                  <Users className="w-4 h-4" />
                  <span>{course.students.toLocaleString()} học viên</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-300 border-t border-gray-700 pt-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                    {course.instructor.name.charAt(0)}
                  </div>
                  <span>Được tạo bởi <span className="text-indigo-400 underline cursor-pointer">{course.instructor.name}</span></span>
                </div>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>Cập nhật lần cuối {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</span>
                </div>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  <span>Tiếng Việt</span>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </div>

      <PageContainer className="py-8">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 relative">
          
          {/* Main Content (Left Column) */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* What you'll learn */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Bạn sẽ học được gì?</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {learningOutcomes.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 text-sm leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Content (Curriculum) */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Nội dung khóa học</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <span className="font-bold text-gray-900">{course.totalLessons}</span> bài học
                <span>•</span>
                <span className="font-bold text-gray-900">{course.duration}</span> thời lượng
              </div>
              
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                {sections.length > 0 ? (
                  sections.map((section) => (
                    <div key={section.id} className="border-b border-gray-200 last:border-0">
                      <button 
                        onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          {expandedSection === section.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          <span className="font-bold text-gray-900">{section.title}</span>
                        </div>
                        <span className="text-sm text-gray-500">{section.lessons.length} bài học</span>
                      </button>
                      <AnimatePresence>
                        {expandedSection === section.id && (
                          <motion.div 
                            initial={{ height: 0 }} 
                            animate={{ height: "auto" }} 
                            exit={{ height: 0 }}
                            className="overflow-hidden bg-white"
                          >
                            <div className="p-4 space-y-3">
                              {section.lessons.map((lesson) => (
                                <div key={lesson.id} className="flex items-center justify-between text-sm group cursor-pointer">
                                  <div className="flex items-center gap-3 text-gray-700 group-hover:text-indigo-600">
                                    <PlayCircle className="w-4 h-4" />
                                    <span>{lesson.title}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {lesson.isFree && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Học thử</span>
                                    )}
                                    <span className="text-gray-400">{lesson.duration}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    Chưa có nội dung bài học
                  </div>
                )}
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Yêu cầu</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Máy tính kết nối internet (Windows, macOS hoặc Linux)</li>
                <li>Ý thức tự học cao, kiên trì và chịu khó</li>
                <li>Không cần kiến thức lập trình từ trước (với khóa cơ bản)</li>
              </ul>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Mô tả</h2>
              <div className="prose prose-gray max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-lg font-semibold text-gray-900 mt-3 mb-2">{children}</h4>,
                    p: ({ children }) => <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700">{children}</ol>,
                    li: ({ children }) => <li className="ml-4">{children}</li>,
                    strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                    em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                    a: ({ href, children }) => (
                      <a href={href} className="text-indigo-600 hover:text-indigo-700 underline font-medium" target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                    code: ({ className, children, ...props }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                          {children}
                        </code>
                      ) : (
                        <code className={`${className} block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono`} {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => <pre className="mb-4 overflow-x-auto">{children}</pre>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-indigo-500 pl-4 py-2 mb-4 italic text-gray-600 bg-indigo-50 rounded-r">
                        {children}
                      </blockquote>
                    ),
                    hr: () => <hr className="my-6 border-gray-300" />,
                    table: ({ children }) => <table className="min-w-full border-collapse border border-gray-300 mb-4">{children}</table>,
                    thead: ({ children }) => <thead className="bg-gray-100">{children}</thead>,
                    th: ({ children }) => <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{children}</th>,
                    td: ({ children }) => <td className="border border-gray-300 px-4 py-2 text-gray-700">{children}</td>,
                  }}
                >
                  {course.description}
                </ReactMarkdown>
              </div>
            </div>

            {/* Instructor */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Giảng viên</h2>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                    {course.instructor.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-indigo-600 mb-1 underline cursor-pointer">{course.instructor.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">Senior Software Engineer & Instructor</p>
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{course.rating} Xếp hạng</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.students.toLocaleString()} Học viên</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <PlayCircle className="w-4 h-4" />
                        <span>10 Khóa học</span>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Tôi là một kỹ sư phần mềm với hơn 10 năm kinh nghiệm. Tôi đam mê giảng dạy và chia sẻ kiến thức. 
                      Sứ mệnh của tôi là giúp bạn trở thành một lập trình viên chuyên nghiệp thông qua các khóa học thực tế, dễ hiểu.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews (Mock) */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                {course.rating} xếp hạng khóa học
                <span className="text-gray-500 text-lg font-normal">• {course.students.toLocaleString()} đánh giá</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white border border-gray-200 p-5 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                        U{i}
                      </div>
                      <div>
                        <div className="font-bold text-sm">User {i}</div>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Khóa học rất hay và bổ ích. Giảng viên dạy dễ hiểu, support nhiệt tình. Rất đáng tiền!
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sticky Sidebar (Right Column) */}
          <div className="lg:col-span-1 relative">
            <div className="sticky top-24 space-y-6">
              {/* Enrollment Card */}
              <div className="bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden">
                {/* Video Preview / Thumbnail */}
                <div className="relative aspect-video bg-gray-900 group cursor-pointer">
                  {course.thumbnail_url ? (
                    <Image 
                      src={course.thumbnail_url} 
                      alt={course.title} 
                      fill 
                      className="object-cover opacity-90 group-hover:opacity-75 transition-opacity" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <Code2 className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-black fill-black ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 text-center text-white font-bold text-sm drop-shadow-md">
                    Xem giới thiệu khóa học
                  </div>
                </div>

                <div className="p-6">
                  {/* Price */}
                  <div className="flex items-center gap-3 mb-6">
                    {!course.isFree ? (
                      <>
                        <span className="text-3xl font-bold text-gray-900">
                          {new Intl.NumberFormat('vi-VN').format(course.priceAmount)}₫
                        </span>
                        <span className="text-gray-500 line-through text-lg">
                          {new Intl.NumberFormat('vi-VN').format(pricing.originalPrice)}₫
                        </span>
                        <span className="text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                          -{pricing.discountPercent}%
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold text-gray-900">Miễn phí</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 mb-6">
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-lg transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {enrolling ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Đang xử lý...</span>
                        </>
                      ) : (
                        course.isFree ? "Đăng ký học ngay" : "Mua ngay"
                      )}
                    </button>
                    <button className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                      <Heart className="w-4 h-4" />
                      <span>Thêm vào yêu thích</span>
                    </button>
                  </div>

                  <div className="text-center text-xs text-gray-500 mb-6">
                    Đảm bảo hoàn tiền trong 30 ngày
                  </div>

                  {/* Includes */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 text-sm">Khóa học bao gồm:</h4>
                    <ul className="space-y-3 text-sm text-gray-600">
                      <li className="flex items-center gap-3">
                        <MonitorPlay className="w-4 h-4" />
                        <span>{course.duration} video bài giảng</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FileText className="w-4 h-4" />
                        <span>{course.totalLessons} bài học</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Download className="w-4 h-4" />
                        <span>Tài liệu tải xuống</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Code2 className="w-4 h-4" />
                        <span>Bài tập thực hành</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <MonitorPlay className="w-4 h-4" />
                        <span>Truy cập trọn đời</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <MonitorPlay className="w-4 h-4" />
                        <span>Truy cập trên mobile và TV</span>
                      </li>
                      {course.isPro && (
                        <li className="flex items-center gap-3">
                          <Award className="w-4 h-4" />
                          <span>Chứng chỉ hoàn thành</span>
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  {/* Share */}
                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100">
                    <button className="text-sm font-medium text-gray-600 hover:text-gray-900 underline">Chia sẻ</button>
                    <button className="text-sm font-medium text-gray-600 hover:text-gray-900 underline">Tặng khóa học</button>
                    <button className="text-sm font-medium text-gray-600 hover:text-gray-900 underline">Mã giảm giá</button>
                  </div>
                </div>
              </div>

              {/* Business Plan (Optional) */}
              <div className="bg-white border border-gray-200 p-6 rounded-xl">
                <h3 className="font-bold text-gray-900 mb-2">Đào tạo doanh nghiệp</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Đăng ký cho đội ngũ của bạn truy cập vào khóa học này và hơn 500+ khóa học khác.
                </p>
                <button className="w-full border border-gray-900 text-gray-900 font-bold py-2 px-4 rounded hover:bg-gray-50 transition-colors text-sm">
                  CodeSense AIoT Business
                </button>
              </div>
            </div>
          </div>

        </div>
      </PageContainer>
    </div>
  );
}


