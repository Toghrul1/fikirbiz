import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { CanvaCallback } from '@/components/auth/CanvaCallback';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { AdminProtectedRoute } from '@/components/admin/AdminProtectedRoute';
import App from '@/App';
import { LandingPage } from '@/components/landing/LandingPage';
import { RouteError } from '@/components/common/RouteError';
import { NavigationBridge } from '@/components/common/NavigationBridge';

const CustomerDashboard = lazy(() => import('@/components/customer/CustomerDashboard'));
const ProDashboard = lazy(() => import('@/components/customer/ProDashboard'));
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard'));
const ContentGenerator = lazy(() => import('@/components/content/ContentGenerator'));
const ImageGenerator = lazy(() => import('@/components/images/ImageGenerator'));

function LazyLoaded({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-brand-ivory">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
      </div>
    }>
      {children}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  // Bütün route-lar bu layout route-un içindədir: NavigationBridge
  // router-u qeydə alır ki, axios interceptor tam səhifə yeniləmədən
  // naviqasiya edə bilsin.
  {
    element: <NavigationBridge />,
    children: [
  {
    path: '/',
    element: <LandingPage />,
    // Bu səhifə də daxil olmaqla bütün route xətaları üçün.
    errorElement: <RouteError />,
  },
  {
    path: '*',
    element: <RouteError notFound />,
  },
  {
    path: '/login',
    element: <LoginForm variant="customer" />,
  },
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
  {
    path: '/register',
    element: <RegisterForm />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordForm />,
  },
  {
    path: '/reset-password/:token',
    element: <ResetPasswordForm />,
  },
  {
    path: '/canva/callback',
    element: <CanvaCallback />,
  },
  {
    path: '/customer/*',
    element: (
      <ProtectedRoute allowedRoles={['customer']}>
        <App />
      </ProtectedRoute>
    ),
    errorElement: <RouteError />,
    children: [
      {
        path: 'dashboard',
        element: <LazyLoaded><CustomerDashboard /></LazyLoaded>,
      },
      {
        path: 'pro/dashboard',
        element: <LazyLoaded><ProDashboard /></LazyLoaded>,
      },
      {
        path: 'chat',
        element: <Navigate to="/customer/pro/dashboard" replace />,
      },
      {
        path: 'content',
        element: <LazyLoaded><ContentGenerator /></LazyLoaded>,
      },
      {
        path: 'images',
        element: <LazyLoaded><ImageGenerator /></LazyLoaded>,
      }
    ]
  },
  {
    path: '/admin/*',
    element: <AdminProtectedRoute><Outlet /></AdminProtectedRoute>,
    errorElement: <RouteError />,
    children: [
      {
        path: '',
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <LazyLoaded><AdminDashboard /></LazyLoaded>,
      },
      {
        path: 'pending-users',
        element: <LazyLoaded><AdminDashboard /></LazyLoaded>,
      }
    ]
  },
    ],
  },
]);
