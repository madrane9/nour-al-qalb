import type { EmotionForm, EntryForm, SceneForm } from '@/lib/schemas';
import type { SceneLang } from '@/types';
import { supabase } from './supabase';

function db() {
  if (!supabase) throw new Error('supabase-not-configured');
  return supabase;
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle();
  if (error) return false;
  return Boolean(data);
}

export interface SourceRow {
  id: string;
  name: string;
  kind: string;
}

export async function listSources(): Promise<SourceRow[]> {
  const { data, error } = await db().from('religious_sources').select('id,name,kind').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createSource(name: string, kind: 'quran' | 'hadith' | 'other', baseUrl: string): Promise<SourceRow> {
  const { data, error } = await db()
    .from('religious_sources')
    .insert({ name, kind, base_url: baseUrl || null })
    .select('id,name,kind')
    .single();
  if (error) throw error;
  return data as SourceRow;
}

/** Speichert Eintrag + Übersetzungen + Emotionszuordnung. Gibt die Eintrags-ID zurück. */
export async function saveEntry(form: EntryForm, id?: string): Promise<string> {
  const c = db();
  const row = {
    type: form.type,
    arabic_text: form.arabic || null,
    surah_number: form.type === 'quran' ? form.surahNumber : null,
    surah_name_ar: form.surahNameAr || null,
    surah_name_en: form.surahNameEn || null,
    ayah_number: form.type === 'quran' ? form.ayahNumber : null,
    source_id: form.sourceId,
    source_reference: form.sourceReference || null,
    source_url: form.sourceUrl || null,
    grade: form.grade || null,
    grade_source: form.gradeSource || null,
    audio_url: form.audioUrl || null,
    audio_source: form.audioSource || null,
    status: form.status,
    source_verified: form.sourceVerified,
  };
  let entryId = id;
  if (entryId) {
    const { error } = await c.from('religious_entries').update(row).eq('id', entryId);
    if (error) throw error;
  } else {
    const { data, error } = await c.from('religious_entries').insert(row).select('id').single();
    if (error) throw error;
    entryId = (data as { id: string }).id;
  }

  const kind = form.type === 'reflection' ? 'reflection' : 'translation';
  const texts = [
    { lang: 'de', kind, body: form.de, source_name: form.deSource },
    { lang: 'en', kind, body: form.en, source_name: form.enSource },
    { lang: 'ar', kind: form.type === 'reflection' ? 'reflection' : 'explanation', body: form.ar, source_name: '' },
  ] as const;
  const keep = texts.filter((t) => t.body);
  // Zeilen ohne Text entfernen, übrige ersetzen
  const { error: delErr } = await c.from('entry_translations').delete().eq('entry_id', entryId);
  if (delErr) throw delErr;
  if (keep.length) {
    const { error } = await c
      .from('entry_translations')
      .insert(keep.map((t) => ({ entry_id: entryId, lang: t.lang, kind: t.kind, body: t.body, source_name: t.source_name || null })));
    if (error) throw error;
  }

  const { error: delEm } = await c.from('entry_emotions').delete().eq('entry_id', entryId);
  if (delEm) throw delEm;
  const { error: emErr } = await c
    .from('entry_emotions')
    .insert(form.emotionIds.map((emotion_id) => ({ entry_id: entryId, emotion_id })));
  if (emErr) throw emErr;
  return entryId as string;
}

export async function setEntryStatus(id: string, status: 'draft' | 'published' | 'archived'): Promise<void> {
  const { error } = await db().from('religious_entries').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await db().from('religious_entries').delete().eq('id', id);
  if (error) throw error;
}

export async function saveEmotion(form: EmotionForm, id?: string): Promise<void> {
  const row = {
    slug: form.slug,
    name_ar: form.nameAr,
    name_de: form.nameDe,
    name_en: form.nameEn,
    color: form.color,
    icon: form.icon,
    archived: form.archived,
  };
  const q = id ? db().from('emotions').update(row).eq('id', id) : db().from('emotions').insert(row);
  const { error } = await q;
  if (error) throw error;
}

// ---------- Szenen ("Situation & Antwort") ----------

const SCENE_BUCKET = 'scenes';
const ALLOWED_IMAGE_TYPES = ['image/webp', 'image/png', 'image/jpeg'];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // muss zum Bucket-Limit in 0003_scenes.sql passen

/** Legt eine Szene an oder ändert sie. Gibt die Szenen-ID zurück. */
export async function saveScene(form: SceneForm, id?: string): Promise<string> {
  const row = { entry_id: form.entryId, status: form.status, sort_order: form.sortOrder };
  if (id) {
    const { error } = await db().from('scenes').update(row).eq('id', id);
    if (error) throw error;
    return id;
  }
  const { data, error } = await db().from('scenes').insert(row).select('id').single();
  if (error) throw error;
  return (data as { id: string }).id;
}

/**
 * Lädt ein Bild für eine Sprache hoch und speichert den Verweis.
 * Ein altes Bild derselben Sprache wird danach gelöscht.
 * Quelle: https://supabase.com/docs/reference/javascript/storage-from-upload
 */
export async function uploadSceneImage(sceneId: string, lang: SceneLang, file: File, alt: string, oldPath?: string): Promise<void> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error('image-type');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('image-size');
  const ext = file.type.split('/')[1];
  // Neuer Dateiname bei jedem Upload, damit Browser-Caches kein altes Bild zeigen.
  const path = `${sceneId}/${lang}-${Date.now()}.${ext}`;
  const c = db();
  const { error: upErr } = await c.storage.from(SCENE_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw upErr;
  const { error } = await c
    .from('scene_images')
    .upsert({ scene_id: sceneId, lang, image_path: path, alt_text: alt }, { onConflict: 'scene_id,lang' });
  if (error) {
    await c.storage.from(SCENE_BUCKET).remove([path]); // Aufräumen, wenn der Verweis nicht gespeichert wurde
    throw error;
  }
  if (oldPath && oldPath !== path) await c.storage.from(SCENE_BUCKET).remove([oldPath]);
}

/** Ändert nur die Bildbeschreibung (ohne neues Bild). */
export async function updateSceneImageAlt(sceneId: string, lang: SceneLang, alt: string): Promise<void> {
  const { error } = await db().from('scene_images').update({ alt_text: alt }).eq('scene_id', sceneId).eq('lang', lang);
  if (error) throw error;
}

/** Entfernt das Bild einer Sprache (Datei + Verweis). */
export async function deleteSceneImage(sceneId: string, lang: SceneLang, path: string): Promise<void> {
  const c = db();
  const { error } = await c.from('scene_images').delete().eq('scene_id', sceneId).eq('lang', lang);
  if (error) throw error;
  await c.storage.from(SCENE_BUCKET).remove([path]);
}

/** Löscht eine Szene samt aller Bilddateien. */
export async function deleteScene(id: string, paths: string[]): Promise<void> {
  const c = db();
  const { error } = await c.from('scenes').delete().eq('id', id);
  if (error) throw error;
  if (paths.length) await c.storage.from(SCENE_BUCKET).remove(paths);
}
