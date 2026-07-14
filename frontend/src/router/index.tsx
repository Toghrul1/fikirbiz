import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { CanvaCallback } from '@/components/auth/CanvaCallback';
import App from '@/App';
import { LandingPage } from '@/components/landing/LandingPage';

const CustomerDashboard = lazy(() => import('@/components/customer/CustomerDashboard'));
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard'));
const ContentGenerator = lazy(() => import('@/components/content/ContentGenerator'));
const ChatInterface = lazy(() => import('@/components/chat/ChatInterface'));

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
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginForm variant="customer" />,
  },
  {
    path: '/admin/login',
    element: <LoginForm variant="admin" />,
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
    children: [
      {
        path: 'dashboard',
        element: <LazyLoaded><CustomerDashboard /></LazyLoaded>,
      },
      {
        path: 'chat',
        element: <LazyLoaded><ChatInterface /></LazyLoaded>,
      },
      {
        path: 'content',
        element: <LazyLoaded><ContentGenerator /></LazyLoaded>,
      }
    ]
  },
  {
    path: '/admin/*',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <App />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <LazyLoaded><AdminDashboard /></LazyLoaded>,
      }
    ]
  },
]);
