import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '@/lib/useTranslation';

interface LoginFormProps {
  variant?: 'customer' | 'admin';
}

export const LoginForm: React.FC<LoginFormProps> = ({ variant = 'customer' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, redirectAfterLogin } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLockedUntil(null);
    setIsLoading(true);

    try {
      const { axiosInstance } = await import('@/lib/axiosInstance');
      const res = await axiosInstance.post('/api/auth/login', { email, password, remember_me: rememberMe });
      
      const { useAuthStore } = await import('@/store/authStore');
      useAuthStore.getState().setUser({
        id: res.data.id,
        email: res.data.email,
        firstName: res.data.first_name,
        lastName: res.data.last_name,
        role: res.data.role
      });
      
      const redirectPath = redirectAfterLogin || (res.data.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard');
      useAuthStore.getState().setRedirectAfterLogin(null);
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      if (err.response?.status === 423) {
        setLockedUntil(err.response.data.detail.locked_until);
        setError(err.response.data.detail.message);
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setError(err.response.data.detail.message);
      } else if (err.message === 'Network Error') {
        setError(t('networkError'));
        setPassword('');
      } else {
        setError(t('unexpectedError'));
        setPassword('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-ivory p-4">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-brand-white shadow-md">
        <div className={`p-6 text-center ${variant === 'admin' ? 'bg-brand-navy' : 'bg-brand-white border-b border-brand-gray'}`}>
          <h1 className="text-3xl font-light">
            <span className={variant === 'admin' ? 'text-brand-white' : 'text-brand-navy'}>Fikir</span>
            <span className="text-brand-gold font-medium">Biz</span>
          </h1>
          {variant === 'admin' && (
            <div className="mt-2 text-sm text-brand-gold font-medium tracking-widest uppercase">{t('adminLabel')}</div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded" aria-live="polite">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-brand-navy" htmlFor="email">
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-brand-gray px-3 py-2 placeholder-brand-gray focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold bg-brand-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nümunə@fikirbiz.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-navy" htmlFor="password">
              {t('password')}
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="block w-full rounded-md border border-brand-gray px-3 py-2 placeholder-brand-gray focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold bg-brand-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-3 text-brand-khaki hover:text-brand-navy"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              >
                {showPassword ? t('hidePassword') : t('showPassword')}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember_me"
                type="checkbox"
                className="h-4 w-4 rounded border-brand-gray text-brand-gold focus:ring-brand-gold"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember_me" className="ml-2 block text-sm text-brand-navy">
                {t('rememberMe')}
              </label>
            </div>
            {variant === 'customer' && (
              <div className="text-sm">
                <Link to="/forgot-password" className="text-brand-khaki hover:text-brand-navy">
                  {t('forgotPassword')}
                </Link>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !!lockedUntil}
            className="flex w-full justify-center rounded-md bg-brand-gold px-4 py-2 text-sm font-medium text-brand-navy hover:bg-[#B8962E] focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 disabled:bg-brand-gray disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-navy border-t-transparent"></div>
            ) : (
              t('signIn')
            )}
          </button>
        </form>
        
        {variant === 'customer' && (
          <div className="border-t border-brand-gray bg-brand-ivory/30 p-4 text-center text-sm">
            {t('noAccount')}{' '}
            <Link to="/register" className="font-medium text-brand-gold hover:text-[#B8962E]">
              {t('signUp')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
