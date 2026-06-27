import { create } from 'zustand';
import { DEFAULT_LANGUAGE } from '@/lib/languages';

interface LanguageState {
  language: string;
  setLanguage: (code: string) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: localStorage.getItem('app_language') || DEFAULT_LANGUAGE,
  setLanguage: (code) => {
    localStorage.setItem('app_language', code);
    set({ language: code });
  },
}));
