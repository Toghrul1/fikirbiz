import React from 'react';
import { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div 
        className={`max-w-[80%] md:max-w-[70%] rounded-2xl p-4 shadow-sm ${
          isUser 
            ? 'bg-brand-navy text-brand-white rounded-tr-sm' 
            : 'bg-white text-brand-navy border border-brand-gray/30 rounded-tl-sm'
        } ${message.isError ? 'border-red-400 bg-red-50 text-red-800' : ''}`}
      >
        <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
        
        {/* Canva Links */}
        {message.canvaLinks && message.canvaLinks.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {message.canvaLinks.map((link) => (
              <a 
                key={link.designId}
                href={link.editUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-brand-ivory/50 border border-brand-gold/30 hover:bg-brand-ivory transition-colors group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-gold text-brand-navy font-bold text-xs">
                  {link.contentType === 'DESIGN' ? 'DSGN' : link.contentType.substring(0, 4)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-navy truncate">
                    {link.title || 'Canva Dizaynı'}
                  </p>
                  <p className="text-xs text-brand-khaki truncate">
                    Klikləyərək redaktə et
                  </p>
                </div>
                <div className="shrink-0 text-brand-gold group-hover:text-brand-navy transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
