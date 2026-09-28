import { create } from 'zustand';
import { getLocales } from 'expo-localization';

type Locale = 'en' | 'fr' | 'tr' | 'ar';

const getDeviceLocale = (): Locale => {
  const locales = getLocales();
  const lang = locales[0]?.languageCode || 'en';
  return (['en', 'fr', 'tr', 'ar'] as Locale[]).includes(lang as Locale)
    ? (lang as Locale)
    : 'en';
};

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: getDeviceLocale(),
  setLocale: (locale) => set({ locale }),
}));
