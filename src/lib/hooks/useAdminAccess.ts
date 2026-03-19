import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  role?: string;
  full_name: string;
}

/**
 * Hook để kiểm tra xem user có phải admin/teacher không
 * Không redirect, chỉ trả về hasAccess status
 * Component sẽ hiển thị lock icon nếu user không có quyền
 */
export function useAdminAccess() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading, isAuthenticated } = useAuth();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    // Nếu đang load auth, chờ
    if (authLoading) {
      return;
    }

    // Nếu chưa đăng nhập - redirect về login
    if (!isAuthenticated || !authUser) {
      router.replace('/auth/login');
      setLoading(false);
      return;
    }

    // User đã đăng nhập
    setUser({
      id: authUser.id,
      username: authUser.username,
      email: authUser.email,
      full_name: authUser.full_name,
      role: authUser.role,
    });

    const userRole = authUser.role?.toLowerCase();

    // Chỉ admin hoặc teacher mới có access
    if (
      userRole === 'admin' ||
      userRole === 'instructor' ||
      userRole === 'teacher'
    ) {
      setHasAccess(true);
    } else {
      // User đã đăng nhập nhưng không có quyền
      setHasAccess(false);
    }

    setLoading(false);
  }, [authLoading, isAuthenticated, authUser, router]);

  return { user, loading, hasAccess };
}
