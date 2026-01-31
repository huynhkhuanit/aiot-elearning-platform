"use client";

import { Search, X, Sun, Moon, User, LogOut, FileText, Bookmark, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useRouter } from "next/navigation";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import AvatarWithProBadge from "./AvatarWithProBadge";

import { removeVietnameseTones } from "@/lib/string-utils";

export default function Header() {
  const [searchValue, setSearchValue] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchPlaceholder, setSearchPlaceholder] = useState("Tìm kiếm");
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Thay đổi placeholder dựa trên kích thước màn hình
  useEffect(() => {
    const updatePlaceholder = () => {
      if (window.innerWidth >= 1024) {
        // Desktop (lg breakpoint)
        setSearchPlaceholder("Tìm kiếm khóa học, bài viết, video...");
      } else {
        // Mobile và Tablet
        setSearchPlaceholder("Tìm kiếm");
      }
    };

    updatePlaceholder();
    window.addEventListener('resize', updatePlaceholder);

    return () => {
      window.removeEventListener('resize', updatePlaceholder);
    };
  }, []);

  // Đóng menu khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showResults]);

  const fetchCourses = async () => {
    if (courses.length > 0) return;
    
    try {
      setIsLoadingCourses(true);
      const res = await fetch('/api/courses?limit=100');
      const data = await res.json();
      if (data.success) {
        setCourses(data.data.courses);
      }
    } catch (error) {
      console.error("Failed to fetch courses for search:", error);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    if (value.trim()) {
      setShowResults(true);
      const normalizedSearch = removeVietnameseTones(value.toLowerCase());
      
      const filtered = courses.filter(course => {
        const normalizedTitle = removeVietnameseTones(course.title.toLowerCase());
        return normalizedTitle.includes(normalizedSearch);
      });
      
      setSearchResults(filtered.slice(0, 5)); // Limit to 5 results
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const clearSearch = () => {
    setSearchValue("");
    setSearchResults([]);
    setShowResults(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchResults.length > 0) {
        router.push(`/learn/${searchResults[0].slug}`);
        setShowResults(false);
        setSearchValue("");
      }
    } else if (e.key === 'Escape') {
      clearSearch();
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    toast.success("Đăng xuất thành công! Hẹn gặp lại bạn.");
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200">
      <div className="mx-auto px-4 md:px-[28px] h-[66px] flex items-center justify-between gap-2 relative" style={{ backgroundColor: '#ffffff' }}>
        {/* Logo Section */}
        <div className="flex items-center gap-3 flex-shrink-0 z-10">
          <Link href="/" className="flex items-center justify-center transition-all duration-200 cursor-pointer">
            <img 
              src="/assets/img/logo.png" 
              alt="CodeSense AIoT Logo" 
              width={38}
              height={38}
              style={{ objectFit: 'contain' }}
              className="w-[38px] h-[38px] rounded-lg"
            />
          </Link>
          <div className="hidden lg:block">
            <Link href="/" className="transition-colors duration-200 hover:opacity-80">
              <p className="text-small font-[700] text-black">Học lập trình thông minh với AI & IoT</p>
            </Link>
          </div>
        </div>

        {/* Search Section - Centered on desktop */}
        <div className="flex-1 lg:absolute lg:left-1/2 lg:transform lg:-translate-x-1/2 relative mx-2 lg:mx-0" ref={searchContainerRef}>
          <div className="relative w-full lg:w-[420px] lg:mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={handleSearchChange}
              onFocus={() => {
                setIsSearchFocused(true);
                if (courses.length === 0) {
                  fetchCourses();
                }
              }}
              onKeyDown={handleKeyDown}
              aria-label="Tìm kiếm"
              className="w-full pl-12 pr-12 border border-border rounded-full text-card-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              style={{ backgroundColor: '#ffffff', fontSize: '14px', height: '40px' }}
            />
            {searchValue && (
              <span
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors duration-200"
                onClick={clearSearch}
                title="Xóa tìm kiếm"
                aria-label="Xóa tìm kiếm"
              >
                <X className="h-5 w-5" />
              </span>
            )}
          </div>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {showResults && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="fixed md:absolute top-[66px] left-0 md:top-full md:left-0 w-full md:w-full mt-0 md:mt-2 bg-white md:rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[calc(100vh-66px)] md:max-h-[400px] overflow-y-auto px-4 md:px-0"
              >
                {isLoadingCourses ? (
                  <div className="p-4 text-center text-gray-500" style={{ fontSize: '14px' }}>
                    Đang tải...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    <div className="px-0 md:px-4 py-2 font-semibold text-black-500 uppercase tracking-wider" style={{ fontSize: '14px' }}>
                      Khóa học ({searchResults.length})
                    </div>
                    {searchResults.map((course) => (
                      <Link
                        key={course.id}
                        href={`/learn/${course.slug}`}
                        className="flex items-center gap-3 md:px-4 py-1.5 hover:bg-gray-50 transition-colors rounded-lg"
                        onClick={() => {
                          setShowResults(false);
                          setSearchValue("");
                        }}
                      >
                        <div className="relative w-8 h-8 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
                          {course.thumbnailUrl ? (
                            <img
                              src={course.thumbnailUrl}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-black-500 truncate" style={{ fontSize: '14px' }}>
                            {course.title}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : searchValue.trim() ? (
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                      <Search className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-600" style={{ fontSize: '14px' }}>
                      Không tìm thấy kết quả cho "{searchValue}"
                    </p>
                  </div>
                ) : (
                   <div className="p-4 text-center text-gray-500" style={{ fontSize: '14px' }}>
                    Nhập từ khóa để tìm kiếm
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-shrink-0 z-10">
          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              // Loading skeleton - tránh flash
              <div className="flex items-center gap-2">
                <div className="w-32 h-10 bg-gray-100 rounded-full animate-pulse"></div>
              </div>
            ) : isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 transition-all duration-200"
                >
                  <AvatarWithProBadge
                    avatarUrl={user?.avatar_url}
                    fullName={user?.full_name}
                    isPro={user?.membership_type === 'PRO'}
                    size="xs"
                  />
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">{user?.username}</span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                    >
                      {/* User Info Header - 2 Columns */}
                      <div className="px-4 py-4 border-b border-gray-100">
                        <div className="flex items-start gap-3">
                          {/* Avatar Column */}
                          <div className="flex-shrink-0">
                            <AvatarWithProBadge
                              avatarUrl={user?.avatar_url}
                              fullName={user?.full_name}
                              isPro={user?.membership_type === 'PRO'}
                              size="md"
                            />
                          </div>

                          {/* Info Column */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name}</p>
                            <p style={{ fontSize: '14px' }} className="text-gray-500 truncate">@{user?.username}</p>
                          </div>
                        </div>
                      </div>

                      {/* Main Menu Items */}
                      <div className="py-1">
                        <Link
                          href={`/${user?.username}`}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>Trang cá nhân</span>
                        </Link>
                        <Link
                          href="/write"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <FileText className="w-4 h-4" />
                          <span>Viết blog</span>
                        </Link>
                        <Link
                          href="/my-posts"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <FileText className="w-4 h-4" />
                          <span>Bài viết của tôi</span>
                        </Link>
                        <Link
                          href="/saved"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Bookmark className="w-4 h-4" />
                          <span>Bài viết đã lưu</span>
                        </Link>
                      </div>

                      {/* Settings & Logout */}
                      <div className="border-t border-gray-100 py-1">
                        <Link
                          href="/settings"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Cài đặt</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                {/* Đăng ký button - hiển thị trên tablet và desktop */}
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="hidden md:block font-medium text-black hover:text-primary transition-all duration-200 rounded-full cursor-pointer whitespace-nowrap"
                  style={{ padding: '9px 20px', fontSize: '14px' }}
                >
                  Đăng ký
                </button>

                {/* Đăng nhập button - hiển thị trên tất cả màn hình */}
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all duration-200 shadow-lg cursor-pointer whitespace-nowrap"
                  style={{ padding: '9px 20px', fontSize: '14px' }}
                >
                  Đăng nhập
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />

      {/* Register Modal */}
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />
    </header>
  );
}