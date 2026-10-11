import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const user = useAuthStore(s => s.user);
  const isLoading = useAuthStore(s => s.isLoading);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const setRedirectAfterLogin = useAuthStore(s => s.setRedirectAfterLogin);
  const checkAuth = useAuthStore(s => s.checkAuth);
  const location = useLocation();

  const isAuthorized = !!user && isAuthenticated && user.role === 'admin';

  useEffect(() => {
    if (!user) {
      checkAuth();
    }
  }, [checkAuth, user]);

  // Render zamanında store yazmaq olmaz — bu, yan effektdir.
  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      setRedirectAfterLogin(location.pathname);
    }
  }, [isLoading, isAuthorized, location.pathname, setRedirectAfterLogin]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0B1220]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#C9A227]/20 border-t-[#C9A227]" />
      </div>
    );
  }

  // Etibarlı admin tokeni yoxdursa və ya rol admin deyilsə /admin/login-ə yönləndir
  if (!isAuthorized) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
