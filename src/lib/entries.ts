import type { Emotion, Entry, EntryType, Lang, TranslationKind } from '@/types';

/** Entfernt arabische Diakritika/Tatweel für die Suche. */
export function normalizeArabic(s: string): string {
  return s
    .replace(/[ً-ٰٟۖ-ۭـ]/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .toLowerCase();
}

export function getText(entry: Entry, lang: Lang, kind: TranslationKind) {
  return entry.translations.find((t) => t.lang === lang && t.kind === kind) ?? null;
}

/** Zufälliger, noch nicht gezeigter Eintrag. Sind alle gesehen, wird der Kreislauf neu gestartet. */
export function pickUnseen(
  pool: Entry[],
  seen: ReadonlySet<string>,
  rng: () => number = Math.random,
): { entry: Entry | null; cycled: boolean } {
  if (pool.length === 0) return { entry: null, cycled: false };
  let candidates = pool.filter((e) => !seen.has(e.id));
  let cycled = false;
  if (candidates.length === 0) {
    cycled = true;
    candidates = pool.length > 1 ? pool.filter((e) => e.id !== [...seen].at(-1)) : pool;
  }
  return { entry: candidates[Math.floor(rng() * candidates.length)] ?? null, cycled };
}

/** Täglicher Eintrag: stabil pro Kalendertag. */
export function dailyEntry(entries: Entry[], date = new Date()): Entry | null {
  const pool = entries.filter((e) => e.status === 'published');
  if (pool.length === 0) return null;
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  return pool[day % pool.length] ?? null;
}

export interface SearchOptions {
  query: string;
  type: EntryType | 'all';
  emotionId: string | 'all';
  lang: Lang;
  emotions: Emotion[];
}

export function searchEntries(entries: Entry[], o: SearchOptions): Entry[] {
  const q = normalizeArabic(o.query.trim());
  return entries.filter((e) => {
    if (o.type !== 'all' && e.type !== o.type) return false;
    if (o.emotionId !== 'all' && !e.emotionIds.includes(o.emotionId)) return false;
    if (!q) return true;
    const emotionNames = e.emotionIds.flatMap((id) => {
      const em = o.emotions.find((x) => x.id === id);
      return em ? Object.values(em.name) : [];
    });
    const haystack = [
      e.arabic ?? '',
      e.surah?.nameAr ?? '',
      e.surah?.nameEn ?? '',
      e.sourceName ?? '',
      e.sourceReference ?? '',
      e.grade ?? '',
      ...e.translations.map((t) => t.body),
      ...emotionNames,
    ]
      .map(normalizeArabic)
      .join(' \n ');
    return haystack.includes(q);
  });
}

export function entryTitle(entry: Entry, lang: Lang): string {
  if (entry.type === 'quran' && entry.surah && entry.ayah) {
    const name = lang === 'ar' ? entry.surah.nameAr : entry.surah.nameEn;
    return `${name} ${entry.surah.number}:${entry.ayah}`;
  }
  return entry.sourceReference ? `${entry.sourceName ?? ''} ${entry.sourceReference}`.trim() : (entry.sourceName ?? '');
}

/** Text zum Kopieren/Teilen. */
export function shareText(entry: Entry, lang: Lang): string {
  const tr = getText(entry, lang === 'ar' ? 'de' : lang, 'translation') ?? getText(entry, 'en', 'translation');
  const parts = [entry.arabic, tr?.body, `— ${entryTitle(entry, lang)}`, entry.sourceUrl].filter(Boolean);
  return parts.join('\n\n');
}
