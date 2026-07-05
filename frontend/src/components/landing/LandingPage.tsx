import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState<'basic' | 'pro'>('basic');

  return (
    <div className="min-h-screen flex flex-col font-sans text-brand-navy relative z-10 bg-brand-ivory">
      {/* Top horizontal bar */}
      <div className="w-full bg-brand-navy text-white px-6 py-2.5 flex justify-between items-center text-sm font-medium shadow-md">
        <span className="font-bold tracking-widest uppercase">fikirbiz</span>
        <span className="text-brand-gold italic">Süni intellekt sürəti, İnsan toxunuşu</span>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 px-6 py-12 w-full max-w-7xl mx-auto">
        
        {/* Left Column: Logo & Plan Block */}
        <div className="flex flex-col sm:flex-row items-center gap-8 bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-brand-gray/10 shrink-0">
          
          {/* Logo & Socials */}
          <div className="flex flex-col items-center gap-5">
            <img src="/logo.jpg" alt="FikirBiz" className="w-32 lg:w-40 h-auto rounded-2xl shadow-lg transition-transform hover:scale-105" />
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com/fikir_biz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-navy/5 text-brand-navy hover:bg-[#E4405F] hover:text-white transition-all shadow-sm hover:shadow-md"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com/company/fikirbiz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-navy/5 text-brand-navy hover:bg-[#0A66C2] hover:text-white transition-all shadow-sm hover:shadow-md"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

        </div>

        {/* Right Column: Hero Content */}
        <div className="max-w-2xl text-center lg:text-left flex flex-col items-center lg:items-start">
          <div className="mb-10">
            {activePlan === 'pro' ? (
              <>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-gold/10 text-brand-gold text-sm font-semibold mb-8">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Süni intellekt ilə dizayn hazırlayın
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-brand-navy mb-8 leading-tight tracking-tight">
                  Fikirlərinizi <br className="hidden lg:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-yellow-500">
                    Canva
                  </span> dizaynlarına çevirin
                </h1>
                <p className="text-xl text-brand-khaki max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  FikirBiz AI ilə istənilən dizaynı bir neçə saniyədə hazırlayın. Canva ilə birləşən güclü süni intellekt köməkçiniz.
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-gold/10 text-brand-gold text-sm font-semibold mb-8">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                  Süni intellekt ilə SMM xidməti
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-brand-navy mb-8 leading-tight tracking-tight">
                  Sosial medianı <br className="hidden lg:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-yellow-500">
                    Süni İntellektlə
                  </span> idarə edin
                </h1>
                <p className="text-xl text-brand-khaki max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  FikirBiz AI ilə peşəkar postlar, mətnlər və tam SMM strategiyasını bir neçə saniyədə hazırlayın. Rəqəmsal varlığınızı gücləndirin.
                </p>
              </>
            )}
          </div>

          {/* Plan Options as CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-5 w-full lg:w-auto">
            <button
              onClick={() => setActivePlan('basic')}
              className={`w-full sm:w-auto px-10 py-4 text-lg font-bold rounded-xl transition-all ${
                activePlan === 'basic'
                  ? 'bg-brand-gold text-brand-navy shadow-xl shadow-brand-gold/20 transform scale-105'
                  : 'bg-brand-navy/5 text-brand-navy border-2 border-transparent hover:border-brand-navy/20 hover:bg-brand-navy/10 hover:-translate-y-1'
              }`}
            >
              FikirBiz Basic
            </button>
            <button
              onClick={() => setActivePlan('pro')}
              className={`w-full sm:w-auto px-10 py-4 text-lg font-bold rounded-xl transition-all ${
                activePlan === 'pro'
                  ? 'bg-brand-gold text-brand-navy shadow-xl shadow-brand-gold/20 transform scale-105'
                  : 'bg-brand-navy/5 text-brand-navy border-2 border-transparent hover:border-brand-navy/20 hover:bg-brand-navy/10 hover:-translate-y-1'
              }`}
            >
              FikirBiz Pro
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-gray/20 bg-white/80 backdrop-blur-md mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm font-medium text-brand-navy">
              <a href="/haqqimizda" className="hover:text-brand-gold transition-colors">Haqqımızda</a>
              <span className="text-brand-gray/30 hidden md:inline">|</span>
              <a href="/mexfilik" className="hover:text-brand-gold transition-colors">Məxfilik Siyasəti</a>
              <span className="text-brand-gray/30 hidden md:inline">|</span>
              <a href="/faq" className="hover:text-brand-gold transition-colors">FAQ</a>
            </div>
            <div className="text-xs text-brand-gray/60 font-medium">
              © 2026 FikirBiz. Bütün hüquqlar qorunur.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
