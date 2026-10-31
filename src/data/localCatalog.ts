import type { Catalog, Emotion, Entry, EntryTranslation, Lang, Scene, SceneLang } from '@/types';
import emotionsJson from './emotions.json';
import quranSeed from './quran-seed.json';
import scenesJson from './scenes.json';

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

/**
 * Szenen im lokalen Modus: Bilder liegen in public/scenes/, Daten in scenes.json.
 * entryKey ist die Versreferenz aus quran-seed.json, z. B. "6:44".
 */
interface SceneJson {
  id: string;
  entryKey: string;
  sortOrder?: number;
  images: { lang: SceneLang; file: string; alt: string }[];
}

function buildLocalScenes(seed: (QuranSeed & { key?: string })[]): Scene[] {
  const base = import.meta.env.BASE_URL;
  return (scenesJson as SceneJson[]).flatMap((s, i) => {
    const entry = seed.find((q) => q.key === s.entryKey);
    if (!entry) return []; // Vers nicht im Seed: Szene weglassen statt falsche Antwort zeigen
    return [{
      id: s.id,
      entryId: entry.id,
      status: 'published' as const,
      sortOrder: s.sortOrder ?? i,
      images: s.images.map((img) => ({ lang: img.lang, path: img.file, url: `${base}scenes/${img.file}`, alt: img.alt })),
    }];
  });
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
  return { emotions, entries, scenes: buildLocalScenes(quranSeed as (QuranSeed & { key?: string })[]) };
}
