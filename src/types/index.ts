export type Lang = 'ar' | 'de' | 'en';
export const LANGS: readonly Lang[] = ['ar', 'de', 'en'] as const;

export type EntryType = 'quran' | 'hadith' | 'reflection';
export type EntryStatus = 'draft' | 'published' | 'archived';
export type TranslationKind = 'translation' | 'explanation' | 'reflection';

export interface Emotion {
  id: string;
  slug: string;
  name: Record<Lang, string>;
  color: string;
  icon: string;
  sortOrder: number;
  archived: boolean;
}

export interface EntryTranslation {
  lang: Lang;
  kind: TranslationKind;
  body: string;
  sourceName: string | null;
}

export interface Entry {
  id: string;
  type: EntryType;
  arabic: string | null;
  surah: { number: number; nameAr: string; nameEn: string } | null;
  ayah: number | null;
  emotionIds: string[];
  translations: EntryTranslation[];
  sourceName: string | null;
  sourceReference: string | null;
  sourceUrl: string | null;
  grade: string | null;
  gradeSource: string | null;
  audioUrl: string | null;
  audioSource: string | null;
  status: EntryStatus;
  sourceVerified: boolean;
}

export interface Catalog {
  emotions: Emotion[];
  entries: Entry[];
}
