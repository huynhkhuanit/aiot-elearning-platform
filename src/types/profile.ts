export type AppRole = "student" | "instructor" | "partner" | "admin";

export type ProfessionalProfileStatus =
    | "draft"
    | "pending_review"
    | "published"
    | "rejected";

export type VerificationType =
    | "instructor_verification"
    | "partner_verification";

export type VerificationStatus =
    | "pending"
    | "verified"
    | "rejected"
    | "revoked";

export type ProfileBadgeCode =
    | "verified_instructor"
    | "verified_partner";

export interface ProfileBadge {
    code: ProfileBadgeCode;
    visible: boolean;
}

export interface PublicProfileRecord {
    displayName: string;
    headline: string | null;
    bio: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
    location: string | null;
    websiteUrl: string | null;
    socialLinks: Record<string, string>;
}

export interface ProfessionalProfileRecord {
    profileRoles: AppRole[];
    status: ProfessionalProfileStatus;
    headline: string | null;
    summary: string | null;
    yearsExperience: number | null;
    currentTitle: string | null;
    currentOrganization: string | null;
    location: string | null;
    skills: string[];
    educationItems: Record<string, unknown>[];
    careerItems: Record<string, unknown>[];
    achievementItems: Record<string, unknown>[];
    featuredLinks: Record<string, unknown>[];
    submittedAt: string | null;
    reviewedAt: string | null;
    publishedAt: string | null;
    reviewNotes: string | null;
}

export interface UserVerificationRecord {
    verificationType: VerificationType;
    status: VerificationStatus;
    requestedAt: string | null;
    reviewedAt: string | null;
    reviewNotes: string | null;
}

export interface ProfileCourse {
    id: string;
    slug: string;
    title: string;
    thumbnailUrl: string | null;
    shortDescription?: string | null;
}

export interface UnifiedProfileUser {
    id: string;
    username: string;
    fullName: string;
    roles: AppRole[];
    primaryRole: AppRole;
    role: AppRole;
}

export interface UnifiedProfileResponse {
    user: UnifiedProfileUser;
    publicProfile: PublicProfileRecord;
    professionalProfile: ProfessionalProfileRecord | null;
    badges: ProfileBadge[];
    courses: ProfileCourse[];
}

export interface ProfessionalProfileEditorResponse
    extends UnifiedProfileResponse {
    verifications: UserVerificationRecord[];
    capabilities: {
        canViewProfessionalProfile: boolean;
        canEditProfessionalProfile: boolean;
        canPublishProfessionalProfile: boolean;
    };
}

export interface PublicProfileUpdateInput {
    username?: string;
    phone?: string | null;
    displayName?: string | null;
    headline?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    bannerUrl?: string | null;
    location?: string | null;
    websiteUrl?: string | null;
    socialLinks?: Record<string, string | null | undefined>;
}

export interface ProfessionalProfileUpdateInput {
    profileRoles: AppRole[];
    headline?: string | null;
    summary?: string | null;
    yearsExperience?: number | null;
    currentTitle?: string | null;
    currentOrganization?: string | null;
    location?: string | null;
    skills?: string[];
    educationItems?: Record<string, unknown>[];
    careerItems?: Record<string, unknown>[];
    achievementItems?: Record<string, unknown>[];
    featuredLinks?: Record<string, unknown>[];
}

export interface ProfileReviewSummary {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    roles: AppRole[];
    verifications: UserVerificationRecord[];
    status: ProfessionalProfileStatus;
    submittedAt: string | null;
    reviewNotes: string | null;
    profileRoles: AppRole[];
    headline: string | null;
    badges: ProfileBadge[];
    canPublish: boolean;
}

// Legacy types kept for compatibility with existing profile-related UI.
export interface UserProfile {
    id: string;
    email: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    phone: string | null;
    membership_type: "FREE" | "PRO";
    membership_expires_at: Date | null;
    learning_streak: number;
    total_study_time: number;
    is_verified: boolean;
    created_at: Date;
    website?: string | null;
    linkedin?: string | null;
    github?: string | null;
    twitter?: string | null;
    facebook?: string | null;
    total_courses_enrolled: number;
    total_courses_completed: number;
    total_articles_published: number;
    total_forum_posts: number;
    followers_count: number;
    following_count: number;
}

export interface ActivityDay {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
}

export interface ActivityData {
    activities: ActivityDay[];
    total_count: number;
    current_streak: number;
    longest_streak: number;
}

export interface EnrolledCourse {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string | null;
    progress_percentage: number;
    enrolled_at: Date;
    is_completed: boolean;
    completed_at: Date | null;
}

export interface UserArticle {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    thumbnail_url: string | null;
    published_at: Date;
    views_count: number;
    likes_count: number;
    comments_count: number;
}

export interface ProfileTab {
    id: string;
    label: string;
    count?: number;
}
