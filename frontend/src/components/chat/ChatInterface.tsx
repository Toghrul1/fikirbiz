import React from 'react';
import { Sidebar } from './Sidebar';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useAppStore } from '@/store/appStore';
import { ToastContainer } from '../canva/Toast';

export const ChatInterface: React.FC = () => {
  const { toggleSidebar, connector } = useAppStore();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-brand-ivory font-sans text-brand-navy">
      <Sidebar />
      
      <main className="flex flex-1 flex-col relative w-full">
        {/* Mobile Header */}
        <header className="flex h-16 shrink-0 items-center border-b border-brand-gray/30 bg-brand-ivory/80 px-4 backdrop-blur-md md:hidden sticky top-0 z-10">
          <button 
            className="p-2 -ml-2 text-brand-navy hover:text-brand-khaki"
            onClick={toggleSidebar}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
          </button>
          <div className="ml-2 text-xl font-medium">FikirBiz</div>
          {/* Canva Status Indicator */}
          {connector.status === 'connected' && (
            <div className="ml-auto flex items-center gap-2 text-xs text-green-600">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Canva bağlı
            </div>
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
