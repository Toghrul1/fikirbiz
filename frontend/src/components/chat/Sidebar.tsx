import React, { useEffect } from 'react';
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
  } = useAppStore();
  
  const { logout, user } = useAuthStore();

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
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-brand-navy transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Logo */}
        <div className="flex h-14 items-center justify-between px-5 border-b border-white/8">
          <div className="text-xl font-light text-white tracking-wide">
            <span>Fikir</span><span className="text-brand-gold font-semibold">Biz</span>
          </div>
          <button 
            className="md:hidden p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            onClick={toggleSidebar}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 py-3">
          <button
            onClick={createNewSession}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-gold/25 bg-brand-gold/8 py-2.5 text-sm font-medium text-brand-gold hover:bg-brand-gold hover:text-brand-navy transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Yeni Söhbət
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Söhbətlər
          </div>
          {sessions.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-white/25">
              Hələ söhbət yoxdur
            </div>
          ) : (
            sessions.map((session) => (
              <div 
                key={session.id}
                className={`group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-all duration-150 ${
                  activeSessionId === session.id 
                    ? 'bg-brand-gold/15 text-brand-gold' 
                    : 'text-white/60 hover:bg-white/6 hover:text-white/90'
                }`}
                onClick={() => loadSession(session.id)}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 shrink-0 opacity-70">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                  </svg>
                  <span className="truncate text-sm">{session.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="hidden shrink-0 p-1 rounded text-white/30 hover:text-red-400 hover:bg-red-400/10 group-hover:flex transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Canva Section */}
        <div className="mx-3 mb-2 rounded-xl bg-white/5 border border-white/8 p-3">
          <div className="flex items-center justify-between mb-2.5">
            <CanvaLogo size="sm" className="text-white" />
            <div className={`flex items-center gap-1.5 text-xs ${
              connector.status === 'connected' ? 'text-green-400' :
              connector.status === 'connecting' ? 'text-yellow-400' : 'text-white/30'
            }`}>
              <div className={`h-1.5 w-1.5 rounded-full ${
                connector.status === 'connected' ? 'bg-green-400' :
                connector.status === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-white/20'
              }`} />
              <span>{connector.status === 'connected' ? 'Bağlı' : connector.status === 'connecting' ? 'Qoşulur' : 'Bağlı deyil'}</span>
            </div>
          </div>

          {connector.status === 'connected' && connector.canvaUsername && (
            <div className="mb-2 text-xs text-white/50 truncate">
              {connector.canvaUsername}
              {designs.length > 0 && <span className="ml-1.5 text-brand-gold/70">• {designs.length} dizayn</span>}
            </div>
          )}

          <button
            onClick={handleCanvaToggle}
            disabled={connector.status === 'connecting'}
            className={`w-full py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
              connector.status === 'connected' 
                ? 'bg-white/8 text-white/70 hover:bg-white/15 hover:text-white' 
                : 'bg-brand-gold text-brand-navy hover:bg-brand-gold/90'
            } ${connector.status === 'connecting' ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {connector.status === 'connected' ? 'Bağlantını Kəs' : 
             connector.status === 'connecting' ? 'Qoşulur...' : 'Canva ilə Bağlan'}
          </button>

          <CanvaPoweredBy className="mt-2.5 justify-center opacity-60" />
        </div>

        {/* User Profile */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/8 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gold text-brand-navy text-sm font-bold">
              {user?.firstName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium text-white truncate">{user?.firstName} {user?.lastName}</div>
              <div className="text-xs text-white/40 truncate">{user?.email}</div>
            </div>
            <button 
              onClick={logout}
              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
              title="Çıxış"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
