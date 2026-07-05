import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';

const PROMPT_SUGGESTIONS = [
  'İnstaqram postu hazırla',
  'YouTube thumbnail yarat',
  'Təqdimat slides yarat',
  'Facebook reklamı yarat',
  'Flayer hazırla',
  'CV yarat',
  'Poster hazırla',
  'Biznes kart yarat',
  'LinkedIn banner yarat',
  'Logo yarat',
  'Restoran menyusu yarat',
  'Dəvətnamə hazırla',
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
        className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-gray/40 cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
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
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        voice.isRecording 
          ? 'bg-red-100 text-red-500 animate-pulse' 
          : permissionError 
            ? 'bg-red-50 text-red-400'
            : 'text-brand-khaki hover:bg-brand-navy/5 hover:text-brand-navy'
      }`}
      title={permissionError ? "Mikrofon icazəsi yoxdur" : voice.isRecording ? "Dayandır" : "Səslə daxil et"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill={voice.isRecording ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
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
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
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

  const showSuggestions = useAppStore.getState().currentMessages.length === 0;

  return (
    <div className="shrink-0 bg-transparent px-4 pb-5 pt-3 md:px-6">
      <div className="mx-auto max-w-3xl">
        {/* Prompt Suggestions */}
        {showSuggestions && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {PROMPT_SUGGESTIONS.slice(0, 5).map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1.5 text-xs rounded-full bg-white border border-black/8 text-brand-navy/70 hover:bg-brand-gold/10 hover:border-brand-gold/40 hover:text-brand-navy transition-all shadow-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Input Box */}
        <form 
          onSubmit={handleSubmit}
          className="flex items-end gap-2 bg-white rounded-2xl border border-black/8 shadow-md px-3 pt-3 pb-3 focus-within:border-brand-gold/50 focus-within:shadow-lg focus-within:shadow-brand-gold/8 transition-all"
        >
          <div className="flex-1 flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                !activeSessionId 
                  ? "Yeni söhbət başlatmaq üçün sol paneldən + düyməsinə basın"
                  : connector.status === 'connected'
                    ? "Dizayn ideyanızı yazın..."
                    : "Sualınızı yazın..."
              }
              className="flex-1 max-h-[160px] min-h-[36px] resize-none bg-transparent text-sm text-brand-navy placeholder:text-brand-gray/60 focus:outline-none leading-relaxed"
              rows={1}
              disabled={!activeSessionId || isLoading}
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
            <VoiceButton />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || !activeSessionId}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-navy text-brand-gold hover:bg-brand-navy/85 disabled:bg-brand-gray/30 disabled:text-white/50 transition-all"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-gold border-t-transparent" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 -mt-px ml-px">
                  <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                </svg>
              )}
            </button>
          </div>
        </form>

        {/* Status Bar */}
        <div className="mt-2 flex items-center justify-between text-xs text-brand-khaki/60 px-1">
          <span className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${connector.status === 'connected' ? 'bg-green-400' : 'bg-brand-gray/40'}`} />
            {connector.status === 'connected' 
              ? 'Canva bağlı' 
              : 'Canva bağlı deyil'}
          </span>
          <span>Enter — göndər &nbsp;·&nbsp; Shift+Enter — yeni sətir</span>
        </div>
      </div>
    </div>
  );
};
