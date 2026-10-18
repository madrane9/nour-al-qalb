import { describe, expect, it } from 'vitest';
import { buildLocalCatalog } from '@/data/localCatalog';
import { dailyEntry, normalizeArabic, pickUnseen, searchEntries } from '@/lib/entries';

const { emotions, entries } = buildLocalCatalog();

describe('Katalog', () => {
  it('enthält die 12 geforderten Gefühle mit Name, Farbe und Symbol', () => {
    expect(emotions).toHaveLength(12);
    for (const e of emotions) {
      expect(e.name.ar && e.name.de && e.name.en).toBeTruthy();
      expect(e.color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(e.icon).toBeTruthy();
    }
  });

  it('jedes Gefühl hat mindestens zwei veröffentlichte Verse', () => {
    for (const e of emotions) {
      expect(entries.filter((x) => x.emotionIds.includes(e.id)).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('Koranverse sind arabisch, verifiziert und mit Quelllink versehen', () => {
    for (const q of entries) {
      expect(q.arabic).toBeTruthy();
      expect(q.sourceVerified).toBe(true);
      expect(q.sourceUrl).toMatch(/^https:\/\/quran\.com\//);
      expect(q.translations.some((t) => t.lang === 'de' && t.kind === 'translation' && /Bubenheim/.test(t.sourceName ?? ''))).toBe(true);
    }
  });

  it('Darija-Texte sind als Erklärung markiert, nie als Übersetzung', () => {
    for (const q of entries) {
      const ar = q.translations.filter((t) => t.lang === 'ar');
      expect(ar.every((t) => t.kind === 'explanation')).toBe(true);
    }
  });
});

describe('pickUnseen', () => {
  it('zeigt keinen Eintrag doppelt, bis alle gesehen wurden', () => {
    const pool = entries.slice(0, 4);
    const seen = new Set<string>();
    const ids: string[] = [];
    for (let i = 0; i < 4; i++) {
      const { entry, cycled } = pickUnseen(pool, seen);
      expect(cycled).toBe(false);
      seen.add(entry!.id);
      ids.push(entry!.id);
    }
    expect(new Set(ids).size).toBe(4);
    expect(pickUnseen(pool, seen).cycled).toBe(true);
  });

  it('liefert null bei leerem Pool', () => {
    expect(pickUnseen([], new Set()).entry).toBeNull();
  });
});

describe('Suche', () => {
  const base = { type: 'all' as const, emotionId: 'all', lang: 'de' as const, emotions };
  it('findet nach Übersetzung, Quelle und Gefühl', () => {
    expect(searchEntries(entries, { ...base, query: 'Erleichterung' }).length).toBeGreaterThan(0);
    expect(searchEntries(entries, { ...base, query: 'quran.com' }).length).toBeGreaterThan(0);
    expect(searchEntries(entries, { ...base, query: 'Einsamkeit' }).length).toBeGreaterThan(0);
  });
  it('findet arabischen Text ohne Diakritika', () => {
    expect(searchEntries(entries, { ...base, query: 'العسر' }).length).toBeGreaterThan(0);
  });
  it('filtert nach Typ', () => {
    expect(searchEntries(entries, { ...base, query: '', type: 'hadith' })).toHaveLength(0);
  });
  it('normalisiert arabische Schrift', () => {
    expect(normalizeArabic('ٱلْعُسْرِ')).toBe(normalizeArabic('العسر'));
  });
});

describe('Tägliche Inspiration', () => {
  it('ist pro Tag stabil', () => {
    const d = new Date(2026, 5, 1, 8);
    const d2 = new Date(2026, 5, 1, 22);
    expect(dailyEntry(entries, d)?.id).toBe(dailyEntry(entries, d2)?.id);
  });
});
