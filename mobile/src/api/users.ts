import apiClient from "./client";
import { UserProfile } from "../types/user";

export async function fetchProfile(): Promise<{
    success: boolean;
    data: UserProfile;
}> {
    const response = await apiClient.get("/api/auth/me");
    return {
        ...response.data,
        data: response.data?.data?.user,
    };
}

export async function updateProfile(
    data: Partial<UserProfile>,
): Promise<{ success: boolean; data: UserProfile }> {
    const response = await apiClient.put("/api/users/profile", data);
    return response.data;
}

export async function fetchEnrolledCourses(): Promise<{
    success: boolean;
    data: any[];
}> {
    const response = await apiClient.get("/api/users/me/courses");
    return {
        ...response.data,
        data: response.data?.data?.courses ?? [],
    };
}
