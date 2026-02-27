import axios from "axios";
import { getToken } from "../utils/storage";

// For development: use your machine's local network IP
// For Expo Go on physical device: use your LAN IP (e.g. 192.168.x.x:3000)
// For emulator: use 10.0.2.2:3000 (Android) or localhost:3000 (iOS)
const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_URL ||
    (__DEV__
        ? "http://192.168.1.9:3001" // Match Next.js server running on port 3001 (fallback if no .env)
        : "https://your-production-url.com");

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
        config.headers.Cookie = `auth_token=${token}`;
    }
    return config;
});

// Handle auth errors globally
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid — handled by AuthContext
        }
        return Promise.reject(error);
    },
);

export default apiClient;
export { API_BASE_URL };
