import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '@/lib/useTranslation';
import { useLanguageStore } from '@/store/languageStore';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import type { TranslationKey } from '@/lib/translations';

const BrandingIcon = (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25A9.75 9.75 0 002.25 12c0 5.385 4.365 9.75 9.75 9.75 1.795 0 2.25-1.5 2.25-2.25 0-.6-.225-1.125-.6-1.5-.375-.45-.6-1.05-.6-1.65 0-1.275 1.05-2.25 2.325-2.25H16.5c2.625 0 5.25-2.1 5.25-5.1 0-4.5-4.875-6.9-9.75-6.9z" />
    <circle cx="7.5" cy="12" r="0.75" fill="currentColor" />
    <circle cx="10.5" cy="7.5" r="0.75" fill="currentColor" />
    <circle cx="15" cy="7.5" r="0.75" fill="currentColor" />
    <circle cx="17.25" cy="10.875" r="0.75" fill="currentColor" />
  </svg>
);

const MarketingIcon = (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
  </svg>
);

const StrategyIcon = (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const SocialIcon = (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

const CameraIcon = (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
  </svg>
);

const SERVICES: { icon: React.ReactNode; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: BrandingIcon, titleKey: 'serviceVisualBranding', descKey: 'serviceVisualBrandingDesc' },
  { icon: MarketingIcon, titleKey: 'serviceDigitalMarketing', descKey: 'serviceDigitalMarketingDesc' },
  { icon: StrategyIcon, titleKey: 'serviceContentStrategy', descKey: 'serviceContentStrategyDesc' },
  { icon: SocialIcon, titleKey: 'serviceSocialMedia', descKey: 'serviceSocialMediaDesc' },
  { icon: CameraIcon, titleKey: 'serviceMobilography', descKey: 'serviceMobilographyDesc' },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F1EB] via-[#EFE7DC] to-[#E8DDD0] font-sans text-brand-navy flex flex-col">
      {/* Top Banner */}
      <div className="bg-brand-navy/95 text-white text-xs py-3 px-4 sm:px-6 flex items-center justify-between backdrop-blur-sm gap-2">
        <span className="font-bold tracking-[0.2em] text-xs sm:text-sm shrink-0">FIKIRBIZ</span>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="hidden sm:inline text-white/60 text-[10px] sm:text-xs text-right leading-tight">
            {t('topBannerTagline')}
          </span>
          <LanguageSwitcher value={language} onChange={setLanguage} />
        </div>
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
              {t('heroBadge')}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
              {t('heroTitleStart')}{' '}
              <span className="bg-gradient-to-r from-brand-gold to-[#C5A031] bg-clip-text text-transparent">
                {t('heroTitleHighlight')}
              </span>{' '}
              {t('heroTitleEnd')}
            </h1>

            <p className="text-base sm:text-lg text-brand-khaki/80 max-w-md leading-relaxed">
              {t('heroDesc')}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-2">
              <button
                onClick={() => navigate('/login')}
                className="group w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-navy text-brand-gold font-semibold hover:bg-brand-navy/90 transition-all duration-200 shadow-xl shadow-brand-navy/20 hover:shadow-2xl hover:shadow-brand-navy/30 hover:-translate-y-0.5"
              >
                <span className="flex items-center justify-center gap-2">
                  {t('loginCta')}
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </button>
              <button
                onClick={() => navigate('/register')}
                className="group w-full sm:w-auto px-8 py-3.5 rounded-xl border-2 border-brand-navy/20 text-brand-navy font-semibold hover:bg-brand-navy hover:text-brand-gold hover:border-brand-navy transition-all duration-200 hover:-translate-y-0.5"
              >
                {t('registerCta')}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Services */}
      <section id="xidmetlerimiz" className="border-t border-white/40 bg-white/40 backdrop-blur-sm py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12 sm:mb-16 animate-in fade-in duration-700">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-brand-gold to-[#C5A031] bg-clip-text text-transparent">
                {t('servicesTitle')}
              </span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-brand-khaki/80 max-w-2xl mx-auto leading-relaxed">
              {t('servicesIntro')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {SERVICES.map((service) => (
              <a
                key={service.titleKey}
                href="https://wa.link/0n2met"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white/90 backdrop-blur-sm rounded-3xl border border-white/60 shadow-[0_8px_40px_rgba(13,27,42,0.06)] p-6 sm:p-8 hover:shadow-[0_16px_50px_rgba(13,27,42,0.12)] hover:-translate-y-1 transition-all duration-300 block"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-gold to-[#C5A031] flex items-center justify-center text-brand-navy shadow-lg shadow-brand-gold/25 mb-5 group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h3 className="text-lg font-semibold text-brand-navy mb-2">{t(service.titleKey)}</h3>
                <p className="text-sm text-brand-khaki/80 leading-relaxed">{t(service.descKey)}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/40 bg-white/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-5 text-sm text-brand-navy/50 flex-wrap justify-center md:justify-start">
              <Link to="/haqqimizda" className="hover:text-brand-gold transition-colors duration-200">{t('footerAbout')}</Link>
              <span className="text-brand-navy/20">|</span>
              <Link to="/mexfilik" className="hover:text-brand-gold transition-colors duration-200">{t('footerPrivacy')}</Link>
              <span className="text-brand-navy/20">|</span>
              <Link to="/faq" className="hover:text-brand-gold transition-colors duration-200">{t('footerFaq')}</Link>
              <span className="text-brand-navy/20">|</span>
              <a href="https://fikirbiz-six.vercel.app/admin/login" target="_blank" rel="noopener noreferrer" className="hover:text-brand-gold transition-colors duration-200 font-medium text-brand-navy/70 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 inline text-brand-gold" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                {t('adminLogin')}
              </a>
            </div>
            <div className="text-xs text-brand-navy/40">
              {t('footerRights')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
