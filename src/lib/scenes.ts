import type { Entry, Scene, SceneImage, SceneLang } from '@/types';

/**
 * Wählt das passende Bild für die aktuelle Sprache.
 * Reihenfolge: aktuelle Sprache, dann Arabisch, dann Deutsch, dann irgendein Bild.
 */
export function pickSceneImage(scene: Scene, lang: SceneLang): SceneImage | null {
  const order: SceneLang[] = [lang, 'ar', 'de', 'en', 'fr'];
  for (const l of order) {
    const img = scene.images.find((i) => i.lang === l);
    if (img) return img;
  }
  return null;
}

/** Öffentlich sichtbare Szenen: veröffentlicht, mit Bild und mit sichtbarem Antwort-Eintrag. */
export function visibleScenes(scenes: Scene[], publicEntries: Entry[]): Scene[] {
  const ids = new Set(publicEntries.map((e) => e.id));
  return scenes
    .filter((s) => s.status === 'published' && s.images.length > 0 && ids.has(s.entryId))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

