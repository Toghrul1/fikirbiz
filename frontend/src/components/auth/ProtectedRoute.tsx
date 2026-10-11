import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  allowedRoles: ('admin' | 'customer')[];
  redirectTo?: string;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  allowedRoles, 
  redirectTo, 
  children 
}) => {
  const user = useAuthStore(s => s.user);
  const isLoading = useAuthStore(s => s.isLoading);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const setRedirectAfterLogin = useAuthStore(s => s.setRedirectAfterLogin);
  const checkAuth = useAuthStore(s => s.checkAuth);
  const location = useLocation();

  const hasAccess = !!isAuthenticated && !!user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!user) {
      checkAuth();
    }
  }, [checkAuth, user]);

  // Render zamanında store yazmaq yan effektdir — effect-ə köçürülür.
  useEffect(() => {
    if (!isLoading && !hasAccess) {
      setRedirectAfterLogin(location.pathname);
    }
  }, [isLoading, hasAccess, location.pathname, setRedirectAfterLogin]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-brand-ivory">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-gold border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    const defaultRedirect = allowedRoles.includes('admin') && allowedRoles.length === 1 
      ? '/admin/login' 
      : '/login';
    
    return <Navigate to={redirectTo || defaultRedirect} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Rol uyğun gəlmirsə öz dashboard-ına yönləndir
    const roleRedirect = user.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard';
    return <Navigate to={roleRedirect} replace />;
  }

  return <>{children}</>;
};
