import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { axiosInstance } from '@/lib/axiosInstance';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '@/lib/useTranslation';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { useLanguageStore } from '@/store/languageStore';

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
  
  const { redirectAfterLogin } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();

  const params = new URLSearchParams(window.location.search);
  const planFromUrl = params.get('plan') || 'basic';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLockedUntil(null);
    setIsLoading(true);

    try {
      const res = await axiosInstance.post('/api/auth/login', { email, password, remember_me: rememberMe });
      
      useAuthStore.getState().setUser({
        id: res.data.id,
        email: res.data.email,
        firstName: res.data.first_name,
        lastName: res.data.last_name,
        role: res.data.role,
        plan: res.data.plan || 'basic'
      });

      const plan = res.data.plan || 'basic';
      const redirectPath = redirectAfterLogin || (
        res.data.role === 'admin' ? '/admin/dashboard'
        : plan === 'pro' ? '/customer/pro/dashboard'
        : '/customer/dashboard'
      );
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F5F1EB] via-[#EFE7DC] to-[#E8DDD0] p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher value={language} onChange={setLanguage} />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-navy shadow-lg shadow-brand-navy/20 mb-4">
            <span className="text-xl font-light text-white">
              F<span className="text-brand-gold font-medium">B</span>
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {variant === 'admin' ? `${t('adminLabel')} — ` : ''}FikirBiz
          </h1>
          <p className="mt-1 text-sm text-brand-navy/50">
  {variant === 'admin' ? t('fikirBizProTagline') : planFromUrl === 'pro' ? t('fikirBizProTagline') : t('fikirBizBasicTagline')}
</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_8px_40px_rgba(13,27,42,0.06)] border border-white/60 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 text-sm text-red-600 bg-red-50/80 backdrop-blur-sm rounded-xl border border-red-200/50 flex items-start gap-2" aria-live="polite">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-brand-navy/80 mb-1.5" htmlFor="email">
                {t('email')}
              </label>
              <input
                id="email"
                type="email"
                required
                className="block w-full rounded-xl border border-black/[0.06] px-4 py-2.5 text-sm placeholder:text-brand-navy/25 focus:border-brand-gold/40 focus:outline-none focus:ring-2 focus:ring-brand-gold/10 bg-white/80 transition-all duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nümunə@fikirbiz.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-navy/80 mb-1.5" htmlFor="password">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full rounded-xl border border-black/[0.06] px-4 py-2.5 text-sm placeholder:text-brand-navy/25 focus:border-brand-gold/40 focus:outline-none focus:ring-2 focus:ring-brand-gold/10 bg-white/80 transition-all duration-200 pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-brand-navy/30 hover:text-brand-navy/60 text-xs font-medium transition-colors"
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
                  className="h-4 w-4 rounded border-black/20 text-brand-gold focus:ring-brand-gold/30 focus:ring-offset-0"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember_me" className="ml-2 block text-sm text-brand-navy/70">
                  {t('rememberMe')}
                </label>
              </div>
              {variant === 'customer' && (
                <div className="text-sm">
                  <Link to="/forgot-password" className="text-brand-navy/50 hover:text-brand-gold transition-colors">
                    {t('forgotPassword')}
                  </Link>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !!lockedUntil}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-navy to-[#162a40] px-4 py-3 text-sm font-semibold text-brand-gold hover:from-brand-navy hover:to-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-brand-navy/15"
            >
              {isLoading ? (
                <div className="h-5 w-5 rounded-full border-2 border-brand-gold/30 border-t-brand-gold animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {t('signIn')}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              )}
            </button>
          </form>
        </div>
        
        {variant === 'customer' && (
          <div className="mt-6 text-center text-sm text-brand-navy/50">
            {t('noAccount')}{' '}
            <Link to="/register" className="font-semibold text-brand-gold hover:text-brand-gold/80 transition-colors">
              {t('signUp')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
