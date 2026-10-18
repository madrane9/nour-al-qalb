import { useTranslation } from 'react-i18next';
import { isRtl, setLanguage } from '@/i18n';
import type { Lang } from '@/types';

export function useLang() {
  const { i18n } = useTranslation();
  const lang = (i18n.language as Lang) ?? 'de';
  return { lang, rtl: isRtl(lang), setLang: setLanguage };
}
