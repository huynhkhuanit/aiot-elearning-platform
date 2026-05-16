import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import { User } from "../types/auth";
import * as authApi from "../api/auth";
import {
    getToken,
    getUser as loadCachedUser,
    setToken,
    setUser as saveUser,
    clearAuth,
} from "../utils/storage";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isOffline: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (
        email: string,
        password: string,
        username: string,
        fullName: string,
    ) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Determines whether an error represents a network/connectivity failure
 * (as opposed to an authentication error like 401).
 */
function isNetworkFailure(error: any): boolean {
    if (error?.isNetworkError === true) return true;
    if (error?.isTimeout === true) return true;
    const msg = error?.message?.toLowerCase?.() ?? "";
    return (
        msg.includes("network") ||
        msg.includes("kết nối") ||
        msg.includes("ket noi") ||
        msg.includes("timeout") ||
        msg.includes("econnrefused") ||
        msg.includes("econnaborted")
    );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOffline, setIsOffline] = useState(false);
    const hasCheckedAuth = useRef(false);

    // -----------------------------------------------------------------------
    // Check for existing auth on mount
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!hasCheckedAuth.current) {
            hasCheckedAuth.current = true;
            checkAuth();
        }
    }, []);

    // -----------------------------------------------------------------------
    // Re-validate auth when app comes back to foreground
    // -----------------------------------------------------------------------
    useEffect(() => {
        const handleAppStateChange = (nextState: AppStateStatus) => {
            if (nextState === "active" && hasCheckedAuth.current) {
                silentRefreshUser();
            }
        };

        const subscription = AppState.addEventListener(
            "change",
            handleAppStateChange,
        );
        return () => subscription.remove();
    }, []);

    // -----------------------------------------------------------------------
    // Core auth check — runs on mount
    // Differentiates between "no valid session" and "network unreachable":
    //   - Network error → keep cached user, set isOffline
    //   - Auth error (401/403) → clear session
    //   - No token → no-op, just finish loading
    // -----------------------------------------------------------------------
    const checkAuth = async () => {
        try {
            const token = await getToken();
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await authApi.getMe();
                if (response.success && response.data?.user) {
                    setUser(response.data.user);
                    await saveUser(response.data.user);
                    setIsOffline(false);
                } else {
                    // Server reachable but auth invalid → clear
                    await clearAuth();
                    setUser(null);
                }
            } catch (error: any) {
                if (isNetworkFailure(error)) {
                    // Network unreachable — try to restore from cache
                    if (__DEV__) {
                        console.log(
                            "[AuthContext] Network unreachable, loading cached user",
                        );
                    }
                    const cachedUser = await loadCachedUser();
                    if (cachedUser) {
                        setUser(cachedUser);
                    }
                    setIsOffline(true);
                } else {
                    // Server reachable, but returned non-network error
                    // (e.g. 401 Unauthorized, 403 Forbidden)
                    if (__DEV__) {
                        console.log(
                            "[AuthContext] Auth check failed (non-network):",
                            error?.status ?? error?.message,
                        );
                    }
                    await clearAuth();
                    setUser(null);
                }
            }
        } catch (error) {
            // Storage access failure (very rare)
            if (__DEV__) {
                console.log(
                    "[AuthContext] Storage access failed:",
                    error,
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    // -----------------------------------------------------------------------
    // Silent refresh — runs on app foreground, does not show loading state
    // -----------------------------------------------------------------------
    const silentRefreshUser = async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const response = await authApi.getMe();
            if (response.success && response.data?.user) {
                setUser(response.data.user);
                await saveUser(response.data.user);
                setIsOffline(false);
            }
        } catch (error: any) {
            if (isNetworkFailure(error)) {
                setIsOffline(true);
            }
            // Silently ignore — don't disrupt current session
        }
    };

    // -----------------------------------------------------------------------
    // Login
    // -----------------------------------------------------------------------
    const login = useCallback(async (email: string, password: string) => {
        const response = await authApi.login({ email, password });
        if (!response.success || !response.data) {
            throw new Error(response.message || "Đăng nhập thất bại");
        }
        const session = authApi.normalizeAuthResponse(response);
        await setToken(session.token);
        await saveUser(session.user);
        setUser(session.user);
        setIsOffline(false);
    }, []);

    // -----------------------------------------------------------------------
    // Register
    // -----------------------------------------------------------------------
    const register = useCallback(
        async (
            email: string,
            password: string,
            username: string,
            fullName: string,
        ) => {
            const response = await authApi.register({
                email,
                password,
                username,
                full_name: fullName,
            });
            if (!response.success || !response.data) {
                throw new Error(response.message || "Đăng ký thất bại");
            }
            const session = authApi.normalizeAuthResponse(response);
            await setToken(session.token);
            await saveUser(session.user);
            setUser(session.user);
            setIsOffline(false);
        },
        [],
    );

    // -----------------------------------------------------------------------
    // Logout
    // -----------------------------------------------------------------------
    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } finally {
            await clearAuth();
            setUser(null);
        }
    }, []);

    // -----------------------------------------------------------------------
    // Manual refresh
    // -----------------------------------------------------------------------
    const refreshUser = useCallback(async () => {
        try {
            const response = await authApi.getMe();
            if (response.success && response.data?.user) {
                setUser(response.data.user);
                await saveUser(response.data.user);
                setIsOffline(false);
            }
        } catch (error: any) {
            if (isNetworkFailure(error)) {
                setIsOffline(true);
            }
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                isOffline,
                login,
                register,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}
