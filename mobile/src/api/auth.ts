import apiClient from "./client";
import {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    User,
} from "../types/auth";

export async function login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
        "/api/auth/login",
        data,
    );
    return response.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
        "/api/auth/register",
        data,
    );
    return response.data;
}

export async function getMe(): Promise<{
    success: boolean;
    data: { user: User };
}> {
    const response = await apiClient.get("/api/auth/me");
    return response.data;
}

export async function logout(): Promise<void> {
    try {
        await apiClient.post("/api/auth/logout");
    } catch {
        // Ignore logout errors — we clear local state anyway
    }
}
