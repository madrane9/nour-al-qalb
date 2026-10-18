import { describe, expect, it } from 'vitest';
import { emotionFormSchema, entryFormSchema } from '@/lib/schemas';

const base = {
  type: 'hadith' as const,
  arabic: 'نص',
  surahNumber: null,
  ayahNumber: null,
  sourceId: null,
  sourceReference: '1',
  sourceUrl: 'https://sunnah.com/bukhari:1',
  grade: 'Sahih',
  gradeSource: 'Sahih al-Bukhari',
  status: 'published' as const,
  sourceVerified: true,
  emotionIds: ['x'],
};

describe('Qualitätsprüfung beim Veröffentlichen', () => {
  it('erlaubt Veröffentlichung nur nach manueller Quellenprüfung', () => {
    expect(entryFormSchema.safeParse(base).success).toBe(true);
    expect(entryFormSchema.safeParse({ ...base, sourceVerified: false }).success).toBe(false);
  });
  it('Entwürfe brauchen keine Prüfung', () => {
    expect(entryFormSchema.safeParse({ ...base, status: 'draft', sourceVerified: false, sourceUrl: '' }).success).toBe(true);
  });
  it('veröffentlichter Hadith braucht Bewertung und Bewertungsquelle', () => {
    expect(entryFormSchema.safeParse({ ...base, grade: '' }).success).toBe(false);
    expect(entryFormSchema.safeParse({ ...base, gradeSource: '' }).success).toBe(false);
  });
  it('Koranvers braucht Sure und Vers', () => {
    expect(entryFormSchema.safeParse({ ...base, type: 'quran', status: 'draft' }).success).toBe(false);
    expect(entryFormSchema.safeParse({ ...base, type: 'quran', status: 'draft', surahNumber: 94, ayahNumber: 6 }).success).toBe(true);
  });
  it('lehnt unsichere Links ab (nur https)', () => {
    expect(entryFormSchema.safeParse({ ...base, sourceUrl: 'javascript:alert(1)' }).success).toBe(false);
    expect(entryFormSchema.safeParse({ ...base, sourceUrl: 'http://example.com' }).success).toBe(false);
    expect(entryFormSchema.safeParse({ ...base, audioUrl: 'http://example.com/a.mp3' }).success).toBe(false);
  });
  it('verlangt mindestens ein Gefühl', () => {
    expect(entryFormSchema.safeParse({ ...base, emotionIds: [] }).success).toBe(false);
  });
});

describe('Gefühle', () => {
  const ok = { slug: 'joy-2', nameAr: 'ا', nameDe: 'a', nameEn: 'a', color: '#AABBCC', icon: 'sun', archived: false };
  it('validiert Farbe und Kennung', () => {
    expect(emotionFormSchema.safeParse(ok).success).toBe(true);
    expect(emotionFormSchema.safeParse({ ...ok, color: 'red' }).success).toBe(false);
    expect(emotionFormSchema.safeParse({ ...ok, slug: 'A B' }).success).toBe(false);
  });
});
