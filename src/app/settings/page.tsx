"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/PageContainer';
import AvatarWithProBadge from '@/components/AvatarWithProBadge';
import SettingsSkeleton from '@/components/SettingsSkeleton';
import { User, Lock, Bell, Wand2, Camera, Globe, Linkedin, Github, Twitter, Facebook, Phone, Wifi, WifiOff, Bot, Zap, Settings2 } from 'lucide-react';

type SettingsTab = 'profile' | 'password' | 'notifications' | 'ai';

// AI Assistant Settings sub-component
function AIAssistantSettings() {
  const [settings, setSettings] = useState({
    enabled: true,
    autocompleteEnabled: true,
    autocompleteDelay: 300,
    serverUrl: '',
    completionModel: 'deepseek-coder:1.3b',
    chatModel: 'codellama:13b-instruct',
  });
  const [serverStatus, setServerStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [serverModels, setServerModels] = useState<string[]>([]);
  const [serverLatency, setServerLatency] = useState<number>(0);
  const [saved, setSaved] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ai_assistant_settings');
      if (stored) {
        setSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch { /* ignore */ }
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setServerStatus('checking');
    try {
      const res = await fetch('/api/ai/health', { signal: AbortSignal.timeout(8000) });
      const data = await res.json();
      setServerStatus(data.status === 'connected' ? 'connected' : 'disconnected');
      setServerModels(data.models || []);
      setServerLatency(data.latencyMs || 0);
    } catch {
      setServerStatus('disconnected');
      setServerModels([]);
    }
  };

  const handleSave = () => {
    try {
      localStorage.setItem('ai_assistant_settings', JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">AI Assistant</h2>
      <p className="text-gray-600 mb-6">
        Cài đặt trợ lý AI code để hỗ trợ học tập lập trình.
      </p>

      {/* Server Status Card */}
      <div className="mb-6 p-4 rounded-lg border border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {serverStatus === 'connected' ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : serverStatus === 'checking' ? (
              <Wifi className="w-5 h-5 text-yellow-500 animate-pulse" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <span className="font-medium text-gray-900">
              {serverStatus === 'connected' ? 'Đã kết nối' : serverStatus === 'checking' ? 'Đang kiểm tra...' : 'Mất kết nối'}
            </span>
          </div>
          <button
            onClick={checkHealth}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Kiểm tra lại
          </button>
        </div>
        {serverStatus === 'connected' && (
          <div className="space-y-1 text-sm text-gray-600">
            <p>Độ trễ: <span className="font-medium text-gray-900">{serverLatency}ms</span></p>
            <p>Models: <span className="font-medium text-gray-900">{serverModels.join(', ') || 'Không có'}</span></p>
          </div>
        )}
        {serverStatus === 'disconnected' && (
          <p className="text-sm text-red-600">
            Không thể kết nối tới AI server. Hãy chạy notebook Colab và cập nhật URL.
          </p>
        )}
      </div>

      {/* Settings Form */}
      <div className="space-y-6">
        {/* Enable/Disable AI */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-purple-500" />
            <div>
              <p className="font-medium text-gray-900">Bật AI Assistant</p>
              <p className="text-sm text-gray-500">Cho phép AI hỗ trợ trong quá trình học tập</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {/* Autocomplete */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="font-medium text-gray-900">AI Autocomplete</p>
              <p className="text-sm text-gray-500">Tự động gợi ý code khi bạn đang gõ</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autocompleteEnabled}
              onChange={(e) => setSettings(prev => ({ ...prev, autocompleteEnabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
          </label>
        </div>

        {/* Autocomplete Delay */}
        {settings.autocompleteEnabled && (
          <div className="py-3 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <Settings2 className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Độ trễ autocomplete</p>
                <p className="text-sm text-gray-500">Thời gian chờ sau khi ngừng gõ (ms)</p>
              </div>
            </div>
            <div className="ml-8 flex items-center gap-3">
              <input
                type="range"
                min={100}
                max={1000}
                step={50}
                value={settings.autocompleteDelay}
                onChange={(e) => setSettings(prev => ({ ...prev, autocompleteDelay: Number(e.target.value) }))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <span className="text-sm font-mono text-gray-700 w-16 text-right">{settings.autocompleteDelay}ms</span>
            </div>
          </div>
        )}

        {/* Model Selection */}
        <div className="py-3 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <Wand2 className="w-5 h-5 text-indigo-500" />
            <p className="font-medium text-gray-900">AI Models</p>
          </div>
          <div className="ml-8 space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Completion Model (Autocomplete)</label>
              <input
                type="text"
                value={settings.completionModel}
                onChange={(e) => setSettings(prev => ({ ...prev, completionModel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="deepseek-coder:1.3b"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Chat Model (Chat/Generation)</label>
              <input
                type="text"
                value={settings.chatModel}
                onChange={(e) => setSettings(prev => ({ ...prev, chatModel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="codellama:13b-instruct"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors"
        >
          {saved ? '✓ Đã lưu' : 'Lưu cài đặt'}
        </button>
        <p className="text-xs text-gray-500">
          Cài đặt được lưu trên trình duyệt của bạn.
        </p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    username: '',
    bio: '',
    phone: '',
    avatar_url: '',
    website: '',
    linkedin: '',
    github: '',
    twitter: '',
    facebook: '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Avatar preview
  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    // Chỉ redirect khi đã load xong và không authenticated
    // Tránh redirect khi đang loading auth state
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Load full profile data including social links from API
    const loadProfileData = async () => {
      if (!user?.username) return;

      try {
        setInitialLoading(true);
        
        // Fetch full profile data from API
        const response = await fetch(`/api/users/${user.username}`);
        const data = await response.json();

        if (data.success && data.data) {
          const profile = data.data;
          
          setProfileForm({
            full_name: profile.full_name || '',
            username: profile.username || '',
            bio: profile.bio || '',
            phone: profile.phone || '',
            avatar_url: profile.avatar_url || '',
            website: profile.website || '',
            linkedin: profile.linkedin || '',
            github: profile.github || '',
            twitter: profile.twitter || '',
            facebook: profile.facebook || '',
          });
          
          setAvatarPreview(profile.avatar_url || '');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Không thể tải thông tin cá nhân');
      } finally {
        setInitialLoading(false);
      }
    };

    if (user) {
      loadProfileData();
    }
  }, [user?.username, isAuthenticated, authLoading, router]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh!');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB!');
      return;
    }

    try {
      setUploadingAvatar(true);
      toast.info('Đang tải ảnh lên...');

      // Create FormData and upload to server
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Upload failed');
      }

      // Update preview and form with Cloudinary URL
      setAvatarPreview(data.data.url);
      setProfileForm(prev => ({
        ...prev,
        avatar_url: data.data.url,
      }));

      toast.success('Tải ảnh lên thành công! Nhấn Lưu thay đổi để cập nhật.');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Không thể tải ảnh lên. Vui lòng thử lại!');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      toast.success('Cập nhật thông tin thành công!');
      
      // Update form with response data (API returns updated profile)
      if (data.data) {
        const profile = data.data;
        setProfileForm({
          full_name: profile.full_name || '',
          username: profile.username || '',
          bio: profile.bio || '',
          phone: profile.phone || '',
          avatar_url: profile.avatar_url || '',
          website: profile.website || '',
          linkedin: profile.linkedin || '',
          github: profile.github || '',
          twitter: profile.twitter || '',
          facebook: profile.facebook || '',
        });
        setAvatarPreview(profile.avatar_url || '');
      }
      
      // Refresh user data from AuthContext to update global state
      await refreshUser();
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/users/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      toast.success('Đổi mật khẩu thành công!');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Thông tin cá nhân', icon: User },
    { id: 'password' as SettingsTab, label: 'Mật khẩu và bảo mật', icon: Lock },
    { id: 'notifications' as SettingsTab, label: 'Tùy chọn thông báo', icon: Bell },
    { id: 'ai' as SettingsTab, label: 'AI Assistant', icon: Wand2 },
  ];

  // Hiển thị skeleton khi đang check authentication
  if (authLoading) {
    return (
      <PageContainer>
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="mb-8">
            <div className="h-9 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-5 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Skeleton */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 p-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded-lg mb-2 animate-pulse"></div>
                ))}
              </div>
            </div>
            {/* Content Skeleton */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <SettingsSkeleton />
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Không render gì nếu chưa authenticate (đang redirect)
  if (!user) {
    return null;
  }

  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cài đặt tài khoản</h1>
          <p className="text-gray-600 mt-2">
            Quản lý cài đặt tài khoản của bạn như thông tin cá nhân, cài đặt bảo mật, quản lý thông báo, v.v.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-xl border border-gray-200 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                      ${activeTab === tab.id
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:block">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Thông tin cá nhân</h2>
                  <p className="text-gray-600 mb-6">
                    Quản lý tên hiển thị, tên người dùng, bio và avatar của bạn.
                  </p>

                  {initialLoading ? (
                    <SettingsSkeleton />
                  ) : (
                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                    {/* Avatar Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Ảnh đại diện
                      </label>
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <AvatarWithProBadge
                            avatarUrl={avatarPreview}
                            fullName={user?.full_name || 'User'}
                            isPro={user?.membership_type === 'PRO'}
                            size="xl"
                          />
                          {uploadingAvatar && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={handleAvatarClick}
                            disabled={uploadingAvatar}
                            className="absolute bottom-0 right-0 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex-1">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            disabled={uploadingAvatar}
                            className="hidden"
                          />
                          <p className="text-sm text-gray-600 mb-2">
                            Ảnh hồ sơ của bạn sẽ hiển thị công khai trên các trang của bạn.
                          </p>
                          <button
                            type="button"
                            onClick={handleAvatarClick}
                            disabled={uploadingAvatar}
                            className="text-sm text-primary hover:text-primary/80 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {uploadingAvatar ? 'Đang tải lên...' : 'Chọn ảnh mới'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Khuân Huynh"
                      />
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Tên người dùng
                      </label>
                      <input
                        type="text"
                        value={profileForm.username}
                        onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="huynhkhuanit"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Tên người dùng của bạn sẽ xuất hiện trong URL profile
                      </p>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                        <Phone className="w-4 h-4" />
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => {
                          // Chỉ cho phép số và một số ký tự đặc biệt như +, -, khoảng trắng
                          const value = e.target.value.replace(/[^\d+\-\s()]/g, '');
                          setProfileForm({ ...profileForm, phone: value });
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="0123456789 hoặc +84..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Số điện thoại sẽ được sử dụng để khôi phục mật khẩu và nhận mã OTP
                      </p>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Giới thiệu
                      </label>
                      <textarea
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        placeholder="Hãy điền Bio giới thiệu về bản thân tại đây nhé..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Viết một vài dòng giới thiệu về bản thân
                      </p>
                    </div>

                    {/* Social Links */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin mạng xã hội</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Quản lý liên kết tới các trang mạng xã hội của bạn.
                      </p>

                      <div className="space-y-4">
                        {/* Website */}
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Globe className="w-4 h-4" />
                            Trang web cá nhân
                          </label>
                          <input
                            type="url"
                            value={profileForm.website}
                            onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="https://yourwebsite.com"
                          />
                        </div>

                        {/* LinkedIn */}
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Linkedin className="w-4 h-4" />
                            LinkedIn
                          </label>
                          <input
                            type="url"
                            value={profileForm.linkedin}
                            onChange={(e) => setProfileForm({ ...profileForm, linkedin: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="https://linkedin.com/in/username"
                          />
                        </div>

                        {/* GitHub */}
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Github className="w-4 h-4" />
                            GitHub
                          </label>
                          <input
                            type="url"
                            value={profileForm.github}
                            onChange={(e) => setProfileForm({ ...profileForm, github: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="https://github.com/username"
                          />
                        </div>

                        {/* Twitter */}
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Twitter className="w-4 h-4" />
                            Twitter / X
                          </label>
                          <input
                            type="url"
                            value={profileForm.twitter}
                            onChange={(e) => setProfileForm({ ...profileForm, twitter: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="https://twitter.com/username"
                          />
                        </div>

                        {/* Facebook */}
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Facebook className="w-4 h-4" />
                            Facebook
                          </label>
                          <input
                            type="url"
                            value={profileForm.facebook}
                            onChange={(e) => setProfileForm({ ...profileForm, facebook: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="https://facebook.com/username"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  </form>
                  )}
                </div>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Mật khẩu và bảo mật</h2>
                  <p className="text-gray-600 mb-6">
                    Cập nhật mật khẩu của bạn để bảo vệ tài khoản.
                  </p>

                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Mật khẩu hiện tại
                      </label>
                      <input
                        type="password"
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="••••••••"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Mật khẩu phải có ít nhất 6 ký tự
                      </p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Xác nhận mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Tùy chọn thông báo</h2>
                  <p className="text-gray-600 mb-6">
                    Tùy chỉnh các thông báo bạn muốn nhận.
                  </p>
                  <div className="text-center py-12">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Chức năng đang được phát triển...</p>
                  </div>
                </div>
              )}

              {/* AI Assistant Tab */}
              {activeTab === 'ai' && (
                <AIAssistantSettings />
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
