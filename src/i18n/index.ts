import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar.json';
import de from './locales/de.json';
import en from './locales/en.json';
import type { Lang } from '@/types';
import { readString, writeString } from '@/services/storage';

export const LANG_KEY = 'nq.lang';
export const isRtl = (lang: Lang) => lang === 'ar';

export function applyDocumentLang(lang: Lang) {
  document.documentElement.lang = lang === 'ar' ? 'ar-MA' : lang;
  document.documentElement.dir = isRtl(lang) ? 'rtl' : 'ltr';
}

function initialLang(): Lang {
  const saved = readString(LANG_KEY);
  if (saved === 'ar' || saved === 'de' || saved === 'en') return saved;
  const nav = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'de';
  if (nav.startsWith('ar')) return 'ar';
  if (nav.startsWith('en')) return 'en';
  return 'de';
}

void i18n.use(initReactI18next).init({
  resources: { ar: { translation: ar }, de: { translation: de }, en: { translation: en } },
  lng: initialLang(),
  fallbackLng: 'de',
  interpolation: { escapeValue: false }, // React escaped bereits (XSS-sicher)
});

export function setLanguage(lang: Lang) {
  writeString(LANG_KEY, lang);
  void i18n.changeLanguage(lang);
  applyDocumentLang(lang);
}

applyDocumentLang(i18n.language as Lang);

export default i18n;
