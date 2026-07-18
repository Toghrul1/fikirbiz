import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F1EB] via-[#EFE7DC] to-[#E8DDD0] font-sans text-brand-navy flex flex-col">
      {/* Top Banner */}
      <div className="bg-brand-navy/95 text-white text-xs py-3 px-4 sm:px-6 flex items-center justify-between backdrop-blur-sm gap-2">
        <span className="font-bold tracking-[0.2em] text-xs sm:text-sm shrink-0">FIKIRBIZ</span>
        <span className="text-white/60 text-[10px] sm:text-xs text-right leading-tight">Süni intellekt sürəti, İnsan toxunuşu</span>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-16">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left: Logo Card */}
          <div className="flex justify-center animate-in fade-in slide-in-from-left duration-700">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_8px_40px_rgba(13,27,42,0.08)] border border-white/60 p-6 sm:p-8 w-full max-w-md">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-8">
                {/* Left: Logo + Social */}
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-brand-navy w-28 h-28 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-navy/20 ring-1 ring-white/10">
                    <span className="text-2xl font-light text-white">
                      Fikir<span className="text-brand-gold font-medium">Biz</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <a
                      href="https://instagram.com/fikir_biz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-navy/[0.04] text-brand-gray hover:bg-[#E4405F] hover:text-white hover:shadow-lg hover:shadow-[#E4405F]/20 transition-all duration-300"
                    >
                      <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    </a>
                    <a
                      href="https://linkedin.com/company/fikirbiz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-navy/[0.04] text-brand-gray hover:bg-[#0A66C2] hover:text-white hover:shadow-lg hover:shadow-[#0A66C2]/20 transition-all duration-300"
                    >
                      <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Right: Plan Buttons */}
                <div className="flex flex-col gap-3 sm:pt-2 w-full sm:w-auto">
                  <button
                    onClick={() => navigate('/login?plan=basic')}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-brand-gold to-[#C5A031] text-brand-navy font-semibold text-sm shadow-lg shadow-brand-gold/25 hover:shadow-xl hover:shadow-brand-gold/30 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    FikirBiz Basic
                  </button>
                  <button
                    onClick={() => navigate('/login?plan=pro')}
                    className="px-8 py-3 rounded-xl border-2 border-brand-navy/10 text-brand-navy font-semibold text-sm hover:border-brand-gold/50 hover:bg-brand-gold/5 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    FikirBiz Pro
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Text Content */}
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right duration-700 delay-200">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-gold/15 to-brand-gold/5 text-brand-gold text-sm font-medium w-fit border border-brand-gold/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Süni intellekt ilə dizayn hazırlayın
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
              Fikirlərinizi{' '}
              <span className="bg-gradient-to-r from-brand-gold to-[#C5A031] bg-clip-text text-transparent">
                Canva
              </span>{' '}
              dizaynlarına çevirin
            </h1>

            <p className="text-base sm:text-lg text-brand-khaki/80 max-w-md leading-relaxed">
              FikirBiz AI ilə istənilən dizaynı bir neçə saniyədə hazırlayın. Canva ilə birləşən güclü süni intellekt köməkçiniz.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-2">
              <button
                onClick={() => navigate('/login')}
                className="group w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-navy text-brand-gold font-semibold hover:bg-brand-navy/90 transition-all duration-200 shadow-xl shadow-brand-navy/20 hover:shadow-2xl hover:shadow-brand-navy/30 hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2">
                  Giriş Edin
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </button>
              <button
                onClick={() => navigate('/register')}
                className="group w-full sm:w-auto px-8 py-3.5 rounded-xl border-2 border-brand-navy/20 text-brand-navy font-semibold hover:bg-brand-navy hover:text-brand-gold hover:border-brand-navy transition-all duration-200 hover:-translate-y-0.5"
              >
                Qeydiyyatdan Keçin
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-xs text-brand-khaki/50">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pullu Canva inteqrasiyası
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                1000+ istifadəçi
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/40 bg-white/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-5 text-sm text-brand-navy/50">
              <Link to="/haqqimizda" className="hover:text-brand-gold transition-colors duration-200">Haqqımızda</Link>
              <span className="text-brand-navy/20">|</span>
              <Link to="/mexfilik" className="hover:text-brand-gold transition-colors duration-200">Məxfilik Siyasəti</Link>
              <span className="text-brand-navy/20">|</span>
              <Link to="/faq" className="hover:text-brand-gold transition-colors duration-200">FAQ</Link>
            </div>
            <div className="text-xs text-brand-navy/40">
              © 2026 FikirBiz. Bütün hüquqlar qorunur.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
