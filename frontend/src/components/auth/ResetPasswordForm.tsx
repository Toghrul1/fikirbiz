import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

export const ResetPasswordForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Component mount olanda tokeni validate et
    const validateToken = async () => {
      try {
        const { axiosInstance } = await import('@/lib/axiosInstance');
        await axiosInstance.get(`/api/auth/reset-password/${token}`);
        setIsTokenValid(true);
      } catch (err: any) {
        setTokenError(err.response?.data?.detail?.message || 'Bu link artıq etibarsızdır');
        setIsTokenValid(false);
      } finally {
        setIsValidatingToken(false);
      }
    };
    
    if (token) validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitErrors([]);

    try {
      const { axiosInstance } = await import('@/lib/axiosInstance');
      await axiosInstance.post(`/api/auth/reset-password/${token}`, {
        new_password: password
      });
      setSuccess(true);
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data.detail.code === 'VALIDATION_ERROR') {
        const errMap: Record<string, string> = {
          TOO_SHORT: "Minimum 8 simvol",
          NO_UPPERCASE: "Ən azı bir böyük hərf",
          NO_DIGIT: "Ən azı bir rəqəm",
          NO_SPECIAL_CHAR: "Ən azı bir xüsusi simvol (!@#$%^&*)"
        };
        setSubmitErrors(err.response.data.detail.errors.map((e: string) => errMap[e] || e));
      } else {
        setSubmitErrors(['Gözlənilməz xəta baş verdi. Yenidən cəhd edin.']);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidatingToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-ivory">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-gold border-t-transparent"></div>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-ivory p-4">
        <div className="w-full max-w-md rounded-lg bg-brand-white shadow-md p-8 text-center space-y-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-brand-navy">Etibarsız Link</h2>
          <p className="text-sm text-brand-khaki">{tokenError}</p>
          <Link
            to="/forgot-password"
            className="inline-flex w-full justify-center rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-brand-white hover:bg-[#162a40] transition-colors"
          >
            Yeni link tələb et
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-ivory p-4">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-brand-white shadow-md p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-medium text-brand-navy">Yeni Şifrə</h2>
          <p className="mt-2 text-sm text-brand-khaki">
            Xahiş edirik yeni şifrənizi daxil edin.
          </p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md text-center">
              Şifrəniz uğurla yeniləndi!
            </div>
            <Link
              to="/login"
              className="flex w-full justify-center rounded-md bg-brand-gold px-4 py-2 text-sm font-medium text-brand-navy hover:bg-[#B8962E] transition-colors"
            >
              Daxil ol
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-brand-navy" htmlFor="password">
                Yeni Şifrə
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`block w-full rounded-md border ${submitErrors.length > 0 ? 'border-red-500 focus:ring-red-500' : 'border-brand-gray focus:ring-brand-gold'} px-3 py-2 focus:outline-none focus:ring-1`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-brand-khaki hover:text-brand-navy"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Gizlət' : 'Göstər'}
                </button>
              </div>
              
              {submitErrors.length > 0 && (
                <ul className="mt-2 text-xs text-red-600 list-disc list-inside">
                  {submitErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-brand-white hover:bg-[#162a40] focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2 disabled:bg-brand-gray disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-white border-t-transparent"></div>
              ) : (
                'Şifrəni yenilə'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
