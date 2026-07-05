import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState<'basic' | 'pro'>('basic');

  return (
    <div className="min-h-screen flex flex-col font-sans text-brand-navy relative z-10">
      {/* Top horizontal bar */}
      <div className="w-full bg-brand-navy text-white px-6 py-2.5 flex justify-between items-center text-sm font-medium shadow-md">
        <span className="font-bold tracking-widest uppercase">fikirbiz</span>
        <span className="text-brand-gold italic">Süni intellekt sürəti, İnsan toxunuşu</span>
      </div>

      {/* Navigation / Header Area with Logo and Plan Selector */}
      <div className="w-full bg-white/80 backdrop-blur-md px-6 py-5 shadow-sm border-b border-brand-gray/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left side: Logo + Socials */}
        <div className="flex flex-col items-start gap-3">
          <img src="/logo.jpg" alt="FikirBiz" className="h-16 md:h-20 w-auto rounded-lg shadow-sm" />
          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com/fikirbiz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy/5 text-brand-navy hover:bg-[#E4405F] hover:text-white transition-all shadow-sm"
              aria-label="Instagram"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com/company/fikirbiz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy/5 text-brand-navy hover:bg-[#0A66C2] hover:text-white transition-all shadow-sm"
              aria-label="LinkedIn"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Right side: Plan Selector */}
        <div className="flex rounded-xl bg-brand-navy/5 p-1.5 shadow-inner">
          <button
            onClick={() => setActivePlan('basic')}
            className={`px-8 py-3 text-sm font-semibold rounded-lg transition-all ${
              activePlan === 'basic'
                ? 'bg-brand-gold text-brand-navy shadow-md transform scale-[1.02]'
                : 'text-brand-gray hover:text-brand-navy hover:bg-brand-navy/5'
            }`}
          >
            FikirBiz Basic
          </button>
          <button
            onClick={() => setActivePlan('pro')}
            className={`px-8 py-3 text-sm font-semibold rounded-lg transition-all ${
              activePlan === 'pro'
                ? 'bg-brand-gold text-brand-navy shadow-md transform scale-[1.02]'
                : 'text-brand-gray hover:text-brand-navy hover:bg-brand-navy/5'
            }`}
          >
            FikirBiz Pro
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-3xl w-full text-center">
          {/* Hero */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 text-brand-gold text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Süni intellekt ilə dizayn yaradın
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-navy mb-6 leading-tight">
              Fikirlərinizi <span className="text-brand-gold">Canva</span> dizaynlarına çevirin
            </h1>
            <p className="text-lg md:text-xl text-brand-khaki max-w-2xl mx-auto">
              FikirBiz AI ilə istənilən dizaynı bir neçə saniyədə yaradın. Canva ilə birləşən güclü süni intellekt.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-10 py-4 rounded-xl bg-brand-navy text-brand-gold font-bold text-lg hover:bg-brand-navy/90 transition-all shadow-xl shadow-brand-navy/20 hover:-translate-y-0.5"
            >
              Giriş Edin
            </button>
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-10 py-4 rounded-xl border-2 border-brand-navy text-brand-navy font-bold text-lg hover:bg-brand-navy hover:text-brand-gold transition-all shadow-lg shadow-transparent hover:shadow-brand-navy/20 hover:-translate-y-0.5"
            >
              Qeydiyyatdan Keçin
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
