import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '@/lib/axiosInstance';
import { useAuthStore, toAuthUser } from '@/store/authStore';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await axiosInstance.post('/api/admin/login', { email, password });

      useAuthStore.getState().setUser({
        ...toAuthUser(res.data),
        isApproved: true,
      });

      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 423) {
        setError(detail?.message || 'Hesab kilidli, bir müddət sonra yenidən cəhd edin');
      } else if (detail?.message) {
        setError(detail.message);
      } else if (err.message === 'Network Error') {
        setError('Serverə qoşulmaq mümkün olmadı');
        setPassword('');
      } else {
        setError('Gözlənilməz xəta baş verdi');
        setPassword('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B1220] p-4 font-sans">
      {/* Dekorativ fon detalları */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#1E3A5F]/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-[#16293D]/40 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl border border-[#C9A227]/30 bg-gradient-to-br from-[#1C2A3D] to-[#101B2A] shadow-[0_0_40px_rgba(201,162,39,0.12)] mb-5">
            <span className="text-lg font-semibold tracking-wide text-[#C9A227]">
              F<span className="text-white">B</span>
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Admin Panel
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            FikirBiz idarəetmə sisteminə giriş
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm shadow-2xl shadow-black/40 p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                className="flex items-start gap-2.5 rounded-lg border border-red-500/25 bg-red-500/10 p-3.5 text-sm text-red-300"
                role="alert"
                aria-live="polite"
              >
                <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="admin-email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                E-poçt
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="username"
                className="block w-full rounded-lg border border-white/10 bg-[#0D1524] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fikirbiz.com"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                Şifrə
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="block w-full rounded-lg border border-white/10 bg-[#0D1524] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-[#C9A227]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/15 transition-all pr-16"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Gizlət' : 'Göstər'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#C9A227] to-[#A8861F] px-4 py-3 text-sm font-semibold text-[#0B1220] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/40 focus:ring-offset-2 focus:ring-offset-[#0B1220] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0B1220]/30 border-t-[#0B1220]" />
              ) : (
                <span className="flex items-center gap-2">
                  Giriş et
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          Bu səhifə yalnız səlahiyyətli sistem adminləri üçündür.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
