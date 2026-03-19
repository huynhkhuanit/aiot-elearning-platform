import type { AppRole, ProfileBadge } from "@/types/profile";

// User types matching MySQL schema
export interface User {
  id: string;
  email: string;
  password_hash: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  membership_type: 'FREE' | 'PRO';
  membership_expires_at: Date | null;
  learning_streak: number;
  total_study_time: number;
  is_active: boolean;
  is_verified: boolean;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Public user data (without sensitive info)
export interface PublicUser {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  role?: AppRole;
  roles: AppRole[];
  primaryRole: AppRole;
  membership_type: 'FREE' | 'PRO';
  learning_streak: number;
  total_study_time: number;
  is_verified: boolean;
  created_at: Date;
  badges?: ProfileBadge[];
  // Social media links
  website?: string | null;
  linkedin?: string | null;
  github?: string | null;
  twitter?: string | null;
  facebook?: string | null;
}

// Auth payload for JWT
export interface AuthPayload {
  userId: string;
  email: string;
  username: string;
  membership_type: 'FREE' | 'PRO';
}

// Login/Register request types
export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  full_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  user: PublicUser;
  token: string;
}
