import React, { useRef, useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { MessageBubble } from './MessageBubble';
import { CanvaPoweredBy } from '../canva/CanvaLogo';

export const MessageList: React.FC = () => {
  const { currentMessages, isLoading, connector } = useAppStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isLoading]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    setShowScrollBtn(!isNearBottom);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (currentMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto"
        ref={containerRef}
        onScroll={handleScroll}
      >
        <div className="max-w-md w-full text-center py-12">
          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center ring-1 ring-brand-gold/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-brand-gold">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-brand-gold flex items-center justify-center">
                <svg className="w-3 h-3 text-brand-navy" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.362 1.093a.75.75 0 00-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925zM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0018 14.25V6.443zm-8.75 12.25v-8.25l-7.25-4v7.807a.75.75 0 00.388.657l6.862 3.786z" />
                </svg>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-brand-navy mb-2 tracking-tight">FikirBiz-ə xoş gəldiniz</h2>
          <p className="text-brand-khaki/70 mb-6 leading-relaxed">
            İdeyalarınızı canlandırmaq üçün mənə bir prompt verin.
            {connector.status === 'connected'
              ? ' Canva ilə birbaşa əlaqəli dizaynlar hazırlaya bilərəm.'
              : ' Canva bağladıqdan sonra dizayn hazırlaya bilərsiniz.'}
          </p>

          {/* Canva Connection */}
          {connector.status !== 'connected' && (
            <div className="mb-6 p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm">
              <p className="text-sm text-brand-navy/70 mb-3">
                Canva hesabınızı bağlayaraq dizayn hazırlamağa başlayın
              </p>
              <CanvaPoweredBy className="justify-center opacity-60" />
            </div>
          )}

          {/* Example prompts */}
          {connector.status === 'connected' && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'İnstaqram postu', desc: 'Qəhvə dükanı üçün gözəl post hazırla' },
                { title: 'Təqdimat', desc: 'Biznes təqdimatı slides hazırla' },
                { title: 'Logo', desc: 'Şirkət üçün logo hazırla' },
                { title: 'Flayer', desc: 'Tədbir üçün flayer hazırla' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 text-left hover:bg-white/90 hover:border-brand-gold/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                >
                  <p className="text-sm font-semibold text-brand-navy">{item.title}</p>
                  <p className="text-xs text-brand-khaki/60 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-12 py-6 relative"
      ref={containerRef}
      onScroll={handleScroll}
    >
      <div className="mx-auto max-w-3xl">
        {currentMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="flex w-full justify-start mb-5">
            <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-white/90 backdrop-blur-sm p-5 border border-black/[0.04] shadow-sm">
              <div className="flex gap-2 items-center">
                <div className="h-2 w-2 rounded-full bg-brand-gold/60 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 rounded-full bg-brand-gold/60 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 rounded-full bg-brand-gold/60 animate-bounce"></div>
              </div>
              <p className="text-xs text-brand-navy/30 mt-2 tracking-wide">
                {connector.status === 'connected' ? 'Canva dizaynı hazırlanır...' : 'FikirBiz AI düşünür...'}
              </p>
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-28 right-8 z-40 p-2.5 rounded-xl bg-white/80 backdrop-blur-sm border border-black/[0.06] shadow-lg text-brand-navy/50 hover:text-brand-navy hover:bg-white hover:shadow-xl transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      )}
    </div>
  );
};
