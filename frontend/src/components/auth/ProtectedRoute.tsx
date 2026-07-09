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
  const { user, isLoading, isAuthenticated, setRedirectAfterLogin, checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      checkAuth();
    }
  }, [checkAuth, user]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-brand-ivory">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-gold border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Saxla və redirect et
    setRedirectAfterLogin(location.pathname);
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
