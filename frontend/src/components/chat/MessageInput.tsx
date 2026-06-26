import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';

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
      // Mikrofon icazəsi yoxlayırıq
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionError(false);
      startVoiceInput();
      
      // Reallıqda Web Speech API (SpeechRecognition) burada işə salınır
      // Mock: 3 saniyə sonra öz-özünə dayanır
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
  const { sendMessage, isLoading, activeSessionId } = useAppStore();
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

  return (
    <div className="bg-brand-ivory/80 backdrop-blur-md border-t border-brand-gray/30 p-4 pb-6 md:p-6 sticky bottom-0">
      <div className="mx-auto max-w-4xl relative">
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
            placeholder={activeSessionId ? "Dizayn ideyanızı yazın (məsələn: Gözəl bir instagram postu yarat...)" : "Zəhmət olmasa yeni söhbət yaradın"}
            className="flex-1 max-h-[200px] min-h-[44px] resize-none bg-transparent py-3 px-2 text-brand-navy placeholder:text-brand-gray focus:outline-none"
            rows={1}
            disabled={!activeSessionId || isLoading}
          />
          
          <button
            type="submit"
            disabled={!input.trim() || isLoading || !activeSessionId}
            className="mb-1 mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-brand-gold hover:bg-[#162a40] disabled:bg-brand-gray disabled:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 -mt-0.5 ml-0.5">
              <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
            </svg>
          </button>
        </form>
        <div className="mt-2 text-center text-xs text-brand-khaki">
          Səsli daxiletmə funksiyası üçün mikrofona icazə verilməlidir.
        </div>
      </div>
    </div>
  );
};
