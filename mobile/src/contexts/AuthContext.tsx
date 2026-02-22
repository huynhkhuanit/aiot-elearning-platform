import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "../types/auth";
import * as authApi from "../api/auth";
import { getToken, setToken, setUser as saveUser, clearAuth } from "../utils/storage";
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    checkAuth();
  }, []);
  const checkAuth = async () => {
    try {
      const token = await getToken();
      if (token) {
        const response = await authApi.getMe();
        if (response.success && response.data?.user) {
          setUser(response.data.user);
        } else {
          await clearAuth();
        }
      }
    } catch {
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  };
  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({
      email,
      password
    });
    if (!response.success || !response.data) {
      throw new Error(response.message || "Đăng nhập thất bại");
    }
    await setToken(response.data.token);
    await saveUser(response.data.user);
    setUser(response.data.user);
  }, []);
  const register = useCallback(async (email: string, password: string, username: string, fullName: string) => {
    const response = await authApi.register({
      email,
      password,
      username,
      full_name: fullName
    });
    if (!response.success || !response.data) {
      throw new Error(response.message || "Đăng ký thất bại");
    }
    await setToken(response.data.token);
    await saveUser(response.data.user);
    setUser(response.data.user);
  }, []);
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      await clearAuth();
      setUser(null);
    }
  }, []);
  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getMe();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        await saveUser(response.data.user);
      }
    } catch {
      // Silent fail
    }
  }, []);
  return <AuthContext.Provider value={{
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser
  }}>
            {children}
        </AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}