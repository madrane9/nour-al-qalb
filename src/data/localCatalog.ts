import type { Catalog, Emotion, Entry, EntryTranslation, Lang } from '@/types';
import emotionsJson from './emotions.json';
import quranSeed from './quran-seed.json';

/**
 * Lokaler Modus (ohne Supabase): liest die vom Skript scripts/fetch-quran.mjs erzeugten,
 * bei Quran.com verifizierten Daten. Hadithe und Reflexionen gibt es hier bewusst nicht;
 * sie werden ausschließlich im Adminbereich nach Quellenprüfung angelegt.
 */
interface EmotionJson {
  slug: string;
  name: Record<Lang, string>;
  color: string;
  icon: string;
}
interface QuranSeed {
  id: string;
  arabic: string;
  surah: { number: number; nameAr: string; nameEn: string };
  ayah: number;
  emotionSlugs: string[];
  translations: { lang: Lang; kind: EntryTranslation['kind']; body: string; sourceName: string | null }[];
  source: { name: string; url: string; reference: string };
  audioUrl: string | null;
}

export function buildLocalCatalog(): Catalog {
  const emotions: Emotion[] = (emotionsJson as EmotionJson[]).map((e, i) => ({
    id: e.slug,
    slug: e.slug,
    name: e.name,
    color: e.color,
    icon: e.icon,
    sortOrder: i,
    archived: false,
  }));
  const entries: Entry[] = (quranSeed as QuranSeed[]).map((q) => ({
    id: q.id,
    type: 'quran',
    arabic: q.arabic,
    surah: q.surah,
    ayah: q.ayah,
    emotionIds: q.emotionSlugs,
    translations: q.translations,
    sourceName: q.source.name,
    sourceReference: q.source.reference,
    sourceUrl: q.source.url,
    grade: null,
    gradeSource: null,
    audioUrl: q.audioUrl,
    audioSource: q.audioUrl ? 'Quran.com (Mishari al-Afasy)' : null,
    status: 'published',
    sourceVerified: true,
  }));
  return { emotions, entries };
}
