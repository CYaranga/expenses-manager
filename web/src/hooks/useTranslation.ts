import { useCallback, useMemo } from 'react';
import { useLanguageStore } from '../store/language.store';
import { getTranslation, translateCategory, getLocale } from '../i18n';

export function useTranslation() {
  const { language, setLanguage } = useLanguageStore();

  const t = useMemo(() => getTranslation(language), [language]);

  const tc = useCallback(
    (category: string) => translateCategory(language, category),
    [language]
  );

  const locale = useMemo(() => getLocale(language), [language]);

  const formatCurrencyLocale = useCallback(
    (amount: number, currency: string = 'USD') =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(amount),
    [locale]
  );

  const formatDateLocale = useCallback(
    (date: string | Date, options?: Intl.DateTimeFormatOptions) =>
      new Date(typeof date === 'string' ? date + 'T00:00:00' : date).toLocaleDateString(locale, options),
    [locale]
  );

  return {
    t,
    tc,
    locale,
    language,
    setLanguage,
    formatCurrency: formatCurrencyLocale,
    formatDate: formatDateLocale,
  };
}
