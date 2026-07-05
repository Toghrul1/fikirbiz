import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { CanvaLogo, CanvaPoweredBy } from '../canva/CanvaLogo';

export const Sidebar: React.FC = () => {
  const {
    sessions,
    activeSessionId,
    createNewSession,
    loadSession,
    deleteSession,
    sidebarOpen,
    toggleSidebar,
    connector,
    initiateCanvaAuth,
    disconnectCanva,
    checkCanvaStatus,
    designs,
    designsLoading,
  } = useAppStore();

  const { logout, user } = useAuthStore();
  const [activePlan, setActivePlan] = useState<'basic' | 'pro'>('basic');

  useEffect(() => {
    checkCanvaStatus();
  }, [checkCanvaStatus]);

  const handleCanvaToggle = () => {
    if (connector.status === 'connected') {
      disconnectCanva();
    } else {
      initiateCanvaAuth();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-brand-navy/50 backdrop-blur-sm md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col bg-brand-navy text-brand-white transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <img
            src="/logo.jpg"
            alt="FikirBiz"
            className="h-10 w-auto rounded"
          />
          <button
            className="md:hidden p-2 text-brand-gray hover:text-white"
            onClick={toggleSidebar}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Social Links */}
        <div className="flex items-center gap-3 px-5 pb-4 border-b border-white/10">
          <a
            href="https://instagram.com/fikirbiz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-brand-gray hover:bg-[#E4405F] hover:text-white transition-colors"
            title="Instagram"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </a>
          <a
            href="https://linkedin.com/company/fikirbiz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-brand-gray hover:bg-[#0A66C2] hover:text-white transition-colors"
            title="LinkedIn"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        </div>

        {/* Plan Selector */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex rounded-lg bg-white/5 p-1">
            <button
              onClick={() => setActivePlan('basic')}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
                activePlan === 'basic'
                  ? 'bg-brand-gold text-brand-navy'
                  : 'text-brand-gray hover:text-white'
              }`}
            >
              FikirBiz Basic
            </button>
            <button
              onClick={() => setActivePlan('pro')}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
                activePlan === 'pro'
                  ? 'bg-brand-gold text-brand-navy'
                  : 'text-brand-gray hover:text-white'
              }`}
            >
              FikirBiz Pro
            </button>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={createNewSession}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand-gold/30 bg-white/5 py-3 font-medium text-brand-gold hover:bg-brand-gold hover:text-brand-navy transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Yeni Söhbət
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-2 text-xs font-semibold uppercase tracking-wider text-brand-gray/70 mb-2">
            Söhbətlər
          </div>
          {sessions.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-brand-gray/50">
              Heç bir söhbət yoxdur
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                  activeSessionId === session.id
                    ? 'bg-brand-gold/10 text-brand-gold'
                    : 'text-brand-gray hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => loadSession(session.id)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                  </svg>
                  <span className="truncate text-sm">{session.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="hidden shrink-0 text-brand-gray/50 hover:text-red-400 group-hover:block"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Canva Section */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <CanvaLogo size="sm" className="text-brand-white" />
            <div className={`h-2.5 w-2.5 rounded-full ${
              connector.status === 'connected' ? 'bg-green-500' :
              connector.status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-brand-gray/50'
            }`} />
          </div>

          {connector.status === 'connected' && connector.canvaUsername && (
            <div className="mb-2 text-xs text-green-400">
              Bağlı: {connector.canvaUsername}
            </div>
          )}

          {connector.status === 'connected' && designs.length > 0 && (
            <div className="mb-2 text-xs text-brand-gray/70">
              {designs.length} dizayn mövcuddur
            </div>
          )}

          <button
            onClick={handleCanvaToggle}
            disabled={connector.status === 'connecting'}
            className={`w-full py-2 text-sm font-medium rounded-lg transition-colors ${
              connector.status === 'connected'
                ? 'bg-white/10 text-brand-white hover:bg-white/20'
                : 'bg-brand-gold text-brand-navy hover:bg-[#B8962E]'
            } ${connector.status === 'connecting' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {connector.status === 'connected' ? 'Bağlantını Kəs' :
             connector.status === 'connecting' ? 'Qoşulur...' : 'Canva ilə Bağlan'}
          </button>

          <CanvaPoweredBy className="mt-3 justify-center" />
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gold text-brand-navy font-bold">
              {user?.firstName?.[0] || 'U'}
            </div>
            <div className="truncate">
              <div className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</div>
              <div className="text-xs text-brand-gray/70 truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-brand-gray hover:text-white"
            title="Çıxış"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
          </button>
        </div>

        {/* Footer Links */}
        <div className="px-5 py-3 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-center gap-4 text-[11px] text-brand-gray/60">
            <a href="/haqqimizda" className="hover:text-brand-gold transition-colors">Haqqımızda</a>
            <span>|</span>
            <a href="/mexfilik" className="hover:text-brand-gold transition-colors">Məxfilik</a>
            <span>|</span>
            <a href="/faq" className="hover:text-brand-gold transition-colors">FAQ</a>
          </div>
        </div>
      </aside>
    </>
  );
};
