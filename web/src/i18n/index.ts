import { en, type TranslationKey } from './en';
import { es } from './es';

export type Language = 'en' | 'es';

const translations: Record<Language, Record<TranslationKey, string>> = { en, es };

export function getTranslation(lang: Language): (key: TranslationKey) => string {
  const dict = translations[lang];
  return (key: TranslationKey) => dict[key] || en[key] || key;
}

export function translateCategory(lang: Language, category: string): string {
  const key = `cat.${category}` as TranslationKey;
  const dict = translations[lang];
  return dict[key] || category;
}

export function getLocale(lang: Language): string {
  return lang === 'es' ? 'es-ES' : 'en-US';
}

export type { TranslationKey };
