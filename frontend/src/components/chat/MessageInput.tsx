import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';

const PROMPT_SUGGESTIONS = [
  'İnstaqram postu yarat',
  'YouTube thumbnail yarat',
  'Təqdimat slides yarat',
  'Facebook reklamı yarat',
  'Flayer yarat',
  'CV yarat',
  'Poster yarat',
  'Biznes kart yarat',
  'LinkedIn banner yarat',
  'Logo yarat',
  'Restoran menyusu yarat',
  'Dəvətnamə yarat',
  'İnfoqrafika yarat',
];

export const VoiceButton: React.FC = () => {
  const { voice, startVoiceInput, stopVoiceInput } = useAppStore();
  const [permissionError, setPermissionError] = useState(false);
  
  if (!voice.isSupported) {
    return (
      <button 
        type="button"
        disabled
        title="Səsli daxiletmə dəstəklənmir"
        className="flex h-10 w-10 items-center justify-center rounded-full text-brand-gray bg-brand-ivory cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
      </button>
    );
  }

  const handleToggle = async () => {
    if (voice.isRecording) {
      stopVoiceInput();
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionError(false);
      startVoiceInput();
      
      setTimeout(() => {
        stopVoiceInput();
      }, 3000);
      
    } catch (err) {
      setPermissionError(true);
      console.error("Mikrofon icazəsi rədd edildi", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
        voice.isRecording 
          ? 'bg-red-100 text-red-600 animate-pulse' 
          : permissionError 
            ? 'bg-red-50 text-red-400'
            : 'bg-brand-ivory text-brand-khaki hover:bg-brand-gold/20 hover:text-brand-navy'
      }`}
      title={permissionError ? "Mikrofon icazəsi yoxdur" : voice.isRecording ? "Dayandır" : "Səslə daxil et"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill={voice.isRecording ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    </button>
  );
};

export const MessageInput: React.FC = () => {
  const [input, setInput] = useState('');
  const { sendMessage, isLoading, activeSessionId, connector } = useAppStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || !activeSessionId) return;
    
    sendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    textareaRef.current?.focus();
  };

  return (
    <div className="bg-brand-ivory/80 backdrop-blur-md border-t border-brand-gray/30 p-4 pb-6 md:p-6 sticky bottom-0">
      <div className="mx-auto max-w-4xl relative">
        {/* Prompt Suggestions */}
        {useAppStore.getState().currentMessages.length === 0 && (
          <div className="mb-4">
            <p className="text-xs text-brand-gray mb-2">Sürətli başlanğıclar:</p>
            <div className="flex flex-wrap gap-2">
              {PROMPT_SUGGESTIONS.slice(0, 6).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 text-xs rounded-full bg-white border border-brand-gray/30 text-brand-navy hover:bg-brand-gold/10 hover:border-brand-gold/50 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <form 
          onSubmit={handleSubmit}
          className="flex items-end gap-2 bg-white rounded-2xl shadow-sm border border-brand-gray/50 p-2 focus-within:border-brand-gold focus-within:ring-1 focus-within:ring-brand-gold transition-all"
        >
          <div className="mb-1 ml-1">
            <VoiceButton />
          </div>
          
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !activeSessionId 
                ? "Zəhmət olmasa yeni söhbət yaradın"
                : connector.status === 'connected'
                  ? "Dizayn ideyanızı yazın (məsələn: Gözəl bir instagram postu yarat...)"
                  : "Canva bağlantısı olmadan da sorğu göndərə bilərsiniz"
            }
            className="flex-1 max-h-[200px] min-h-[44px] resize-none bg-transparent py-3 px-2 text-brand-navy placeholder:text-brand-gray focus:outline-none"
            rows={1}
            disabled={!activeSessionId || isLoading}
          />
          
          <button
            type="submit"
            disabled={!input.trim() || isLoading || !activeSessionId}
            className="mb-1 mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-brand-gold hover:bg-[#162a40] disabled:bg-brand-gray disabled:text-white transition-colors"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-gold border-t-transparent" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 -mt-0.5 ml-0.5">
                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
              </svg>
            )}
          </button>
        </form>

        {/* Status Bar */}
        <div className="mt-2 flex items-center justify-between text-xs text-brand-khaki">
          <span>
            {connector.status === 'connected' 
              ? 'Canva bağlı — dizayn yarada bilərsiniz'
              : 'Canva bağlı deyil — yalnız mətn söhbəti'}
          </span>
          <span>Səsli daxiletmə üçün mikrofona icazə verin</span>
        </div>
      </div>
    </div>
  );
};
