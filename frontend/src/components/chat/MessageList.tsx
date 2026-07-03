import React, { useRef, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { MessageBubble } from './MessageBubble';
import { CanvaPoweredBy } from '../canva/CanvaLogo';

export const MessageList: React.FC = () => {
  const { currentMessages, isLoading, connector } = useAppStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isLoading]);

  if (currentMessages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        {/* Canva Brand */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-gold/20 text-brand-gold">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-10 w-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        </div>
        
        <h2 className="mb-2 text-2xl font-medium text-brand-navy">FikirBiz-ə xoş gəldiniz</h2>
        <p className="max-w-md text-brand-khaki mb-6">
          İdeyalarınızı canlandırmaq üçün mənə bir prompt verin. 
          {connector.status === 'connected' 
            ? ' Canva ilə birbaşa əlaqəli dizaynlar yarada bilərəm.'
            : ' Canva bağladıqdan sonra dizayn yarada bilərsiniz.'}
        </p>

        {/* Canva Connection Status */}
        {connector.status !== 'connected' && (
          <div className="mb-6 p-4 rounded-xl bg-white border border-brand-gray/20 shadow-sm">
            <p className="text-sm text-brand-navy mb-2">
              Canva hesabınızı bağlayaraq dizayn yaratmağa başlayın
            </p>
            <CanvaPoweredBy className="justify-center" />
          </div>
        )}

        {/* Example Prompts */}
        {connector.status === 'connected' && (
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <div className="p-3 rounded-xl bg-white border border-brand-gray/20 text-left">
              <p className="text-sm font-medium text-brand-navy">İnstaqram postu</p>
              <p className="text-xs text-brand-khaki mt-1">"Qəhvə dükanı üçün gözəl post yarat"</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-brand-gray/20 text-left">
              <p className="text-sm font-medium text-brand-navy">Təqdimat</p>
              <p className="text-xs text-brand-khaki mt-1">"Biznes təqdimatı slides yarat"</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-brand-gray/20 text-left">
              <p className="text-sm font-medium text-brand-navy">Logo</p>
              <p className="text-xs text-brand-khaki mt-1">"Şirkət üçün logo yarat"</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-brand-gray/20 text-left">
              <p className="text-sm font-medium text-brand-navy">Flayer</p>
              <p className="text-xs text-brand-khaki mt-1">"Tədbir üçün flayer yarat"</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:px-12">
      <div className="mx-auto max-w-4xl">
        {currentMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        
        {isLoading && (
          <div className="flex w-full justify-start mb-6">
            <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white p-5 border border-brand-gray/30 shadow-sm">
              <div className="flex gap-2 items-center">
                <div className="h-2 w-2 animate-bounce rounded-full bg-brand-gold [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-brand-gold [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-brand-gold"></div>
              </div>
              <p className="text-xs text-brand-gray mt-2">
                {connector.status === 'connected' ? 'Canva dizaynı yaradılır...' : 'FikirBiz AI düşünür...'}
              </p>
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
};
