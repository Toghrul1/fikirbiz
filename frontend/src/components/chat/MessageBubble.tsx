import React, { useState } from 'react';
import { Message } from '@/types';
import { DesignPreviewCard } from '../canva/DesignPreviewCard';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const time = new Date(message.timestamp).toLocaleTimeString('az-AZ', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-5 group`}>
      <div className={`max-w-[85%] md:max-w-[70%] ${
        isUser ? 'order-1' : 'order-1'
      }`}>
        <div
          className={`relative rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-brand-navy text-white rounded-br-sm'
              : 'bg-white/90 backdrop-blur-sm text-brand-navy border border-black/[0.04] rounded-bl-sm'
          } ${message.isError ? 'border-red-300 bg-red-50/90 text-red-700' : ''}`}
        >
          {/* Copy button (assistant messages) */}
          {!isUser && message.content && (
            <button
              onClick={handleCopy}
              className={`absolute -top-2 -right-2 p-1.5 rounded-lg ${
                copied ? 'bg-green-500 text-white' : 'bg-white text-brand-navy/40 border border-black/[0.06] opacity-0 group-hover:opacity-100'
              } shadow-sm hover:shadow-md transition-all duration-200`}
              title={copied ? 'Kopyalandı' : 'Kopyala'}
            >
              {copied ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
              )}
            </button>
          )}

          <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>

          {/* Canva Design Cards */}
          {message.canvaLinks && message.canvaLinks.length > 0 && (
            <div className="mt-4 flex flex-col gap-3 border-t border-black/[0.04] pt-3">
              {message.canvaLinks.map((link) => (
                <DesignPreviewCard key={link.designId} design={link} compact />
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`flex items-center gap-2 mt-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-brand-navy/30 tracking-wide">{time}</span>
          {isUser && (
            <svg className="w-3 h-3 text-brand-gold/60" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};
