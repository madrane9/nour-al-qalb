import type { Catalog, Emotion, Entry, Scene } from '@/types';
import { buildLocalCatalog } from '@/data/localCatalog';
import { emotionRowSchema, entryRowSchema, sceneRowSchema, type EntryRow, type SceneRow } from '@/lib/schemas';
import { supabase } from './supabase';

export function mapEmotion(row: unknown): Emotion {
  const r = emotionRowSchema.parse(row);
  return {
    id: r.id,
    slug: r.slug,
    name: { ar: r.name_ar, de: r.name_de, en: r.name_en },
    color: r.color,
    icon: r.icon,
    sortOrder: r.sort_order,
    archived: r.archived,
  };
}

export function mapEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    type: row.type,
    arabic: row.arabic_text,
    surah:
      row.surah_number != null
        ? { number: row.surah_number, nameAr: row.surah_name_ar ?? '', nameEn: row.surah_name_en ?? '' }
        : null,
    ayah: row.ayah_number,
    emotionIds: row.entry_emotions.map((x) => x.emotion_id),
    translations: row.entry_translations.map((t) => ({
      lang: t.lang,
      kind: t.kind,
      body: t.body,
      sourceName: t.source_name,
    })),
    sourceName: row.religious_sources?.name ?? null,
    sourceReference: row.source_reference,
    sourceUrl: row.source_url,
    grade: row.grade,
    gradeSource: row.grade_source,
    audioUrl: row.audio_url,
    audioSource: row.audio_source,
    status: row.status,
    sourceVerified: row.source_verified,
  };
}

/** Öffentliche URL einer Datei im Bucket "scenes". */
export function sceneImageUrl(path: string): string {
  if (!supabase) return path;
  // Quelle: https://supabase.com/docs/reference/javascript/storage-from-getpublicurl
  return supabase.storage.from('scenes').getPublicUrl(path).data.publicUrl;
}

export function mapScene(row: SceneRow): Scene {
  return {
    id: row.id,
    entryId: row.entry_id,
    status: row.status,
    sortOrder: row.sort_order,
    images: row.scene_images.map((i) => ({ lang: i.lang, path: i.image_path, url: sceneImageUrl(i.image_path), alt: i.alt_text })),
  };
}

/**
 * Lädt den Katalog. Öffentlich liefert RLS nur veröffentlichte Einträge und
 * nicht archivierte Emotionen; ein Admin sieht zusätzlich Entwürfe/Archiviertes.
 */
export async function loadCatalog(): Promise<Catalog> {
  if (!supabase) return buildLocalCatalog();
  const [em, en, sc] = await Promise.all([
    supabase.from('emotions').select('*').order('sort_order'),
    supabase
      .from('religious_entries')
      .select('*, religious_sources(name), entry_translations(*), entry_emotions(emotion_id)')
      .order('created_at', { ascending: false }),
    supabase.from('scenes').select('*, scene_images(*)').order('sort_order'),
  ]);
  if (em.error) throw em.error;
  if (en.error) throw en.error;
  return {
    emotions: (em.data ?? []).map(mapEmotion),
    entries: (en.data ?? []).map((r) => mapEntry(entryRowSchema.parse(r))),
    // Fehlt die Tabelle noch (Migration 0003 nicht ausgeführt), bleibt die Seite trotzdem nutzbar.
    scenes: sc.error ? [] : (sc.data ?? []).map((r) => mapScene(sceneRowSchema.parse(r))),
  };
}
