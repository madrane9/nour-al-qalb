import { describe, expect, it } from 'vitest';
import type { Entry, Scene } from '@/types';
import { pickSceneImage, visibleScenes } from '@/lib/scenes';

const img = (lang: 'ar' | 'de' | 'en' | 'fr') => ({ lang, path: `${lang}.webp`, url: `/${lang}.webp`, alt: lang });
const scene = (over: Partial<Scene> = {}): Scene => ({
  id: 's1', entryId: 'e1', status: 'published', sortOrder: 0, images: [img('ar'), img('de')], ...over,
});

describe('pickSceneImage', () => {
  it('nimmt das Bild der aktuellen Sprache', () => {
    expect(pickSceneImage(scene(), 'de')?.lang).toBe('de');
  });
  it('fällt auf Arabisch zurück, wenn die Sprache fehlt', () => {
    expect(pickSceneImage(scene(), 'en')?.lang).toBe('ar');
  });
  it('liefert null ohne Bilder', () => {
    expect(pickSceneImage(scene({ images: [] }), 'de')).toBeNull();
  });
});

describe('visibleScenes', () => {
  const entries = [{ id: 'e1' } as Entry];
  it('zeigt nur veröffentlichte Szenen mit Bild und sichtbarer Antwort, sortiert', () => {
    const list = visibleScenes(
      [
        scene({ id: 'b', sortOrder: 2 }),
        scene({ id: 'a', sortOrder: 1 }),
        scene({ id: 'draft', status: 'draft' }),
        scene({ id: 'noimg', images: [] }),
        scene({ id: 'orphan', entryId: 'x' }),
      ],
      entries,
    );
    expect(list.map((s) => s.id)).toEqual(['a', 'b']);
  });
});

describe('lokale Szenen (scenes.json)', () => {
  it('jede Szene zeigt auf einen vorhandenen Vers und hat Bilder', async () => {
    const { buildLocalCatalog } = await import('@/data/localCatalog');
    const scenesJson = (await import('@/data/scenes.json')).default as unknown[];
    const catalog = buildLocalCatalog();
    // Eine Szene mit falscher entryKey würde still wegfallen. Das soll der Test bemerken.
    expect(catalog.scenes).toHaveLength(scenesJson.length);
    for (const s of catalog.scenes) {
      expect(catalog.entries.some((e) => e.id === s.entryId)).toBe(true);
      expect(s.images.length).toBeGreaterThan(0);
      s.images.forEach((i) => expect(i.alt.trim()).not.toBe(''));
    }
  });
});
