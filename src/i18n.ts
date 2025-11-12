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

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('spotify_language') || 'pt', // Default to Portuguese
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;

