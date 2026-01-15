"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { UserProfile, ActivityData, ProfileTab } from '@/types/profile';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import ProfileStats from '@/components/ProfileStats';
import PageContainer from '@/components/PageContainer';
import AvatarWithProBadge from '@/components/AvatarWithProBadge';
import { Calendar, Award, Clock, BookOpen, FileText, Globe, Linkedin, Github, Twitter, Facebook, Eye, Heart, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import CertificateModal from '@/components/CertificateModal';

// Custom hook for drag-to-scroll functionality with carousel-like behavior
function useDragToScroll() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);
  const startYRef = useRef(0);
  const lastXRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const clickBlockedRef = useRef(false);

  // Smooth momentum scrolling animation
  const animateScroll = useCallback(() => {
    if (!scrollContainerRef.current || Math.abs(velocityRef.current) < 0.5) {
      velocityRef.current = 0;
      animationFrameRef.current = null;
      return;
    }

    scrollContainerRef.current.scrollLeft -= velocityRef.current;
    velocityRef.current *= 0.95; // Friction factor for smooth deceleration

    animationFrameRef.current = requestAnimationFrame(animateScroll);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    
    // Cancel any ongoing momentum scroll
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Allow drag from anywhere, including cards/links
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    clickBlockedRef.current = false;
    startXRef.current = e.pageX;
    startYRef.current = e.pageY;
    lastXRef.current = e.pageX;
    scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
    velocityRef.current = 0;
    lastTimeRef.current = Date.now();
    
    // Change cursor
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grabbing';
      scrollContainerRef.current.style.scrollBehavior = 'auto'; // Disable smooth scroll during drag
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTimeRef.current;
    const walkX = e.pageX - startXRef.current;
    const walkY = Math.abs(e.pageY - startYRef.current);
    const deltaX = e.pageX - lastXRef.current;
    
    // Only start scrolling if moved horizontally more than vertically
    // and moved more than 3px (threshold to distinguish click from drag)
    if (Math.abs(walkX) > 3 && Math.abs(walkX) > walkY) {
      if (!hasMovedRef.current) {
        hasMovedRef.current = true;
        clickBlockedRef.current = true;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      // Prevent text selection while dragging
      if (scrollContainerRef.current) {
        scrollContainerRef.current.style.userSelect = 'none';
        // Disable pointer events on links only
        const links = scrollContainerRef.current.querySelectorAll('a');
        links.forEach(link => {
          (link as HTMLElement).style.pointerEvents = 'none';
        });
      }
      
      // Calculate velocity for momentum scrolling
      if (deltaTime > 0) {
        velocityRef.current = (deltaX / deltaTime) * 16; // Normalize to 60fps
      }
      
      // Update scroll position smoothly
      scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walkX;
      
      lastXRef.current = e.pageX;
      lastTimeRef.current = currentTime;
    }
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    
    const wasDragging = hasMovedRef.current;
    
    isDraggingRef.current = false;
    
    // Restore styles
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
      scrollContainerRef.current.style.userSelect = '';
      scrollContainerRef.current.style.scrollBehavior = 'smooth';
      // Restore pointer events on links
      const links = scrollContainerRef.current.querySelectorAll('a');
      links.forEach(link => {
        (link as HTMLElement).style.pointerEvents = '';
      });
    }
    
    // If we dragged, prevent click on links and start momentum scroll
    if (wasDragging) {
      e.preventDefault();
      e.stopPropagation();
      
      // Start momentum scrolling if velocity is significant
      if (Math.abs(velocityRef.current) > 1) {
        animationFrameRef.current = requestAnimationFrame(animateScroll);
      }
      
      // Block clicks temporarily
      setTimeout(() => {
        clickBlockedRef.current = false;
        hasMovedRef.current = false;
      }, 100);
    } else {
      // Reset immediately if no drag occurred
      hasMovedRef.current = false;
      clickBlockedRef.current = false;
    }
  }, [animateScroll]);

  const handleMouseLeave = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const wasDragging = hasMovedRef.current;
    
    isDraggingRef.current = false;
    
    // Restore styles
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
      scrollContainerRef.current.style.userSelect = '';
      scrollContainerRef.current.style.scrollBehavior = 'smooth';
      // Restore pointer events on links
      const links = scrollContainerRef.current.querySelectorAll('a');
      links.forEach(link => {
        (link as HTMLElement).style.pointerEvents = '';
      });
    }
    
    // Start momentum scrolling if we were dragging
    if (wasDragging && Math.abs(velocityRef.current) > 1) {
      animationFrameRef.current = requestAnimationFrame(animateScroll);
    }
    
    // Reset after a delay
    setTimeout(() => {
      hasMovedRef.current = false;
      clickBlockedRef.current = false;
    }, 100);
  }, [animateScroll]);

  // Handle click on links - prevent if we dragged
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      if (clickBlockedRef.current || hasMovedRef.current) {
        const target = e.target as HTMLElement;
        const link = target.closest('a');
        if (link) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    container.addEventListener('click', handleClick, true);
    return () => {
      container.removeEventListener('click', handleClick, true);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    scrollContainerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  };
}

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('enrolled');
  const [articles, setArticles] = useState<any[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [completedCourses, setCompletedCourses] = useState<any[]>([]);
  const [completedCoursesLoading, setCompletedCoursesLoading] = useState(false);
  const [savedArticles, setSavedArticles] = useState<any[]>([]);
  const [savedArticlesLoading, setSavedArticlesLoading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null);

  // Drag-to-scroll hooks for courses and articles
  const coursesDragScroll = useDragToScroll();
  const articlesDragScroll = useDragToScroll();
  const completedCoursesDragScroll = useDragToScroll();
  const savedArticlesDragScroll = useDragToScroll();

  const tabs: ProfileTab[] = [
    { id: 'enrolled', label: 'Khoá học đã đăng ký', count: profile?.total_courses_enrolled },
    { id: 'completed', label: 'Khóa học đã hoàn thành', count: profile?.total_courses_completed },
    { id: 'certificates', label: 'Chứng chỉ', count: profile?.total_courses_completed },
    { id: 'articles', label: 'Bài viết', count: profile?.total_articles_published },
    { id: 'saved', label: 'Bài viết đã lưu' },
  ];

  useEffect(() => {
    if (!username) return;

    const fetchProfileData = async () => {
      setLoading(true);
      
      // 1. Fetch Profile (Critical)
      fetch(`/api/users/${username}`)
        .then(res => res.json())
        .then(data => {
          if (!data.success) {
            throw new Error(data.message);
          }
          setProfile(data.data);
        })
        .catch(err => {
          setError(err.message || 'Không thể tải thông tin người dùng');
        })
        .finally(() => {
          setLoading(false);
        });

      // 2. Fetch Activities (Non-critical, load in background)
      fetch(`/api/users/${username}/activities`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setActivityData(data.data);
          }
        })
        .catch(console.error);
    };

    fetchProfileData();
  }, [username]);

  // Fetch articles when articles tab is selected
  useEffect(() => {
    const fetchArticles = async () => {
      if (activeTab !== 'articles' || !profile) return;
      
      try {
        setArticlesLoading(true);
        const res = await fetch(`/api/blog/posts?userId=${profile.id}&status=published&limit=12&offset=0`);
        const data = await res.json();
        
        if (data.success && data.data?.posts) {
          setArticles(data.data.posts);
        }
      } catch (err) {
        console.error('Failed to fetch articles:', err);
      } finally {
        setArticlesLoading(false);
      }
    };

    fetchArticles();
  }, [activeTab, profile]);

  // Fetch enrolled courses when enrolled tab is selected
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (activeTab !== 'enrolled' || !username) return;
      
      try {
        setCoursesLoading(true);
        const res = await fetch(`/api/users/${username}/courses`);
        const data = await res.json();
        
        if (data.success && data.data?.courses) {
          setEnrolledCourses(data.data.courses);
        }
      } catch (err) {
        console.error('Failed to fetch enrolled courses:', err);
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, [activeTab, username]);

  // Fetch completed courses when completed tab is selected
  useEffect(() => {
    const fetchCompletedCourses = async () => {
      if (activeTab !== 'completed' || !username) return;
      
      try {
        setCompletedCoursesLoading(true);
        const res = await fetch(`/api/users/${username}/courses?completed=true`);
        const data = await res.json();
        
        if (data.success && data.data?.courses) {
          setCompletedCourses(data.data.courses);
        }
      } catch (err) {
        console.error('Failed to fetch completed courses:', err);
      } finally {
        setCompletedCoursesLoading(false);
      }
    };

    fetchCompletedCourses();
  }, [activeTab, username]);

  // Fetch saved articles when saved tab is selected
  useEffect(() => {
    const fetchSavedArticles = async () => {
      if (activeTab !== 'saved' || !username) return;
      
      try {
        setSavedArticlesLoading(true);
        const res = await fetch(`/api/users/${username}/saved?limit=12&offset=0`);
        const data = await res.json();
        
        if (data.success && data.data?.posts) {
          setSavedArticles(data.data.posts);
        }
      } catch (err) {
        console.error('Failed to fetch saved articles:', err);
      } finally {
        setSavedArticlesLoading(false);
      }
    };

    fetchSavedArticles();
  }, [activeTab, username]);

  if (loading) {
    return (
      <PageContainer>
        <div className="max-w-7xl mx-auto py-8 px-4">
          {/* Profile Header Skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6 animate-pulse">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Avatar Skeleton */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-gray-100"></div>
                </div>
              </div>

              {/* Profile Info Skeleton - Match exact spacing */}
              <div className="flex-1">
                <div className="flex items-start justify-between flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    {/* Name - h1 text-3xl with mb-1 */}
                    <div className="h-9 bg-gray-200 rounded-lg w-64 mb-1"></div>
                    {/* Username - text-lg with mb-4 */}
                    <div className="h-7 bg-gray-100 rounded-lg w-40 mb-4"></div>
                    
                    {/* Bio - 2 lines with mb-4 */}
                    <div className="space-y-2 mb-4">
                      <div className="h-5 bg-gray-100 rounded-lg w-full"></div>
                      <div className="h-5 bg-gray-100 rounded-lg w-3/4"></div>
                    </div>

                    {/* Social Links - flex gap-3 mb-4 */}
                    <div className="flex flex-wrap gap-3 mb-4">
                      <div className="h-8 bg-gray-100 rounded-lg w-24"></div>
                      <div className="h-8 bg-gray-100 rounded-lg w-24"></div>
                      <div className="h-8 bg-gray-100 rounded-lg w-24"></div>
                    </div>

                    {/* Meta Info - flex gap-4 text-sm */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="h-5 bg-gray-100 rounded-lg w-40"></div>
                      <div className="h-5 bg-gray-100 rounded-lg w-32"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
              >
                <div className="h-10 w-10 bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-8 bg-gray-200 rounded-lg w-16 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded-lg w-24"></div>
              </div>
            ))}
          </div>

          {/* Activity Heatmap Skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-gray-200 rounded-lg w-48"></div>
              <div className="flex gap-4">
                <div className="h-5 bg-gray-100 rounded-lg w-32"></div>
              </div>
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex gap-1">
                  {Array.from({ length: 53 }).map((_, j) => (
                    <div key={j} className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Tabs Skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 animate-pulse">
            <div className="border-b border-gray-200 p-2">
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded-lg w-40"></div>
                ))}
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto"></div>
                <div className="h-6 bg-gray-200 rounded-lg w-48 mx-auto"></div>
                <div className="h-4 bg-gray-100 rounded-lg w-64 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !profile) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">😔</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy người dùng</h1>
            <p className="text-gray-600">{error || 'Người dùng không tồn tại hoặc đã bị xóa'}</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  const joinDate = new Date(profile.created_at).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <AvatarWithProBadge
                avatarUrl={profile.avatar_url}
                fullName={profile.full_name}
                isPro={profile.membership_type === 'PRO'}
                size="2xl"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">
                    {profile.full_name}
                  </h1>
                  <p className="text-lg text-gray-600 mb-4">@{profile.username}</p>
                  
                  {profile.bio && (
                    <p className="text-gray-700 mb-4 max-w-2xl">{profile.bio}</p>
                  )}

                  {/* Social Links */}
                  {(profile.website || profile.linkedin || profile.github || profile.twitter || profile.facebook) && (
                    <div className="flex flex-wrap gap-3 mb-4">
                      {profile.website && (
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                        >
                          <Globe className="w-4 h-4" />
                          <span>Website</span>
                        </a>
                      )}
                      {profile.linkedin && (
                        <a
                          href={profile.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-700 transition-colors"
                        >
                          <Linkedin className="w-4 h-4" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                      {profile.github && (
                        <a
                          href={profile.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm text-white transition-colors"
                        >
                          <Github className="w-4 h-4" />
                          <span>GitHub</span>
                        </a>
                      )}
                      {profile.twitter && (
                        <a
                          href={profile.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 rounded-lg text-sm text-sky-700 transition-colors"
                        >
                          <Twitter className="w-4 h-4" />
                          <span>Twitter</span>
                        </a>
                      )}
                      {profile.facebook && (
                        <a
                          href={profile.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-600 transition-colors"
                        >
                          <Facebook className="w-4 h-4" />
                          <span>Facebook</span>
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Tham gia từ {joinDate}</span>
                    </div>
                    {profile.learning_streak > 0 && (
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-orange-500" />
                        <span className="font-semibold text-orange-600">
                          🔥 {profile.learning_streak} ngày streak
                        </span>
                      </div>
                    )}
                    {profile.total_study_time > 0 && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>
                          {Math.floor(profile.total_study_time / 60)}h {profile.total_study_time % 60}m học tập
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-6">
          <ProfileStats profile={profile} />
        </div>

        {/* Activity Heatmap - Always show, even if no data */}
        <div className="mb-6">
          <ActivityHeatmap
            activities={activityData?.activities || []}
            totalCount={activityData?.total_count || 0}
            currentStreak={activityData?.current_streak || 0}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-1 p-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                    ${
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "enrolled" && (
              <>
                {coursesLoading ? (
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex-shrink-0 w-80 bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
                        <div className="h-40 bg-gray-200"></div>
                        <div className="p-4 space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-2 bg-gray-100 rounded-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : enrolledCourses.length > 0 ? (
                  <div 
                    ref={coursesDragScroll.scrollContainerRef}
                    onMouseDown={coursesDragScroll.handleMouseDown}
                    onMouseMove={coursesDragScroll.handleMouseMove}
                    onMouseUp={coursesDragScroll.handleMouseUp}
                    onMouseLeave={coursesDragScroll.handleMouseLeave}
                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 cursor-grab active:cursor-grabbing"
                  >
                    {enrolledCourses.map((course) => {
                      const progressPercentage = Math.round(course.progress_percentage || 0);
                      
                      return (
                        <Link key={course.id} href={`/learn/${course.slug}`}>
                          <div className="flex-shrink-0 w-80 h-full bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col cursor-pointer">
                            {/* Thumbnail */}
                            <div className="h-40 flex-shrink-0 bg-gradient-to-r from-primary to-purple-600 relative">
                              {course.thumbnail_url ? (
                                <Image
                                  src={course.thumbnail_url}
                                  alt={course.title}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="w-12 h-12 text-white opacity-50" />
                                </div>
                              )}
                              {/* Progress Badge */}
                              {course.is_completed ? (
                                <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-1 rounded text-xs font-medium">
                                  ✓ Hoàn thành
                                </div>
                              ) : (
                                <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded text-xs font-medium">
                                  {progressPercentage}%
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="p-4 flex-1 flex flex-col min-h-[140px]">
                              {/* Title */}
                              <p className="text-base font-bold text-gray-900 mb-3 line-clamp-2">
                                {course.title}
                              </p>

                              {/* Progress Bar - Always show */}
                              {!course.is_completed && (
                                <div className="mb-3">
                                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                    <span>Tiến độ</span>
                                    <span>{progressPercentage}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className="bg-primary h-1.5 rounded-full"
                                      style={{ width: `${progressPercentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}

                              {/* Enrolled Date */}
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-auto pt-3 border-t border-gray-100">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>
                                  {new Date(course.enrolled_at).toLocaleDateString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có khóa học nào</h3>
                    <p className="text-gray-600">Người dùng này chưa đăng ký khóa học nào</p>
                  </div>
                )}
              </>
            )}

            {activeTab === "completed" && (
              <>
                {completedCoursesLoading ? (
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex-shrink-0 w-80 bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
                        <div className="h-40 bg-gray-200"></div>
                        <div className="p-4 space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-2 bg-gray-100 rounded-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : completedCourses.length > 0 ? (
                  <div 
                    ref={completedCoursesDragScroll.scrollContainerRef}
                    onMouseDown={completedCoursesDragScroll.handleMouseDown}
                    onMouseMove={completedCoursesDragScroll.handleMouseMove}
                    onMouseUp={completedCoursesDragScroll.handleMouseUp}
                    onMouseLeave={completedCoursesDragScroll.handleMouseLeave}
                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 cursor-grab active:cursor-grabbing"
                  >
                    {completedCourses.map((course) => {
                      return (
                        <Link key={course.id} href={`/learn/${course.slug}`}>
                          <div className="flex-shrink-0 w-80 h-full bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col cursor-pointer">
                            {/* Thumbnail */}
                            <div className="h-40 flex-shrink-0 bg-gradient-to-r from-primary to-purple-600 relative">
                              {course.thumbnail_url ? (
                                <Image
                                  src={course.thumbnail_url}
                                  alt={course.title}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="w-12 h-12 text-white opacity-50" />
                                </div>
                              )}
                              {/* Completed Badge */}
                              <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-1 rounded text-xs font-medium">
                                ✓ Hoàn thành
                              </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 flex-1 flex flex-col min-h-[140px]">
                              {/* Title */}
                              <p className="text-base font-bold text-gray-900 mb-3 line-clamp-2">
                                {course.title}
                              </p>

                              {/* Completed Date */}
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>
                                  {course.completed_at 
                                    ? `Hoàn thành: ${new Date(course.completed_at).toLocaleDateString('vi-VN', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                      })}`
                                    : 'Đã hoàn thành'}
                                </span>
                              </div>

                              {/* View Certificate Button */}
                              <div className="mt-auto pt-3 border-t border-gray-100">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedCertificate({
                                      studentName: profile.full_name || profile.username,
                                      courseName: course.title,
                                      completionDate: new Date(course.completed_at || Date.now()).toLocaleDateString('vi-VN'),
                                      instructorName: "CodeSense AIoT Instructor",
                                      courseDuration: "Unknown Duration"
                                    });
                                  }}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-sm font-medium transition-colors"
                                >
                                  <Award className="w-4 h-4" />
                                  <span>Xem chứng chỉ</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Chưa hoàn thành khóa học nào
                    </h3>
                    <p className="text-gray-600">Hoàn thành khóa học để nhận chứng chỉ</p>
                  </div>
                )}
              </>
            )}

            {activeTab === "certificates" && (
              <>
                {completedCoursesLoading ? (
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex-shrink-0 w-80 bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
                        <div className="h-40 bg-gray-200"></div>
                        <div className="p-4 space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-2 bg-gray-100 rounded-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : completedCourses.length > 0 ? (
                  <div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {completedCourses.map((course) => {
                      return (
                        <div key={course.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          {/* Certificate Preview (Mock) */}
                          <div className="relative h-48 bg-gray-50 border-b border-gray-100 flex items-center justify-center p-4 group cursor-pointer"
                            onClick={() => {
                              setSelectedCertificate({
                                studentName: profile.full_name || profile.username,
                                courseName: course.title,
                                completionDate: new Date(course.completed_at || Date.now()).toLocaleDateString('vi-VN'),
                                instructorName: "CodeSense AIoT Instructor",
                                courseDuration: "Unknown Duration"
                              });
                            }}
                          >
                            {/* Decorative Elements */}
                            <div className="absolute inset-4 border-4 border-double border-yellow-600/20"></div>
                            <div className="text-center">
                              <Award className="w-12 h-12 text-yellow-600 mx-auto mb-2" />
                              <div className="text-xs font-serif text-gray-500 uppercase tracking-widest">Certificate of Completion</div>
                              <div className="font-bold text-gray-900 mt-1 line-clamp-1 px-4">{course.title}</div>
                            </div>
                            
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white font-medium flex items-center gap-2">
                                <Eye className="w-5 h-5" />
                                Xem chi tiết
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{course.title}</h3>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>Cấp ngày: {new Date(course.completed_at || Date.now()).toLocaleDateString('vi-VN')}</span>
                              <button 
                                onClick={() => {
                                  setSelectedCertificate({
                                    studentName: profile.full_name || profile.username,
                                    courseName: course.title,
                                    completionDate: new Date(course.completed_at || Date.now()).toLocaleDateString('vi-VN'),
                                    instructorName: "CodeSense AIoT Instructor",
                                    courseDuration: "Unknown Duration"
                                  });
                                }}
                                className="text-indigo-600 hover:text-indigo-700 font-medium"
                              >
                                Tải về
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Chưa có chứng chỉ nào
                    </h3>
                    <p className="text-gray-600">Hoàn thành khóa học để nhận chứng chỉ</p>
                  </div>
                )}
              </>
            )}

            {activeTab === "articles" && (
              <>
                {articlesLoading ? (
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex-shrink-0 w-80 bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
                        <div className="h-40 bg-gray-200"></div>
                        <div className="p-4 space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : articles.length > 0 ? (
                  <div 
                    ref={articlesDragScroll.scrollContainerRef}
                    onMouseDown={articlesDragScroll.handleMouseDown}
                    onMouseMove={articlesDragScroll.handleMouseMove}
                    onMouseUp={articlesDragScroll.handleMouseUp}
                    onMouseLeave={articlesDragScroll.handleMouseLeave}
                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 cursor-grab active:cursor-grabbing"
                  >
                    {articles.map((article) => {
                      const getCategories = (categoryNames: string | null) => {
                        if (!categoryNames) return [];
                        return categoryNames.split(", ").filter((c) => c).slice(0, 2);
                      };

                      const formatDate = (dateString: string) => {
                        const date = new Date(dateString);
                        return date.toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        });
                      };

                      return (
                        <Link key={article.id} href={`/articles/${article.slug}`}>
                          <div className="flex-shrink-0 w-80 h-full bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col cursor-pointer">
                            {/* Cover Image */}
                            <div className="h-40 flex-shrink-0 bg-gradient-to-r from-primary to-purple-600 relative">
                              {article.cover_image ? (
                                <Image
                                  src={article.cover_image}
                                  alt={article.title}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FileText className="w-12 h-12 text-white opacity-50" />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="p-4 flex-1 flex flex-col min-h-[180px]">
                              {/* Categories */}
                              {article.category_names && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {getCategories(article.category_names).map((cat, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs"
                                    >
                                      {cat}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Title */}
                              <p className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
                                {article.title}
                              </p>

                              {/* Excerpt */}
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-1">
                                {article.excerpt}
                              </p>

                              {/* Author & Date */}
                              <div className="flex items-center justify-between text-xs text-gray-500 mb-2 pb-2 border-b border-gray-100">
                                <div className="flex items-center gap-1.5">
                                  {article.avatar_url ? (
                                    <Image
                                      src={article.avatar_url}
                                      alt={article.full_name}
                                      width={20}
                                      height={20}
                                      className="rounded-full"
                                    />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-xs">
                                      {article.full_name?.charAt(0) || 'U'}
                                    </div>
                                  )}
                                  <span className="font-medium">{article.full_name}</span>
                                </div>
                                <span>{formatDate(article.published_at)}</span>
                              </div>

                              {/* Stats */}
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>{article.view_count || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Heart className="w-3.5 h-3.5" />
                                  <span>{article.like_count || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>{article.comment_count || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có bài viết nào</h3>
                    <p className="text-gray-600">Người dùng này chưa xuất bản bài viết nào</p>
                  </div>
                )}
              </>
            )}

            {activeTab === "saved" && (
              <>
                {savedArticlesLoading ? (
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex-shrink-0 w-80 bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
                        <div className="h-40 bg-gray-200"></div>
                        <div className="p-4 space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : savedArticles.length > 0 ? (
                  <div 
                    ref={savedArticlesDragScroll.scrollContainerRef}
                    onMouseDown={savedArticlesDragScroll.handleMouseDown}
                    onMouseMove={savedArticlesDragScroll.handleMouseMove}
                    onMouseUp={savedArticlesDragScroll.handleMouseUp}
                    onMouseLeave={savedArticlesDragScroll.handleMouseLeave}
                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 cursor-grab active:cursor-grabbing"
                  >
                    {savedArticles.map((article) => {
                      const getCategories = (categoryNames: string | null) => {
                        if (!categoryNames) return [];
                        return categoryNames.split(", ").filter((c) => c).slice(0, 2);
                      };

                      const formatDate = (dateString: string) => {
                        const date = new Date(dateString);
                        return date.toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        });
                      };

                      return (
                        <Link key={article.id} href={`/articles/${article.slug}`}>
                          <div className="flex-shrink-0 w-80 h-full bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col cursor-pointer">
                            {/* Cover Image */}
                            <div className="h-40 flex-shrink-0 bg-gradient-to-r from-primary to-purple-600 relative">
                              {article.cover_image ? (
                                <Image
                                  src={article.cover_image}
                                  alt={article.title}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FileText className="w-12 h-12 text-white opacity-50" />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="p-4 flex-1 flex flex-col min-h-[180px]">
                              {/* Categories */}
                              {article.category_names && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {getCategories(article.category_names).map((cat, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs"
                                    >
                                      {cat}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Title */}
                              <p className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
                                {article.title}
                              </p>

                              {/* Excerpt */}
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-1">
                                {article.excerpt}
                              </p>

                              {/* Author & Date */}
                              <div className="flex items-center justify-between text-xs text-gray-500 mb-2 pb-2 border-b border-gray-100">
                                <div className="flex items-center gap-1.5">
                                  {article.avatar_url ? (
                                    <Image
                                      src={article.avatar_url}
                                      alt={article.full_name}
                                      width={20}
                                      height={20}
                                      className="rounded-full"
                                    />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-xs">
                                      {article.full_name?.charAt(0) || 'U'}
                                    </div>
                                  )}
                                  <span className="font-medium">{article.full_name}</span>
                                </div>
                                <span>{formatDate(article.published_at)}</span>
                              </div>

                              {/* Stats */}
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>{article.view_count || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Heart className="w-3.5 h-3.5" />
                                  <span>{article.like_count || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>{article.comment_count || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa lưu bài viết nào</h3>
                    <p className="text-gray-600">Người dùng này chưa lưu bài viết nào</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {/* Certificate Modal */}
      {selectedCertificate && (
        <CertificateModal
          isOpen={!!selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
          data={selectedCertificate}
          disableCelebration={true}
        />
      )}
    </PageContainer>
  );
}
