export interface UserProfile {
    id: string;
    email: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    phone: string | null;
    membership_type: "FREE" | "PRO";
    membership_expires_at: string | null;
    learning_streak: number;
    total_study_time: number;
    is_verified: boolean;
    created_at: string;
    website?: string | null;
    linkedin?: string | null;
    github?: string | null;
    twitter?: string | null;
    facebook?: string | null;
    total_courses_enrolled: number;
    total_courses_completed: number;
    total_articles_published: number;
    followers_count: number;
    following_count: number;
}
