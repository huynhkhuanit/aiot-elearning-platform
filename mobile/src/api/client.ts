import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { Platform } from "react-native";
import { getToken } from "../utils/storage";
import {
    getDevServerUrlFromGlobal,
    resolveApiBaseUrl,
    logApiUrlDiagnostics,
} from "./apiBaseUrl";

// ---------------------------------------------------------------------------
// API Base URL Resolution
// ---------------------------------------------------------------------------

function getApiBaseUrl(): string {
    const options = {
        envUrl: process.env.EXPO_PUBLIC_API_URL,
        isDev: __DEV__,
        platform: Platform.OS,
        devServerUrl: getDevServerUrlFromGlobal(global as any),
    };

    const url = resolveApiBaseUrl(options);
    logApiUrlDiagnostics(url, options);
    return url;
}

const API_BASE_URL = getApiBaseUrl();

if (__DEV__) {
    console.log("[API Client] Base URL:", API_BASE_URL);
}

// ---------------------------------------------------------------------------
// Axios Instance
// ---------------------------------------------------------------------------

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15_000,
    headers: {
        "Content-Type": "application/json",
        "X-Client-Platform": "mobile",
    },
});

// ---------------------------------------------------------------------------
// Network Error Classification
// ---------------------------------------------------------------------------

interface ClassifiedError extends Error {
    isNetworkError?: boolean;
    isTimeout?: boolean;
    status?: number;
    data?: unknown;
}

function isNetworkError(error: AxiosError): boolean {
    // No response received at all — the request was sent but no reply came back
    if (!error.response && error.request) return true;
    // Explicit Axios network error code
    if (error.code === "ERR_NETWORK") return true;
    return false;
}

function isTimeoutError(error: AxiosError): boolean {
    return (
        error.code === "ECONNABORTED" ||
        error.code === "ETIMEDOUT" ||
        error.message?.includes("timeout") === true
    );
}

// ---------------------------------------------------------------------------
// Request Interceptor — Attach Auth Token
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await getToken();
        if (token) {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${token}`;
            // React Native on device needs Cookie header for httpOnly cookie auth
            if (Platform.OS !== "web") {
                config.headers.Cookie = `auth_token=${token}`;
            }
        }
        return config;
    },
);

// ---------------------------------------------------------------------------
// Response Interceptor — Classify & Enhance Errors
// ---------------------------------------------------------------------------

apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        // --- Timeout ---
        if (isTimeoutError(error)) {
            const timeoutError: ClassifiedError = new Error(
                "Yêu cầu quá thời gian chờ. Vui lòng thử lại.",
            );
            timeoutError.isTimeout = true;
            timeoutError.isNetworkError = true;
            return Promise.reject(timeoutError);
        }

        // --- Network error (no response received) ---
        if (isNetworkError(error)) {
            const networkError: ClassifiedError = new Error(
                "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.",
            );
            networkError.isNetworkError = true;

            if (__DEV__) {
                console.warn("[API Client] Network error details:", {
                    url: error.config?.url,
                    baseURL: error.config?.baseURL,
                    code: error.code,
                    message: error.message,
                });
            }

            return Promise.reject(networkError);
        }

        // --- Server responded with an error status ---
        if (error.response) {
            const serverMessage = (error.response.data as any)?.message;
            if (serverMessage) {
                const enhancedError: ClassifiedError = new Error(
                    serverMessage,
                );
                enhancedError.status = error.response.status;
                enhancedError.data = error.response.data;
                return Promise.reject(enhancedError);
            }
        }

        return Promise.reject(error);
    },
);

export default apiClient;
export { API_BASE_URL };
