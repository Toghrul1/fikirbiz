import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/lib/useTranslation';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { useLanguageStore } from '@/store/languageStore';

export const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const { axiosInstance } = await import('@/lib/axiosInstance');
      const res = await axiosInstance.post('/api/auth/forgot-password', { email });
      setSuccessMsg(res.data.message || t('resetSuccess'));
    } catch (err: any) {
      if (err.response?.status === 429) {
        setErrorMsg(t('tooManyAttempts'));
      } else {
        setErrorMsg(t('unexpectedError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-ivory p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher value={language} onChange={setLanguage} />
      </div>
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-brand-white shadow-md p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-medium text-brand-navy">{t('forgotPasswordTitle')}</h2>
          <p className="mt-2 text-sm text-brand-khaki">
            {t('forgotPasswordDesc')}
          </p>
        </div>

        {successMsg ? (
          <div className="space-y-6">
            <div className="p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md text-center" aria-live="polite">
              {successMsg}
            </div>
            <Link
              to="/login"
              className="flex w-full justify-center rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-brand-white hover:bg-[#162a40] transition-colors"
            >
              {t('backToLogin')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded" aria-live="polite">
                {errorMsg}
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
                className="mt-1 block w-full rounded-md border border-brand-gray px-3 py-2 placeholder-brand-gray focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md bg-brand-gold px-4 py-2 text-sm font-medium text-brand-navy hover:bg-[#B8962E] focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 disabled:bg-brand-gray disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-navy border-t-transparent"></div>
              ) : (
                t('sendResetLink')
              )}
            </button>
            
            <div className="text-center text-sm">
              <Link to="/login" className="font-medium text-brand-navy hover:text-brand-khaki">
                {t('backToLogin')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
