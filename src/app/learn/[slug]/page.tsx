"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import confetti from "canvas-confetti";
import { 
  Play, PlayCircle, CheckCircle, Lock, Clock, FileText, 
  ChevronDown, ChevronRight, BookOpen, Award, Star, 
  Menu, X, MessageSquare, Code, Download, Share2,
  BarChart, Users, TrendingUp, Flag, Home, Code2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useLearnCourse } from "@/contexts/LearnCourseContext";
import { usePageTitle, useLessonContent } from "@/lib/hooks";
import VideoPlayer from "@/components/VideoPlayer";
import LessonQAButton from "@/components/LessonQAButton";
import LessonQAModal from "@/components/LessonQAModal";
import AskQuestionModal from "@/components/AskQuestionModal";
import QuestionDetailModal from "@/components/QuestionDetailModal";
import CodePlayground from "@/components/CodePlayground";
import LearnCourseSidebar from "@/components/LearnCourseSidebar";
import CertificateModal from "@/components/CertificateModal";
import "@/app/markdown.css";
import "@/app/markdown.css";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: "video" | "reading" | "quiz";
  isCompleted: boolean;
  isFree: boolean;
  order: number;
  videoUrl?: string; // Add video URL to lesson interface
  videoDuration?: number; // Add video duration to lesson interface
}

interface Section {
  id: string;
  title: string;
  duration: string;
  lessons: Lesson[];
  order: number;
}

interface CourseData {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  instructor: {
    name: string;
    avatar: string;
  };
  progress: number;
  sections: Section[];
  totalLessons: number;
  completedLessons: number;
  totalDuration: string;
}

