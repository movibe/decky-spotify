import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import ptTranslations from './locales/pt.json';
import frTranslations from './locales/fr.json';

const resources = {
  en: {
    translation: enTranslations,
  },
  pt: {
    translation: ptTranslations,
  },
  fr: {
    translation: frTranslations,
  },
};

// Safe localStorage access for Decky environment
function getStoredLanguage(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('spotify_language') || 'pt';
    }
  } catch (e) {
    console.warn('Failed to access localStorage, using default language:', e);
  }
  return 'pt';
}

// Initialize i18next only if not already initialized
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: getStoredLanguage(),
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      react: {
        useSuspense: false, // Disable suspense for better Decky compatibility
      },
      compatibilityJSON: 'v4', // Use v4 format (latest i18next format)
    });
}

export default i18n;

