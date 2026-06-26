import { create } from 'zustand';
import { AppState, Message, Session, CanvaConnectorState, VoiceInputState, CanvaDesignLink } from '@/types';
import { axiosInstance } from '@/lib/axiosInstance';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useAppStore = create<AppState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  currentMessages: [],
  
  isLoading: false,
  sidebarOpen: window.innerWidth >= 768,
  
  connector: {
    status: 'disconnected',
    lastUpdated: Date.now(),
  },
  
  voice: {
    isRecording: false,
    isSupported: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
    isPermissionGranted: false,
    interimTranscript: '',
    errorCount: 0,
    status: 'idle',
  },

  sendMessage: async (prompt: string) => {
    const { activeSessionId, currentMessages, connector } = get();
    if (!prompt.trim() || !activeSessionId) return;

    set({ isLoading: true });

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };

    set({ currentMessages: [...currentMessages, newUserMsg] });

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      canvaLinks: [],
    };

    set({ currentMessages: [...get().currentMessages, assistantMsg] });

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt,
          session_id: activeSessionId,
          message_history: currentMessages.map(m => ({ role: m.role, content: m.content })),
          canva_access_token: connector.status === 'connected' ? connector.accessToken : null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const msgs = get().currentMessages;
            const idx = msgs.findIndex(m => m.id === assistantMsgId);
            if (idx === -1) continue;

            const updated = { ...msgs[idx] };

            if (parsed.type === 'text') {
              updated.content += parsed.data;
            } else if (parsed.type === 'design_url') {
              const link: CanvaDesignLink = {
                designId: parsed.data.designId,
                editUrl: parsed.data.editUrl,
                contentType: parsed.data.contentType,
                title: parsed.data.title,
              };
              updated.canvaLinks = [...(updated.canvaLinks || []), link];
            } else if (parsed.type === 'error') {
              updated.content += parsed.data;
              updated.isError = true;
            }

            set({ currentMessages: [...msgs.slice(0, idx), updated, ...msgs.slice(idx + 1)] });
          } catch {
            // parse xətasını ignore et
          }
        }
      }

    } catch (error) {
      const msgs = get().currentMessages;
      const idx = msgs.findIndex(m => m.id === assistantMsgId);
      const errorMsg: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: "Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.",
        timestamp: Date.now(),
        isError: true,
      };
      if (idx !== -1) {
        set({ currentMessages: [...msgs.slice(0, idx), errorMsg, ...msgs.slice(idx + 1)] });
      } else {
        set({ currentMessages: [...msgs, errorMsg] });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  loadSession: async (sessionId: string) => {
    // LocalStorage-dən yüklənməli
    const savedMsg = localStorage.getItem(`session_${sessionId}`);
    set({
      activeSessionId: sessionId,
      currentMessages: savedMsg ? JSON.parse(savedMsg).messages : [],
    });
  },

  createNewSession: () => {
    const newId = Date.now().toString();
    const newSession: Session = {
      id: newId,
      name: 'Yeni Söhbət',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
    };
    
    const sessions = [...get().sessions, newSession];
    set({ sessions, activeSessionId: newId, currentMessages: [] });
    localStorage.setItem('sessions', JSON.stringify(sessions));
  },

  deleteSession: (sessionId: string) => {
    const sessions = get().sessions.filter(s => s.id !== sessionId);
    set({ sessions });
    localStorage.setItem('sessions', JSON.stringify(sessions));
    localStorage.removeItem(`session_${sessionId}`);
    
    if (get().activeSessionId === sessionId) {
      set({ activeSessionId: null, currentMessages: [] });
    }
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  startVoiceInput: () => set((state) => ({ voice: { ...state.voice, isRecording: true, status: 'recording' } })),
  stopVoiceInput: () => set((state) => ({ voice: { ...state.voice, isRecording: false, status: 'idle' } })),
  
  initiateCanvaAuth: async () => {
    set((state) => ({ connector: { ...state.connector, status: 'connecting' } }));
    setTimeout(() => {
      // Mock OAuth Flow success
      set((state) => ({ 
        connector: { 
          ...state.connector, 
          status: 'connected', 
          accessToken: 'mock', 
          lastUpdated: Date.now() 
        } 
      }));
    }, 2000);
  },
  
  disconnectCanva: () => {
    set((state) => ({ 
      connector: { ...state.connector, status: 'disconnected', accessToken: undefined, lastUpdated: Date.now() } 
    }));
  },
}));
