import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, isLoading, isAuthenticated, setRedirectAfterLogin, checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      checkAuth();
    }
  }, [checkAuth, user]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0B1220]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#C9A227]/20 border-t-[#C9A227]" />
      </div>
    );
  }

  // Etibarlı admin tokeni yoxdursa və ya rol admin deyilsə /admin/login-ə yönləndir
  if (!isAuthenticated || !user || user.role !== 'admin') {
    setRedirectAfterLogin(location.pathname);
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
