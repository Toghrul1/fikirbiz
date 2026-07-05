import React from 'react';
import { Message } from '@/types';
import { DesignPreviewCard } from '../canva/DesignPreviewCard';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {/* AI Avatar */}
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-gold/20 mr-2.5 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-brand-gold">
            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
      )}

      <div 
        className={`max-w-[78%] md:max-w-[65%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser 
            ? 'bg-brand-navy text-white rounded-tr-sm' 
            : `bg-white text-brand-navy border border-black/6 rounded-tl-sm ${message.isError ? 'border-red-300 bg-red-50 text-red-700' : ''}`
        }`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        
        {/* Canva Design Cards */}
        {message.canvaLinks && message.canvaLinks.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {message.canvaLinks.map((link) => (
              <DesignPreviewCard key={link.designId} design={link} compact />
            ))}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-navy ml-2.5 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-brand-gold">
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};
