import { useCallback } from 'react';
import { useLanguageStore } from '@/store/languageStore';
import translations, {
  type LanguageCode,
  type TranslationKey,
} from '@/lib/translations';
import { DEFAULT_LANGUAGE } from '@/lib/languages';

function isLanguageCode(code: string): code is LanguageCode {
  return Object.prototype.hasOwnProperty.call(translations, code);
}

export function useTranslation() {
  const language = useLanguageStore(s => s.language);
  const active: LanguageCode = isLanguageCode(language) ? language : DEFAULT_LANGUAGE;

  // useCallback vacibdir: `t` useEffect dependency kimi istifadə olunur və
  // hər dəfə yeni funksiya yaratsa, effektlər sonsuz dövrdə təkrarlanır.
  const t = useCallback(
    (key: TranslationKey): string => translations[active][key] ?? translations.en[key] ?? key,
    [active],
  );

  return { t, language };
}