export default function LearnCoursePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [loading, setLoading] = useState(true);
  const [lessonContent, setLessonContent] = useState<string>("");
  const [isFreeCourseDetermined, setIsFreeCourseDetermined] = useState(false);
  
  // Use context for shared state
  const {
    sidebarOpen,
    setSidebarOpen,
    course,
    setCourse,
    currentLesson,
    setCurrentLesson,
    expandedSections,
    setExpandedSections,
    toggleSection,
    handleLessonClick,
    isFree,
    setIsFree,
  } = useLearnCourse();
  const [isQAModalOpen, setIsQAModalOpen] = useState(false);
  const [isAskQuestionModalOpen, setIsAskQuestionModalOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [isCodePlaygroundOpen, setIsCodePlaygroundOpen] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  const [showModeTooltip, setShowModeTooltip] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchDirection, setSwitchDirection] = useState<'on' | 'off' | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const toast = useToast();
  
  // Update page title when course changes
  usePageTitle(course ? `${course.title} - CodeSense AIoT` : "CodeSense AIoT");
  
  // Load markdown content when current lesson changes
  const markdownContent = useLessonContent(currentLesson?.id || "");

  // Handle hash changes for question navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#question-")) {
        const questionId = hash.replace("#question-", "");
        setSelectedQuestionId(questionId);
        setIsQAModalOpen(false);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // Check initial hash

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    // ✅ FIX: Wait for auth check to complete before deciding what to do
    if (authLoading) {
      console.log("[LEARN PAGE] Auth is loading, waiting...");
      return;
    }

    // ✅ FIX: Check authentication IMMEDIATELY before making any API calls
    if (!isAuthenticated) {
      console.log("[LEARN PAGE] User not authenticated, redirecting to login");
      toast.error("Vui lòng đăng nhập để tiếp tục học");
      router.push("/auth/login");
      setLoading(false);
      return;
    }

    // Only fetch data when slug exists and user is authenticated
    if (slug) {
      fetchCourseData();
    }
  }, [slug, isAuthenticated, authLoading]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      

      // Fetch course details, chapters, and progress
      const [courseResponse, chaptersResponse, progressResponse] = await Promise.all([
        fetch(`/api/courses/${slug}`, { credentials: "include" }),
        fetch(`/api/courses/${slug}/chapters`, { credentials: "include" }),
        fetch(`/api/courses/${slug}/progress`, { credentials: "include" })
      ]);

      // ✅ FIX: Handle authentication error (401)
      if (progressResponse.status === 401) {
        console.log("[LEARN PAGE] User not authenticated (401)");
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại");
        router.push("/auth/login");
        return;
      }

      // ✅ FIX: Handle enrollment error (403) - user is authenticated but not enrolled
      if (progressResponse.status === 403) {
        console.log("[LEARN PAGE] User not enrolled in course (403)");
        toast.error("Bạn chưa đăng ký khóa học này. Vui lòng đăng ký để tiếp tục");
        router.push(`/courses/${slug}`);
        return;
      }

      // Parse responses
      const courseData = await courseResponse.json();
      const chaptersData = await chaptersResponse.json();
      const progressData = await progressResponse.json();

      // ✅ FIX: Validate all responses are successful
      if (!courseData.success || !chaptersData.success || !progressData.success) {
        console.error("[LEARN PAGE] API response not successful:", {
          courseSuccess: courseData.success,
          chaptersSuccess: chaptersData.success,
          progressSuccess: progressData.success
        });
        toast.error("Không thể tải khóa học. Vui lòng thử lại");
        return;
      }

      // Determine if it's a FREE course
      const isFreeFlag = courseData.data.isFree || false;
      setIsFree(isFreeFlag);
      setIsFreeCourseDetermined(true);

      const chapters = chaptersData.data.chapters;
      const completedLessons = progressData.data.completedLessons || [];
      
      // Transform chapters data to match UI structure
      const sections: Section[] = chapters.map((chapter: any) => ({
        id: chapter.id,
        title: chapter.title,
        duration: chapter.duration,
        order: chapter.order,
        lessons: chapter.lessons.map((lesson: any) => ({
          id: lesson.id,
          title: lesson.title,
          duration: lesson.duration,
          type: lesson.type as "video" | "reading" | "quiz",
          isCompleted: completedLessons.includes(lesson.id),
          isFree: lesson.isPreview || false,
          order: lesson.order,
          videoUrl: lesson.videoUrl,
          videoDuration: lesson.videoDuration,
        }))
      }));

      // Calculate totals
      const totalLessons = sections.reduce((acc, section) => acc + section.lessons.length, 0);
      const completedCount = sections.reduce((acc, section) => 
        acc + section.lessons.filter(l => l.isCompleted).length, 0
      );

      const courseWithProgress: CourseData = {
        id: courseData.data.id,
        title: courseData.data.title,
        subtitle: courseData.data.subtitle,
        slug: courseData.data.slug,
        instructor: courseData.data.instructor,
        progress: progressData.data.progress || 0,
        sections: sections,
        totalLessons,
        completedLessons: completedCount,
        totalDuration: courseData.data.duration
      };

      setCourse(courseWithProgress);
      
      // Set first uncompleted lesson or first lesson as current
      const firstUncompletedLesson = sections
        .flatMap(s => s.lessons)
        .find(l => !l.isCompleted) || sections[0]?.lessons[0];
      
      if (firstUncompletedLesson) {
        setCurrentLesson(firstUncompletedLesson);
      }
      
      // Expand first section by default
      if (sections.length > 0) {
        setExpandedSections(new Set([sections[0].id]));
      }
      
      // Expand section containing current lesson
      if (firstUncompletedLesson) {
        const sectionContainingLesson = sections.find((s: any) =>
          s.lessons.some((l: any) => l.id === firstUncompletedLesson.id)
        );
        if (sectionContainingLesson) {
          setExpandedSections((prev) => new Set(prev).add(sectionContainingLesson.id));
        }
      }
    } catch (error) {
      console.error("[LEARN PAGE] Error fetching course:", error);
      toast.error("Đã có lỗi xảy ra khi tải khóa học. Vui lòng thử lại");
      // ✅ FIX: Redirect to home instead of courses page when there's an error
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  // toggleSection and handleLessonClick are now from context

  const markAsCompleted = async () => {
    if (!currentLesson) return;
    
    try {
      const response = await fetch(`/api/lessons/${currentLesson.id}/complete`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Đã đánh dấu hoàn thành bài học");
        
        // Update local state
        setCourse((prev: CourseData | null) => {
          if (!prev) return prev;
          
          const updatedSections = prev.sections.map((section: Section) => ({
            ...section,
            lessons: section.lessons.map((lesson: Lesson) => 
              lesson.id === currentLesson.id 
                ? { ...lesson, isCompleted: true }
                : lesson
            )
          }));

          const completedLessons = updatedSections.reduce((acc: number, section: Section) => 
            acc + section.lessons.filter((l: Lesson) => l.isCompleted).length, 0
          );

          return {
            ...prev,
            sections: updatedSections,
            completedLessons,
            progress: Math.round((completedLessons / prev.totalLessons) * 100)
          };
        });

        // Auto advance to next lesson
        goToNextLesson();
      } else {
        toast.error(data.message || "Không thể đánh dấu hoàn thành");
      }
    } catch (error) {
      console.error("Error marking lesson as completed:", error);
      toast.error("Đã có lỗi xảy ra");
    }
  };

  const triggerFireworks = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    // Also fire a central burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const goToNextLesson = async () => {
    if (!course || !currentLesson) return;

    // 1. Identify next lesson immediately
    const allLessons = course.sections.flatMap((s: Section) => s.lessons);
    const currentIndex = allLessons.findIndex((l: Lesson) => l.id === currentLesson.id);
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    // 2. Optimistic UI Update
    // Update local state immediately to mark current as completed
    setCourse((prev: CourseData | null) => {
      if (!prev) return prev;
      
      const updatedSections = prev.sections.map((section: Section) => ({
        ...section,
        lessons: section.lessons.map((lesson: Lesson) => 
          lesson.id === currentLesson.id 
            ? { ...lesson, isCompleted: true }
            : lesson
        )
      }));

      const completedLessons = updatedSections.reduce((acc: number, section: Section) => 
        acc + section.lessons.filter((l: Lesson) => l.isCompleted).length, 0
      );

      return {
        ...prev,
        sections: updatedSections,
        completedLessons,
        progress: Math.round((completedLessons / prev.totalLessons) * 100)
      };
    });

    // Navigate immediately
    if (nextLesson) {
      setCurrentLesson(nextLesson);
      triggerFireworks();
    } else {
      toast.success("Chúc mừng! Bạn đã hoàn thành khóa học!");
      triggerFireworks();
      setShowCertificateModal(true);
    }

    // 3. Background API Call
    try {
      const response = await fetch(`/api/lessons/${currentLesson.id}/complete`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!data.success) {
        // If API fails, we might want to revert or just notify user
        console.error("Failed to mark lesson as complete on server:", data.message);
        toast.error("Không thể lưu trạng thái hoàn thành. Vui lòng kiểm tra kết nối mạng.");
        // Optional: Revert state here if strict consistency is required
      }
    } catch (error) {
      console.error("Error marking lesson as completed:", error);
      toast.error("Đã có lỗi xảy ra khi lưu tiến độ");
    }
  };

  const goToPreviousLesson = () => {
    if (!course || !currentLesson) return;

    const allLessons = course.sections.flatMap((s: Section) => s.lessons);
    const currentIndex = allLessons.findIndex((l: Lesson) => l.id === currentLesson.id);
    
    if (currentIndex > 0) {
      setCurrentLesson(allLessons[currentIndex - 1]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-gray-300 rounded-full"></div>
            <div className="absolute inset-0 border-4 rounded-full animate-spin" style={{ borderTopColor: 'var(--primary)', borderRightColor: 'rgba(99, 102, 241, 0.5)' }}></div>
          </div>
          <p className="text-lg font-medium text-gray-700 mb-2">Đang tải khóa học...</p>
          <p className="text-sm text-gray-500">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  // Sử dụng dark theme cho PRO courses, light theme cho FREE courses
  const isDarkTheme = !isFree;
  const bgClass = isDarkTheme ? "bg-gray-900" : "bg-gradient-to-br from-gray-50 to-white";
  const headerBgClass = isDarkTheme ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const headerTextClass = isDarkTheme ? "text-gray-200" : "text-gray-900";
  const sidebarBgClass = isDarkTheme ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const buttonBgClass = isDarkTheme 
    ? "bg-transparent border-[2px]" 
    : "bg-transparent border-[2px]";
  const buttonHoverClass = isDarkTheme
    ? ""
    : "";
  const textColorClass = isDarkTheme ? "text-gray-300" : "text-gray-700";

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "video":
        return <PlayCircle className="w-4 h-4" />;
      case "reading":
        return <FileText className="w-4 h-4" />;
      case "quiz":
        return <Flag className="w-4 h-4" />;
      default:
        return <PlayCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className={`h-screen ${bgClass} flex flex-col overflow-hidden`}>
      {/* Top Header Bar */}
      <div className={`${headerBgClass} border-b px-6 flex items-center justify-between flex-shrink-0`} style={{ height: '45px', minHeight: '45px' }}>
        <div className="flex items-center space-x-4 flex-1 min-w-0 h-full">
          <button
            onClick={() => router.push("/")}
            className={`flex items-center space-x-2 ${isDarkTheme ? 'text-gray-300 hover:opacity-80' : 'text-gray-600 hover:opacity-80'} transition-opacity flex-shrink-0`}
          >
            <img 
              src="/assets/img/logo.png" 
              alt="CodeSense AIoT Logo" 
              className="h-8 w-8 rounded"
            />
          </button>
          <div className={`h-5 w-px ${isDarkTheme ? 'bg-gray-600' : 'bg-gray-300'} flex-shrink-0`}></div>
          <div className={`font-[900] ${headerTextClass} truncate`} style={{ fontSize: '16px' }}>
            {course?.title}
          </div>
          
          {/* Circular Progress - Bên cạnh Title */}
          <div className="relative w-8 h-8 flex-shrink-0">
            <svg className="transform -rotate-90 w-8 h-8">
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="var(--primary)"
                strokeWidth="2.5"
                fill="none"
                strokeOpacity="0.2"
              />
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="var(--primary)"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 14}`}
                strokeDashoffset={`${2 * Math.PI * 14 * (1 - (course?.progress || 0) / 100)}`}
                className="transition-all duration-500"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-[9px] font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                {course?.progress}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 flex-shrink-0">
          {/* Dev Mode Toggle Switch */}
          <div 
            className="relative"
            onMouseEnter={() => setShowModeTooltip(true)}
            onMouseLeave={() => setShowModeTooltip(false)}
          >
            {/* Toggle Switch */}
            <button
              onClick={() => {
                if (isSwitching) return;
                const newState = !isDevMode;
                const direction = newState ? 'on' : 'off';
                
                setIsSwitching(true);
                setSwitchDirection(direction);
                
                // Update state sau khi animation bắt đầu
                setTimeout(() => {
                  setIsDevMode(newState);
                  setIsCodePlaygroundOpen(newState);
                  // Đóng sidebar khi mở CodePlayground
                  if (newState && sidebarOpen) {
                    setSidebarOpen(false);
                  }
                }, 175); // Nửa chừng animation
                
                setTimeout(() => {
                  setIsSwitching(false);
                  setSwitchDirection(null);
                }, 350);
              }}
              className={`dev-mode-toggle relative w-[62px] h-[34px] rounded-full ${
                isDarkTheme ? 'bg-[#282a36]' : 'bg-[#282a36]'
              } flex items-center px-[5px]`}
              title={isDevMode ? "Tắt Dev Mode" : "Bật Dev Mode"}
            >
              {/* Toggle Thumb */}
              <div className={`dev-mode-toggle-thumb absolute w-6 h-6 rounded-full flex items-center justify-center ${
                isSwitching && switchDirection
                  ? switchDirection === 'on'
                    ? 'switching-on'
                    : 'switching-off'
                  : isDevMode
                    ? 'on'
                    : 'off'
              }`}>
                {/* Code Icon from lucide-react */}
                <Code2 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
            </button>

            {/* Tooltip */}
            {showModeTooltip && (
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap z-50 transition-all duration-200 bg-white text-gray-800 shadow-lg border border-gray-200">
                {/* Arrow pointer - pointing right */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-white"></div>
                {isDevMode ? (
                  <span>DEV MODE</span>
                ) : (
                  <span>DEV MODE</span>
                )}
              </div>
            )}
          </div>
          
          <button 
            className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isDarkTheme ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500'}`}
            style={isDarkTheme ? {} : { 
              '--hover-color': 'var(--primary)',
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              if (!isDarkTheme) {
                e.currentTarget.style.color = 'var(--primary)';
                e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDarkTheme) {
                e.currentTarget.style.color = '';
                e.currentTarget.style.backgroundColor = '';
              }
            }}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col overflow-hidden justify-center items-center transition-all duration-300 ${
          isCodePlaygroundOpen && sidebarOpen 
            ? 'mr-[calc(40vw+24rem)]' 
            : isCodePlaygroundOpen 
              ? 'mr-[40vw]' 
              : sidebarOpen 
                ? 'mr-96' 
                : 'mr-0'
        }`}>
          {/* Video and Lesson Content */}
          <div className={`w-full flex-1 overflow-y-auto ${isDarkTheme ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-white'} flex flex-col`}>
            {/* Video Player Area */}
            <div className={isDarkTheme ? "bg-black" : "bg-gray-100"}>
              <div className="max-w-6xl mx-auto px-4 py-4">
                {currentLesson?.videoUrl ? (
                  <VideoPlayer
                    videoUrl={currentLesson.videoUrl}
                    lessonId={currentLesson.id}
                    duration={currentLesson.videoDuration}
                    title={currentLesson.title}
                    onComplete={() => {
                      toast.success("Bài học đã hoàn thành! Tiếp tục với bài học tiếp theo");
                      goToNextLesson();
                    }}
                    onProgress={(data) => {
                      console.log(`Progress: ${data.currentTime}s / ${data.duration}s`);
                    }}
                    autoSave={true}
                  />
                ) : (
                  // Show message for non-video lessons (reading materials, quizzes)
                  <div className={`w-full aspect-video ${isDarkTheme ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-gray-200 to-gray-100 border-gray-300'} rounded-lg flex items-center justify-center border`}>
                    <div className="text-center">
                      {currentLesson?.type === 'reading' ? (
                        <>
                          <FileText className={`w-16 h-16 mx-auto mb-4 ${isDarkTheme ? 'text-gray-600' : 'text-gray-400'}`} />
                          <p className={`text-lg font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Bài học dạng đọc</p>
                          <p className={`text-sm mt-2 ${isDarkTheme ? 'text-gray-500' : 'text-gray-500'}`}>Xem nội dung bên dưới</p>
                        </>
                      ) : currentLesson?.type === 'quiz' ? (
                        <>
                          <Flag className={`w-16 h-16 mx-auto mb-4 ${isDarkTheme ? 'text-gray-600' : 'text-gray-400'}`} />
                          <p className={`text-lg font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Bài kiểm tra</p>
                          <p className={`text-sm mt-2 ${isDarkTheme ? 'text-gray-500' : 'text-gray-500'}`}>Xem câu hỏi bên dưới</p>
                        </>
                      ) : (
                        <>
                          <PlayCircle className={`w-16 h-16 mx-auto mb-4 ${isDarkTheme ? 'text-gray-600' : 'text-gray-400'}`} />
                          <p className={`text-lg font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Đang cập nhật video</p>
                          <p className={`text-sm mt-2 ${isDarkTheme ? 'text-gray-500' : 'text-gray-500'}`}>Video sẽ được thêm sớm</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lesson Content Section */}
            <div>
              <div className="max-w-4xl mx-auto p-6">
                {/* Markdown Content */}
                <div className={`prose ${isDarkTheme ? 'prose-invert' : ''} max-w-none text-sm`}>
                  {markdownContent ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {markdownContent}
                    </ReactMarkdown>
                  ) : (
                    <div 
                      className={`rounded-lg p-6 border ${isDarkTheme ? 'bg-gray-700/30 border-gray-600 text-gray-300' : 'border-gray-200 text-gray-600'}`}
                      style={isDarkTheme ? {} : { backgroundColor: 'rgba(99, 102, 241, 0.05)', borderColor: 'rgba(99, 102, 241, 0.2)' }}
                    >
                      <p className={isDarkTheme ? "text-gray-400 italic" : "text-gray-600 italic"}>
                        Chọn một bài học để xem nội dung chi tiết.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Control Bar */}
          <div className={`w-full ${isDarkTheme ? 'bg-gray-800/70 border-gray-700' : 'bg-white/70 border-gray-200'} backdrop-blur-sm border-t px-6 py-4 flex items-center justify-between flex-shrink-0`}>
            <div className="flex-1"></div>

            <div className="flex items-center gap-6">
              {/* Button "Bài trước" */}
              <div className="nav-button-wrapper-prev">
                <button
                  onClick={goToPreviousLesson}
                  disabled={!course || !currentLesson || course.sections.flatMap((s: Section) => s.lessons)[0]?.id === currentLesson.id}
                  className="px-6 py-2 rounded-md transition-all duration-300 font-bold text-sm flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed text-white uppercase relative z-10"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  <span>BÀI TRƯỚC</span>
                </button>
              </div>

              {/* Button "Bài tiếp theo" */}
              <div className="nav-button-wrapper-next">
                <button
                  onClick={goToNextLesson}
                  className="px-6 py-2 rounded-md transition-all duration-300 font-bold text-sm flex items-center space-x-2 text-white uppercase relative z-10"
                >
                  <span>BÀI TIẾP THEO</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-end gap-3">
              <div className="text-right">
                <p className={`text-sm font-medium truncate max-w-xs ${isDarkTheme ? 'text-gray-300' : 'text-gray-900'}`}>{currentLesson?.title}</p>
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-lg transition-colors z-10 backdrop-blur-sm ${isDarkTheme ? 'bg-gray-700/50 hover:bg-gray-600/70 text-gray-300' : ''}`}
                style={isDarkTheme ? {} : { 
                  color: 'var(--primary)',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                }}
                onMouseEnter={(e) => {
                  if (!isDarkTheme) {
                    e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDarkTheme) {
                    e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
                  }
                }}
                title={sidebarOpen ? "Ẩn nội dung khóa học" : "Hiển thị nội dung khóa học"}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - Part of page layout */}
        <LearnCourseSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          course={course}
          currentLesson={currentLesson}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          handleLessonClick={handleLessonClick}
          isFree={isFree}
          codePlaygroundOpen={isCodePlaygroundOpen}
        />

        {/* Code Playground - Part of page layout */}
        {currentLesson && (
          <CodePlayground
            isOpen={isCodePlaygroundOpen}
            onClose={() => {
              setIsCodePlaygroundOpen(false);
              setIsDevMode(false);
            }}
            lessonId={currentLesson.id}
            initialLanguage="html"
            sidebarOpen={sidebarOpen}
          />
        )}
      </div>

      {/* Q&A Button - Fixed on bottom left */}
      {currentLesson && (
        <LessonQAButton onClick={() => setIsQAModalOpen(true)} />
      )}

      {/* Q&A Modal */}
      {currentLesson && (
        <LessonQAModal
          isOpen={isQAModalOpen}
          onClose={() => setIsQAModalOpen(false)}
          lessonId={currentLesson.id}
          lessonTitle={currentLesson.title}
          onQuestionClick={(questionId) => {
            setSelectedQuestionId(questionId);
            setIsQAModalOpen(false);
          }}
          onAskQuestion={() => {
            setIsQAModalOpen(false);
            setIsAskQuestionModalOpen(true);
          }}
        />
      )}

      {/* Certificate Modal */}
      {course && (
        <CertificateModal
          isOpen={showCertificateModal}
          onClose={() => setShowCertificateModal(false)}
          data={{
            studentName: user?.full_name || user?.username || "Học viên",
            courseName: course.title,
            completionDate: new Date().toLocaleDateString('vi-VN'),
            instructorName: course.instructor.name,
            courseDuration: course.totalDuration
          }}
        />
      )}

      {/* Ask Question Modal */}
      {currentLesson && (
        <AskQuestionModal
          isOpen={isAskQuestionModalOpen}
          onClose={() => setIsAskQuestionModalOpen(false)}
          onBack={() => {
            setIsAskQuestionModalOpen(false);
            setIsQAModalOpen(true);
          }}
          lessonId={currentLesson.id}
          lessonTitle={currentLesson.title}
          onQuestionCreated={() => {
            setIsAskQuestionModalOpen(false);
            setIsQAModalOpen(true);
          }}
        />
      )}

      {/* Question Detail Modal */}
      {selectedQuestionId && (
        <QuestionDetailModal
          isOpen={!!selectedQuestionId}
          onClose={() => {
            setSelectedQuestionId(null);
            window.location.hash = "";
          }}
          onBack={() => {
            setSelectedQuestionId(null);
            window.location.hash = "";
            setIsQAModalOpen(true);
          }}
          questionId={selectedQuestionId}
          onUpdate={() => {
            // Refresh questions list if modal is open
            if (isQAModalOpen) {
              // This will trigger a re-fetch in LessonQAModal
              setIsQAModalOpen(false);
              setTimeout(() => setIsQAModalOpen(true), 100);
            }
          }}
        />
      )}

    </div>
  );
}
