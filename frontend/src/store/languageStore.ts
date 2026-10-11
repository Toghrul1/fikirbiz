import { create } from 'zustand';
import { DEFAULT_LANGUAGE, LANGUAGES } from '@/lib/languages';

const STORAGE_KEY = 'app_language';

/** localStorage-dakı dili yoxlayır — xarab dəyər yadda saxlanmasın. */
function readStoredLanguage(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.some((l) => l.code === stored)) {
      return stored;
    }
  } catch {
    // localStorage brauzer məhdudiyyəti ilə əlçatan deyil — default işlət.
  }
  return DEFAULT_LANGUAGE;
}

interface LanguageState {
  language: string;
  setLanguage: (code: string) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: readStoredLanguage(),
  setLanguage: (code) => {
    if (!LANGUAGES.some((l) => l.code === code)) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Saxlama mümkün deyilsə belə, seçim sessiz qalsın.
    }
    set({ language: code });
  },
}));