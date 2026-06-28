import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/lib/useTranslation';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { useLanguageStore } from '@/store/languageStore';

export const RegisterForm: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<any>({});
  
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      const { axiosInstance } = await import('@/lib/axiosInstance');
      const res = await axiosInstance.post('/api/auth/register', {
        first_name: firstName,
        last_name: lastName,
        email,
        password
      });
      
      const { useAuthStore } = await import('@/store/authStore');
      useAuthStore.getState().setUser({
        id: res.data.id,
        email: res.data.email,
        firstName: res.data.first_name,
        lastName: res.data.last_name,
        role: res.data.role
      });
      
      navigate('/customer/dashboard', { replace: true });
    } catch (err: any) {
      if (err.message === 'Network Error') {
        setGlobalError(t('networkError'));
        setPassword('');
      } else if (err.response?.status === 409) {
        setFieldErrors({ email: err.response.data.detail.message });
      } else if (err.response?.status === 400 && err.response.data.detail.code === 'VALIDATION_ERROR') {
        setFieldErrors({ password: err.response.data.detail.errors });
      } else if (err.response?.status === 429) {
        setGlobalError(t('tooManyAttempts'));
      } else {
        setGlobalError(t('unexpectedError'));
        setPassword('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordErrors = () => {
    if (!fieldErrors.password || !Array.isArray(fieldErrors.password)) return null;
    
    const errMap: Record<string, string> = {
      TOO_SHORT: t('tooShort'),
      NO_UPPERCASE: t('noUppercase'),
      NO_DIGIT: t('noDigit'),
      NO_SPECIAL_CHAR: t('noSpecial')
    };

    return (
      <ul className="mt-2 text-xs text-red-600 list-disc list-inside">
        {fieldErrors.password.map((err: string) => (
          <li key={err}>{errMap[err] || err}</li>
        ))}
      </ul>
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-ivory p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher value={language} onChange={setLanguage} />
      </div>
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-brand-white shadow-md">
        <div className="p-6 text-center border-b border-brand-gray">
          <h1 className="text-3xl font-light">
            <span className="text-brand-navy">Fikir</span>
            <span className="text-brand-gold font-medium">Biz</span>
          </h1>
          <p className="mt-2 text-sm text-brand-khaki">{t('registerTitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {globalError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded" aria-live="polite">
              {globalError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-navy" htmlFor="firstName">
                {t('firstName')}
              </label>
              <input
                id="firstName"
                type="text"
                required
                maxLength={50}
                className="mt-1 block w-full rounded-md border border-brand-gray px-3 py-2 placeholder-brand-gray focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-navy" htmlFor="lastName">
                {t('lastName')}
              </label>
              <input
                id="lastName"
                type="text"
                required
                maxLength={50}
                className="mt-1 block w-full rounded-md border border-brand-gray px-3 py-2 placeholder-brand-gray focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-navy" htmlFor="email">
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              required
              maxLength={254}
              className={`mt-1 block w-full rounded-md border ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-brand-gray focus:ring-brand-gold'} px-3 py-2 focus:outline-none focus:ring-1`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            )}
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
                className={`block w-full rounded-md border ${fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-brand-gray focus:ring-brand-gold'} px-3 py-2 focus:outline-none focus:ring-1`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-3 text-brand-khaki hover:text-brand-navy"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? t('hidePassword') : t('showPassword')}
              </button>
            </div>
            {renderPasswordErrors()}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-md bg-brand-gold px-4 py-2 text-sm font-medium text-brand-navy hover:bg-[#B8962E] focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 disabled:bg-brand-gray disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-navy border-t-transparent"></div>
            ) : (
              t('createAccount')
            )}
          </button>
        </form>

        <div className="border-t border-brand-gray bg-brand-ivory/30 p-4 text-center text-sm">
          {t('hasAccount')}{' '}
          <Link to="/login" className="font-medium text-brand-gold hover:text-[#B8962E]">
            {t('signInLink')}
          </Link>
        </div>
      </div>
    </div>
  );
};
