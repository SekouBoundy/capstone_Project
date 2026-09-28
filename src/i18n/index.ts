import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from './locales/en.json';
import fr from './locales/fr.json';
import tr from './locales/tr.json';
import ar from './locales/ar.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  tr: { translation: tr },
  ar: { translation: ar },
};

const getDeviceLanguage = () => {
  const locales = getLocales();
  const lang = locales[0]?.languageCode || 'en';
  return ['en', 'fr', 'tr', 'ar'].includes(lang) ? lang : 'en';
};

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export { i18n };
