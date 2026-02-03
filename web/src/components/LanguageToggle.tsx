import { useLanguageStore } from '../store/language.store';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguageStore();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
      className="px-2 py-1.5 rounded-lg text-xs font-bold text-primary-600 dark:text-cream-200 hover:bg-cream-200 dark:hover:bg-primary-700 transition-colors"
      title={language === 'en' ? 'Cambiar a Espa\u00f1ol' : 'Switch to English'}
    >
      {language === 'en' ? 'ES' : 'EN'}
    </button>
  );
}
