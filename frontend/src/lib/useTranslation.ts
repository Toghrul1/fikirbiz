import { useLanguageStore } from '@/store/languageStore';
import translations, { type TranslationKey } from '@/lib/translations';

export function useTranslation() {
  const language = useLanguageStore(s => s.language);

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return { t, language };
}
