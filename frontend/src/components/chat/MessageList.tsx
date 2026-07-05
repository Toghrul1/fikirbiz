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
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center overflow-y-auto">
        {/* Icon */}
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gold/15">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 text-brand-gold">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        </div>
        
        <h2 className="mb-2 text-xl font-semibold text-brand-navy">FikirBiz-ə xoş gəldiniz</h2>
        <p className="max-w-sm text-sm text-brand-khaki leading-relaxed mb-6">
          İdeyalarınızı canlandırmaq üçün bir prompt yazın.{' '}
          {connector.status === 'connected' 
            ? 'Canva ilə birbaşa dizaynlar yarada bilərsiniz.'
            : 'Canva bağladıqdan sonra dizayn yarada bilərsiniz.'}
        </p>

        {/* Canva Connection Prompt */}
        {connector.status !== 'connected' && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-white border border-black/6 px-4 py-3 shadow-sm">
            <div className="h-2 w-2 rounded-full bg-brand-gray/50 shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium text-brand-navy">Canva bağlı deyil</p>
              <p className="text-xs text-brand-khaki mt-0.5">Sol paneldən Canva hesabınızı bağlayın</p>
            </div>
            <CanvaPoweredBy className="ml-2 shrink-0" />
          </div>
        )}

        {/* Example Prompts */}
        {connector.status === 'connected' && (
          <div className="grid grid-cols-2 gap-2.5 max-w-sm w-full">
            {[
              { title: 'İnstaqram postu', desc: '"Qəhvə dükanı üçün estetik post yarat"' },
              { title: 'Təqdimat', desc: '"Biznes üçün professional slides yarat"' },
              { title: 'Logo', desc: '"Şirkət üçün minimal logo dizaynı yarat"' },
              { title: 'Flayer', desc: '"Tədbir üçün rəngli flayer hazırla"' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-white border border-black/6 p-3 text-left shadow-sm hover:shadow-md hover:border-brand-gold/30 transition-all cursor-default">
                <p className="text-sm font-semibold text-brand-navy">{item.title}</p>
                <p className="text-xs text-brand-khaki mt-1 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
        {currentMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        
        {isLoading && (
          <div className="flex w-full justify-start mb-5">
            <div className="flex items-center gap-3 rounded-2xl rounded-tl-sm bg-white border border-black/6 px-4 py-3.5 shadow-sm">
              <div className="flex gap-1.5 items-center">
                <div className="h-2 w-2 animate-bounce rounded-full bg-brand-gold [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-brand-gold [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-brand-gold"></div>
              </div>
              <span className="text-xs text-brand-khaki">
                {connector.status === 'connected' ? 'Canva dizaynı yaradılır...' : 'FikirBiz AI düşünür...'}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-2" />
      </div>
    </div>
  );
};
