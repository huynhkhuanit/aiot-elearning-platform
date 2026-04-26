import axios from "axios";
import { Platform } from "react-native";
import { getToken } from "../utils/storage";
import { getDevServerUrlFromGlobal, resolveApiBaseUrl } from "./apiBaseUrl";

function getApiBaseUrl(): string {
    return resolveApiBaseUrl({
        envUrl: process.env.EXPO_PUBLIC_API_URL,
        isDev: __DEV__,
        platform: Platform.OS,
        devServerUrl: getDevServerUrlFromGlobal(global as any),
    });
}

const API_BASE_URL = getApiBaseUrl();

if (__DEV__) {
    console.log("[API Client] Base URL:", API_BASE_URL);
}

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
        "X-Client-Platform": "mobile",
    },
});

apiClient.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
        if (Platform.OS !== "web") {
            (config.headers as any).Cookie = `auth_token=${token}`;
        }
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const serverMessage = error.response.data?.message;
            if (serverMessage) {
                const enhancedError = new Error(serverMessage);
                (enhancedError as any).status = error.response.status;
                (enhancedError as any).data = error.response.data;
                return Promise.reject(enhancedError);
            }
        } else if (error.request) {
            const networkError = new Error(
                "Khong the ket noi den server. Vui long kiem tra ket noi mang.",
            );
            (networkError as any).isNetworkError = true;
            return Promise.reject(networkError);
        }
        return Promise.reject(error);
    },
);

export default apiClient;
export { API_BASE_URL };
