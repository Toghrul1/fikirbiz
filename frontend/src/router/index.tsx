import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { CanvaCallback } from '@/components/auth/CanvaCallback';
import { CustomerDashboard } from '@/components/customer/CustomerDashboard';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { ContentGenerator } from '@/components/content/ContentGenerator';
import App from '@/App';
import { ChatInterface } from '@/components/chat/ChatInterface';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
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
        element: <CustomerDashboard />,
      },
      {
        path: 'chat',
        element: <ChatInterface />,
      },
      {
        path: 'content',
        element: <ContentGenerator />,
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
        element: <AdminDashboard />,
      }
    ]
  },
]);
