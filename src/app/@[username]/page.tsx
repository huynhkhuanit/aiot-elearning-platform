"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UserProfile, ActivityData, ProfileTab } from "@/types/profile";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import ProfileStats from "@/components/ProfileStats";
import PageContainer from "@/components/PageContainer";
import AvatarWithProBadge from "@/components/AvatarWithProBadge";
import {
    Calendar,
    Github,
    Mail,
    MapPin,
    Award,
    Clock,
    BookOpen,
    FileText,
} from "lucide-react";

export default function UserProfilePage() {
    const params = useParams();
    const username = params.username as string;
    const usernameWithoutAt = username?.startsWith("@")
        ? username.slice(1)
        : username;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [activityData, setActivityData] = useState<ActivityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>("enrolled");

    const tabs: ProfileTab[] = [
        {
            id: "enrolled",
            label: "Khóa học đã đăng ký",
            count: profile?.total_courses_enrolled,
        },
        {
            id: "completed",
            label: "Khóa học đã hoàn thành",
            count: profile?.total_courses_completed,
        },
        {
            id: "articles",
            label: "Bài viết",
            count: profile?.total_articles_published,
        },
        { id: "saved", label: "Bài viết đã lưu" },
    ];

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setLoading(true);

                // Fetch profile
                const profileRes = await fetch(
                    `/api/users/${usernameWithoutAt}`,
                );
                const profileData = await profileRes.json();

                if (!profileData.success) {
                    throw new Error(profileData.message);
                }

                setProfile(profileData.data);

                // Fetch activities
                const activitiesRes = await fetch(
                    `/api/users/${usernameWithoutAt}/activities`,
                );
                const activitiesData = await activitiesRes.json();

                if (activitiesData.success) {
                    setActivityData(activitiesData.data);
                }
            } catch (err: any) {
                setError(err.message || "Không thể tải thông tin người dùng");
            } finally {
                setLoading(false);
            }
        };

        if (usernameWithoutAt) {
            fetchProfileData();
        }
    }, [usernameWithoutAt]);

    if (loading) {
        return (
            <PageContainer>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang tải thông tin...</p>
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
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Không tìm thấy người dùng
                        </h1>
                        <p className="text-gray-600">
                            {error || "Người dùng không tồn tại hoặc đã bị xóa"}
                        </p>
                    </div>
                </div>
            </PageContainer>
        );
    }

    const joinDate = new Date(profile.created_at).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
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
                                isPro={profile.membership_type === "PRO"}
                                size="2xl"
                            />
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-1">
                                        {profile.full_name}
                                    </h1>
                                    <p className="text-lg text-gray-600 mb-4">
                                        @{profile.username}
                                    </p>

                                    {profile.bio && (
                                        <p className="text-gray-700 mb-4 max-w-2xl">
                                            {profile.bio}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                        {profile.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4" />
                                                <span>{profile.email}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>Tham gia từ {joinDate}</span>
                                        </div>
                                        {profile.learning_streak > 0 && (
                                            <div className="flex items-center gap-2">
                                                <Award className="w-4 h-4 text-orange-500" />
                                                <span className="font-semibold text-orange-600">
                                                    🔥 {profile.learning_streak}{" "}
                                                    ngày streak
                                                </span>
                                            </div>
                                        )}
                                        {profile.total_study_time > 0 && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-blue-500" />
                                                <span>
                                                    {Math.floor(
                                                        profile.total_study_time /
                                                            60,
                                                    )}
                                                    h{" "}
                                                    {profile.total_study_time %
                                                        60}
                                                    m học tập
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
                                        Theo dõi
                                    </button>
                                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                                        Nhắn tin
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="mb-6">
                    <ProfileStats profile={profile} />
                </div>

                {/* Activity Heatmap */}
                {activityData && (
                    <div className="mb-6">
                        <ActivityHeatmap
                            activities={activityData.activities}
                            totalCount={activityData.total_count}
                            currentStreak={activityData.current_streak}
                        />
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-xl border border-gray-200">
                    {/* Tab Headers */}
                    <div className="border-b border-gray-200">
                        <nav className="flex gap-1 p-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                    px-4 py-2.5 rounded-lg text-sm font-medium transition-all
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
                            <div className="text-center py-12">
                                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Chưa có khóa học nào
                                </h3>
                                <p className="text-gray-600">
                                    Người dùng này chưa đăng ký khóa học nào
                                </p>
                            </div>
                        )}

                        {activeTab === "completed" && (
                            <div className="text-center py-12">
                                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Chưa hoàn thành khóa học nào
                                </h3>
                                <p className="text-gray-600">
                                    Người dùng này chưa hoàn thành khóa học nào
                                </p>
                            </div>
                        )}

                        {activeTab === "articles" && (
                            <div className="text-center py-12">
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Chưa có bài viết nào
                                </h3>
                                <p className="text-gray-600">
                                    Người dùng này chưa xuất bản bài viết nào
                                </p>
                            </div>
                        )}

                        {activeTab === "saved" && (
                            <div className="text-center py-12">
                                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Chưa lưu bài viết nào
                                </h3>
                                <p className="text-gray-600">
                                    Người dùng này chưa lưu bài viết nào
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
