"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { PublicUser } from '@/types/auth';

interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    user?: PublicUser;
    recoveryKeys?: string[];
  };
}

interface AuthContextType {
  user: PublicUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  username: string;
  full_name: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Read CSRF token from cookie for inclusion in mutating requests.
 */
function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Fetch wrapper that automatically includes CSRF token
 * in the `x-csrf-token` header for mutating requests.
 */
async function secureFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers);

  // Include CSRF token for mutating methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch CSRF token on mount
  useEffect(() => {
    const initCSRF = async () => {
      try {
        // Only fetch if no CSRF cookie exists yet
        if (!getCSRFToken()) {
          await fetch('/api/auth/csrf', { credentials: 'include' });
        }
      } catch {
        // CSRF fetch failure is non-fatal
      }
    };
    initCSRF();
  }, []);

  // Check authentication status on mount
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.user) {
          setUser(data.data.user);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await secureFetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      if (data.success && data.data) {
        setUser(data.data.user);
      }
      
      // Refresh to get full user data including role
      await checkAuth();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (registerData: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await secureFetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng ký thất bại');
      }

      // After successful registration, user needs to login
      return data;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await secureFetch('/api/auth/logout', {
        method: 'POST',
      });

      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear state even if API call fails
      setUser(null);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    await checkAuth();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export secureFetch for use in other components
export { secureFetch, getCSRFToken };
