import React from 'react';
import { Message } from '@/types';
import { DesignPreviewCard } from '../canva/DesignPreviewCard';

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
        
        {/* Canva Design Cards */}
        {message.canvaLinks && message.canvaLinks.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {message.canvaLinks.map((link) => (
              <DesignPreviewCard key={link.designId} design={link} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
