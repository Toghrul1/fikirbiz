import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';

const PROMPT_SUGGESTIONS = [
  'İnstaqram postu hazırla',
  'YouTube thumbnail hazırla',
  'Təqdimat slides hazırla',
  'Facebook reklamı hazırla',
  'Flayer hazırla',
  'Logo hazırla',
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
        className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-gray/50 bg-transparent cursor-not-allowed"
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
      }, 8000);
    } catch {
      setPermissionError(true);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
        voice.isRecording
          ? 'bg-red-100 text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
          : permissionError
            ? 'bg-red-50 text-red-400'
            : 'text-brand-navy/40 hover:text-brand-navy hover:bg-brand-gold/10'
      }`}
      title={permissionError ? 'Mikrofon icazəsi yoxdur' : voice.isRecording ? 'Dayandır' : 'Səslə daxil et'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill={voice.isRecording ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    </button>
  );
};

export const MessageInput: React.FC = () => {
  const [input, setInput] = useState('');
  const { sendMessage, isLoading, activeSessionId, currentMessages, connector } = useAppStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showSuggestions = !isLoading && currentMessages.length === 0;

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
    <div className="bg-gradient-to-t from-[#F5F1EB] via-[#F5F1EB] to-transparent pt-6 pb-4 md:pb-6 px-4 md:px-6 lg:px-12 sticky bottom-0">
      <div className="mx-auto max-w-3xl relative">
        {/* Prompt Suggestions */}
        {showSuggestions && (
          <div className="mb-3 animate-in fade-in slide-in-from-bottom duration-300">
            <p className="text-xs text-brand-navy/40 mb-2 tracking-wide">Sürətli başlanğıclar:</p>
            <div className="flex flex-wrap gap-2">
              {PROMPT_SUGGESTIONS.slice(0, 6).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3.5 py-1.5 text-xs rounded-full bg-white/70 backdrop-blur-sm border border-white/60 text-brand-navy/70 hover:bg-brand-gold/10 hover:border-brand-gold/30 hover:text-brand-navy transition-all duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 bg-white/90 backdrop-blur-sm rounded-2xl shadow-[0_4px_24px_rgba(13,27,42,0.06)] border border-white/60 p-2 focus-within:border-brand-gold/30 focus-within:shadow-[0_4px_24px_rgba(212,175,55,0.12)] transition-all duration-300"
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
                ? 'Zəhmət olmasa yeni söhbət hazırlayın'
                : connector.status === 'connected'
                  ? 'Dizayn ideyanızı yazın...'
                  : 'Sorğunuzu yazın...'
            }
            className="flex-1 max-h-[200px] min-h-[44px] resize-none bg-transparent py-3 px-2 text-brand-navy placeholder:text-brand-navy/25 focus:outline-none text-sm"
            rows={1}
            disabled={!activeSessionId || isLoading}
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading || !activeSessionId}
            className="mb-1 mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-brand-gold hover:bg-brand-navy/90 disabled:bg-black/[0.03] disabled:text-brand-navy/20 transition-all duration-200 shadow-sm"
          >
            {isLoading ? (
              <div className="h-5 w-5 rounded-full border-2 border-brand-gold border-t-transparent animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 -mt-0.5 ml-0.5">
                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
              </svg>
            )}
          </button>
        </form>

        {/* Status Bar */}
        <div className="mt-2 flex items-center justify-between px-1">
          <span className="text-[10px] text-brand-navy/30 tracking-wide">
            {connector.status === 'connected'
              ? 'Canva bağlı — dizayn hazırlaya bilərsiniz'
              : 'Canva bağlı deyil — yalnız mətn söhbəti'}
          </span>
          <span className="text-[10px] text-brand-navy/20 tracking-wide">
            Enter göndər • Shift+Enter yeni sətir
          </span>
        </div>
      </div>
    </div>
  );
};
