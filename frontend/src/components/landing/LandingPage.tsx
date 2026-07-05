import React from 'react';
import { useNavigate } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-ivory font-sans text-brand-navy flex flex-col">
      {/* Top Banner */}
      <div className="bg-brand-navy text-white text-xs py-2.5 px-6 flex items-center justify-between">
        <span className="font-bold tracking-widest text-sm">FIKIRBIZ</span>
        <span className="text-brand-gray/80">Süni intellekt sürəti, İnsan toxunuşu</span>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: Logo Card */}
          <div className="flex justify-center">
            <div className="bg-white rounded-3xl shadow-lg p-8">
              <div className="flex items-start gap-8">
                {/* Left: Logo + Social */}
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-brand-navy rounded-2xl px-8 py-6 flex items-center justify-center">
                    <span className="text-2xl font-light text-white">
                      Fikir<span className="text-brand-gold font-medium">Biz</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="https://instagram.com/fikir_biz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy/5 text-brand-gray hover:bg-[#E4405F] hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    </a>
                    <a
                      href="https://linkedin.com/company/fikirbiz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy/5 text-brand-gray hover:bg-[#0A66C2] hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Right: Plan Buttons */}
                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="px-8 py-3 rounded-xl bg-brand-gold text-brand-navy font-semibold text-sm hover:bg-[#B8962E] transition-colors"
                  >
                    FikirBiz Basic
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-8 py-3 rounded-xl border-2 border-brand-gray/30 text-brand-navy font-semibold text-sm hover:border-brand-gold hover:bg-brand-gold/5 transition-colors"
                  >
                    FikirBiz Pro
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Text Content */}
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 text-brand-gold text-sm font-medium w-fit">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Süni intellekt ilə dizayn yaradın
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Fikirlərinizi <span className="text-brand-gold">Canva</span> dizaynlarına çevirin
            </h1>

            <p className="text-lg text-brand-khaki max-w-md">
              FikirBiz AI ilə istənilən dizaynı bir neçə saniyədə yaradın. Canva ilə birləşən güclü süni intellekt köməkçiniz.
            </p>

            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-3.5 rounded-xl bg-brand-navy text-brand-gold font-semibold hover:bg-brand-navy/90 transition-colors shadow-lg shadow-brand-navy/20"
              >
                Giriş Edin
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-3.5 rounded-xl border-2 border-brand-navy text-brand-navy font-semibold hover:bg-brand-navy hover:text-brand-gold transition-colors"
              >
                Qeydiyyatdan Keçin
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-gray/20 bg-white/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-brand-gray">
              <a href="/haqqimizda" className="hover:text-brand-gold transition-colors">Haqqımızda</a>
              <span className="text-brand-gray/30">|</span>
              <a href="/mexfilik" className="hover:text-brand-gold transition-colors">Məxfilik Siyasəti</a>
              <span className="text-brand-gray/30">|</span>
              <a href="/faq" className="hover:text-brand-gold transition-colors">FAQ</a>
            </div>
            <div className="text-xs text-brand-gray/60">
              © 2026 FikirBiz. Bütün hüquqlar qorunur.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
