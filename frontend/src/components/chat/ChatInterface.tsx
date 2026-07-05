import React from 'react';
import { Sidebar } from './Sidebar';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useAppStore } from '@/store/appStore';
import { ToastContainer } from '../canva/Toast';

export const ChatInterface: React.FC = () => {
  const { toggleSidebar, connector } = useAppStore();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F5F1EB] font-sans text-brand-navy">
      <Sidebar />
      
      <main className="flex flex-1 flex-col relative w-full min-w-0 overflow-hidden md:ml-64">
        {/* Mobile Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-black/6 bg-white/70 backdrop-blur-md px-4 md:hidden">
          <button 
            className="p-2 -ml-1.5 rounded-lg text-brand-navy/60 hover:text-brand-navy hover:bg-black/5 transition-colors"
            onClick={toggleSidebar}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
          </button>
          <div className="text-lg font-light">
            Fikir<span className="text-brand-gold font-semibold">Biz</span>
          </div>
          {connector.status === 'connected' ? (
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Canva
            </div>
          ) : (
            <div className="w-16" />
          )}
        </header>

        {/* Chat Area */}
        <MessageList />
        <MessageInput />
      </main>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};
