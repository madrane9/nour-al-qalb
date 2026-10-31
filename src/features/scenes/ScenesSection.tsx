import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Emotion, Entry, Scene } from '@/types';
import { useLang } from '@/hooks/useLang';
import { pickSceneImage } from '@/lib/scenes';
import { EntryCard } from '@/components/EntryCard';

interface Props {
  scenes: Scene[];
  entries: Entry[];
  emotions: Emotion[];
}

/**
 * Abschnitt "Situation & Antwort" auf der Startseite.
 * Zeigt eine Szene (Bild in der aktuellen Sprache) und darunter den Vers als Antwort.
 * Mit Vor/Zurück blättert man durch alle Szenen.
 */
export function ScenesSection({ scenes, entries, emotions }: Props) {
  const { t } = useTranslation();
  const { lang, rtl } = useLang();
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  if (scenes.length === 0) return null;
  const scene = scenes[index % scenes.length]!;
  const image = pickSceneImage(scene, lang);
  const entry = entries.find((e) => e.id === scene.entryId);
  if (!image || !entry) return null;

  // Beim Blättern die Antwort wieder verdecken, damit man erst selbst nachdenkt.
  const go = (step: number) => {
    setIndex((i) => (i + step + scenes.length) % scenes.length);
    setShowAnswer(false);
  };

  // In RTL zeigen die Pfeile in die andere Richtung.
  const Prev = rtl ? ChevronRight : ChevronLeft;
  const Next = rtl ? ChevronLeft : ChevronRight;
  const btn = 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line hover:bg-line/40';

  return (
    <section className="mx-auto mt-14 max-w-3xl" aria-labelledby="scenes-title" data-testid="scenes-section">
      <h2 id="scenes-title" className="mb-1 text-center text-xl font-bold text-gold">{t('scenes.title')}</h2>
      <p className="mb-4 text-center text-sm text-muted">{t('scenes.hint')}</p>

      <figure className="overflow-hidden rounded-xl2 border border-line bg-card shadow-soft">
        <img
          src={image.url}
          alt={image.alt}
          lang={image.lang}
          loading="lazy"
          decoding="async"
          className="mx-auto block max-h-[70vh] w-full object-contain"
          data-testid="scene-image"
        />
        {image.lang !== lang && (
          <figcaption className="p-2 text-center text-xs text-muted">{t('scenes.otherLang')}</figcaption>
        )}
      </figure>

      <div className="my-4 flex items-center justify-center gap-3">
        {scenes.length > 1 && (
          <button type="button" className={btn} onClick={() => go(-1)} aria-label={t('scenes.prev')}>
            <Prev className="h-5 w-5" aria-hidden />
          </button>
        )}
        <button
          type="button"
          aria-expanded={showAnswer}
          aria-controls="scene-answer"
          onClick={() => setShowAnswer((v) => !v)}
          className="min-h-11 rounded-full bg-gold px-5 font-semibold text-ivory"
          data-testid="scene-toggle"
        >
          {showAnswer ? t('scenes.hideAnswer') : t('scenes.showAnswer')}
        </button>
        {scenes.length > 1 && (
          <button type="button" className={btn} onClick={() => go(1)} aria-label={t('scenes.next')}>
            <Next className="h-5 w-5" aria-hidden />
          </button>
        )}
      </div>
      {scenes.length > 1 && (
        <p className="mb-4 text-center text-xs text-muted" aria-live="polite">
          {t('scenes.counter', { current: (index % scenes.length) + 1, total: scenes.length })}
        </p>
      )}

      <div id="scene-answer" hidden={!showAnswer}>
        {showAnswer && <EntryCard entry={entry} emotions={emotions} />}
      </div>
    </section>
  );
}
