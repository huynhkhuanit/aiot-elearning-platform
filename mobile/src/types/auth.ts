export interface User {
    id: string;
    email: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    phone: string | null;
    membership_type: "FREE" | "PRO";
    learning_streak: number;
    total_study_time: number;
    is_verified: boolean;
    created_at: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    username: string;
    full_name: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data?: {
        user: User;
        token: string;
    };
}
