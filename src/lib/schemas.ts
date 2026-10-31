import { z } from 'zod';

const nullableString = z.string().nullable().optional().transform((v) => v ?? null);

export const emotionRowSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name_ar: z.string(),
  name_de: z.string(),
  name_en: z.string(),
  color: z.string(),
  icon: z.string(),
  sort_order: z.number(),
  archived: z.boolean(),
});

export const entryRowSchema = z.object({
  id: z.string(),
  type: z.enum(['quran', 'hadith', 'reflection']),
  arabic_text: nullableString,
  surah_number: z.number().nullable(),
  surah_name_ar: nullableString,
  surah_name_en: nullableString,
  ayah_number: z.number().nullable(),
  source_reference: nullableString,
  source_url: nullableString,
  grade: nullableString,
  grade_source: nullableString,
  audio_url: nullableString,
  audio_source: nullableString,
  status: z.enum(['draft', 'published', 'archived']),
  source_verified: z.boolean(),
  religious_sources: z.object({ name: z.string() }).nullable(),
  entry_translations: z.array(
    z.object({
      lang: z.enum(['ar', 'de', 'en']),
      kind: z.enum(['translation', 'explanation', 'reflection']),
      body: z.string(),
      source_name: nullableString,
    }),
  ),
  entry_emotions: z.array(z.object({ emotion_id: z.string() })),
});
export type EntryRow = z.infer<typeof entryRowSchema>;

export const sceneRowSchema = z.object({
  id: z.string(),
  entry_id: z.string(),
  status: z.enum(['draft', 'published', 'archived']),
  sort_order: z.number(),
  scene_images: z.array(
    z.object({
      lang: z.enum(['ar', 'de', 'en', 'fr']),
      image_path: z.string(),
      alt_text: z.string(),
    }),
  ),
});
export type SceneRow = z.infer<typeof sceneRowSchema>;

const httpsUrl = z
  .string()
  .trim()
  .url()
  .refine((u) => u.startsWith('https://'), 'https erforderlich');

/** Formular im Adminbereich. Veröffentlichung nur nach manueller Quellenprüfung. */
export const entryFormSchema = z
  .object({
    type: z.enum(['quran', 'hadith', 'reflection']),
    arabic: z.string().trim().max(5000).optional().default(''),
    surahNumber: z.number().int().min(1).max(114).nullable(),
    surahNameAr: z.string().trim().max(100).optional().default(''),
    surahNameEn: z.string().trim().max(100).optional().default(''),
    ayahNumber: z.number().int().min(1).nullable(),
    sourceId: z.string().nullable(),
    sourceReference: z.string().trim().max(200).optional().default(''),
    sourceUrl: z.union([httpsUrl, z.literal('')]).default(''),
    grade: z.string().trim().max(200).optional().default(''),
    gradeSource: z.string().trim().max(300).optional().default(''),
    audioUrl: z.union([httpsUrl, z.literal('')]).default(''),
    audioSource: z.string().trim().max(200).optional().default(''),
    status: z.enum(['draft', 'published', 'archived']),
    sourceVerified: z.boolean(),
    emotionIds: z.array(z.string()).min(1, 'emotionRequired'),
    de: z.string().trim().max(5000).optional().default(''),
    deSource: z.string().trim().max(200).optional().default(''),
    en: z.string().trim().max(5000).optional().default(''),
    enSource: z.string().trim().max(200).optional().default(''),
    ar: z.string().trim().max(5000).optional().default(''),
  })
  .superRefine((v, ctx) => {
    const bad = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message });
    if (v.type === 'quran') {
      if (!v.arabic) bad('arabic', 'required');
      if (v.surahNumber == null) bad('surahNumber', 'required');
      if (v.ayahNumber == null) bad('ayahNumber', 'required');
    }
    if (v.type === 'hadith' && v.status === 'published') {
      if (!v.grade) bad('grade', 'required');
      if (!v.gradeSource) bad('gradeSource', 'required');
    }
    if (v.status === 'published' && v.type !== 'reflection') {
      if (!v.sourceVerified) bad('sourceVerified', 'verifyRequired');
      if (!v.sourceUrl) bad('sourceUrl', 'required');
      if (!v.sourceReference) bad('sourceReference', 'required');
    }
    if (v.type === 'reflection' && !v.de && !v.en && !v.ar) bad('de', 'required');
  });
export type EntryForm = z.infer<typeof entryFormSchema>;

export const emotionFormSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, 'slug').max(40),
  nameAr: z.string().trim().min(1).max(60),
  nameDe: z.string().trim().min(1).max(60),
  nameEn: z.string().trim().min(1).max(60),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'color'),
  icon: z.string().min(1),
  archived: z.boolean(),
});
export type EmotionForm = z.infer<typeof emotionFormSchema>;

/** Formular für Szenen im Adminbereich. Bilder werden separat hochgeladen. */
export const sceneFormSchema = z.object({
  entryId: z.string().min(1, 'required'),
  status: z.enum(['draft', 'published', 'archived']),
  sortOrder: z.number().int().min(0).max(9999),
});
export type SceneForm = z.infer<typeof sceneFormSchema>;
