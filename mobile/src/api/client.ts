import axios from "axios";
import { Platform } from "react-native";
import { getToken } from "../utils/storage";

/**
 * Determine the correct API base URL based on environment:
 * - Uses EXPO_PUBLIC_API_URL env var if set
 * - Android emulator: 10.0.2.2 (special alias for host loopback)
 * - iOS simulator: localhost
 * - Physical device: set EXPO_PUBLIC_API_URL in your .env
 * - Production: your production URL
 */
function getApiBaseUrl(): string {
    // 1. Explicit env var takes highest priority
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    if (envUrl) return envUrl;

    // 2. Production
    if (!__DEV__) return "https://your-production-url.com";

    // 3. Development - try to extract host from Expo's dev server
    // In Expo, the global __DEV__ URL & scriptURL contain the dev machine's IP
    try {
        const scriptUrl =
            (global as any).__packages?.expo?.devTools?.origin ??
            (global as any).__expo_dev_server_address;

        if (scriptUrl) {
            const match = scriptUrl.match(
                /https?:\/\/([\d.]+|localhost)(:\d+)?/,
            );
            if (match) {
                return `http://${match[1]}:3000`;
            }
        }
    } catch {
        // Ignore and fall through
    }

    // 4. Fallback based on platform
    if (Platform.OS === "android") {
        return "http://10.0.2.2:3000"; // Android emulator → host loopback
    }
    return "http://localhost:3000"; // iOS simulator
}

const API_BASE_URL = getApiBaseUrl();

if (__DEV__) {
    console.log("[API Client] Base URL:", API_BASE_URL);
}

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
apiClient.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle errors globally and extract meaningful messages
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Server responded with error status — extract backend message
            const serverMessage = error.response.data?.message;
            if (serverMessage) {
                const enhancedError = new Error(serverMessage);
                (enhancedError as any).status = error.response.status;
                (enhancedError as any).data = error.response.data;
                return Promise.reject(enhancedError);
            }
        } else if (error.request) {
            // Request was made but no response received (network error)
            const networkError = new Error(
                "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.",
            );
            (networkError as any).isNetworkError = true;
            return Promise.reject(networkError);
        }
        return Promise.reject(error);
    },
);

export default apiClient;
export { API_BASE_URL };
