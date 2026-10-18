import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from 'motion/react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import type { Entry } from '@/types';
import { useContent } from '@/state/ContentContext';
import { pickUnseen } from '@/lib/entries';
import { HopeJar } from '@/components/HopeJar';
import { EmotionButton } from '@/components/EmotionButton';
import { EntryCard } from '@/components/EntryCard';

type Phase = 'idle' | 'drawing' | 'open';

export function JarView() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { publicEmotions, publicEntries } = useContent();
  const [phase, setPhase] = useState<Phase>('idle');
  const [emotionId, setEmotionId] = useState<string | null>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [notice, setNotice] = useState('');
  const seen = useRef<Map<string, Set<string>>>(new Map());
  const cardRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number>();

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of publicEntries) for (const id of e.emotionIds) c[id] = (c[id] ?? 0) + 1;
    return c;
  }, [publicEntries]);

  const emotion = publicEmotions.find((e) => e.id === emotionId) ?? null;

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (phase === 'open') cardRef.current?.focus();
  }, [phase, entry]);

  const draw = (id: string) => {
    const pool = publicEntries.filter((e) => e.emotionIds.includes(id));
    setEmotionId(id);
    setNotice('');
    if (pool.length === 0) {
      setEntry(null);
      setPhase('open');
      return;
    }
    const set = seen.current.get(id) ?? new Set<string>();
    const { entry: next, cycled } = pickUnseen(pool, set);
    if (cycled) {
      set.clear();
      setNotice(t('jar.again'));
    }
    if (next) set.add(next.id);
    seen.current.set(id, set);
    setEntry(next);
    setPhase('drawing');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPhase('open'), reduce ? 0 : 900);
  };

  const back = () => {
    setPhase('idle');
    setEntry(null);
  };

  return (
    <section aria-labelledby="jar-title" className="mx-auto max-w-3xl">
      <h2 id="jar-title" className="sr-only">{t('jar.title')}</h2>

      {phase !== 'open' && (
        <>
          <p className="mb-4 text-center text-muted">{t('jar.hint')}</p>
          <HopeJar
            emotions={publicEmotions}
            counts={counts}
            shaking={phase === 'drawing'}
            pulledColor={phase === 'drawing' ? (emotion?.color ?? null) : null}
            onSlipClick={draw}
          />
          <p role="status" className="mt-2 h-6 text-center text-sm text-gold">
            {phase === 'drawing' ? t('jar.slipOpening') : ''}
          </p>
        </>
      )}

      {phase === 'open' && (
        <div ref={cardRef} tabIndex={-1} className="outline-none" data-testid="jar-result">
          {entry ? (
            <EntryCard entry={entry} emotions={publicEmotions} accent={emotion?.color} />
          ) : (
            <p className="rounded-xl2 border border-line bg-card p-6 text-center">{t('jar.empty')}</p>
          )}
          {notice && <p role="status" className="mt-3 text-center text-sm text-gold">{notice}</p>}
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {emotionId && entry && (
              <button
                type="button"
                onClick={() => draw(emotionId)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-ivory shadow-soft hover:opacity-90"
              >
                <Sparkles className="h-4 w-4" aria-hidden /> {t('jar.another')}
              </button>
            )}
            <button
              type="button"
              onClick={back}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold hover:bg-line/40"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden /> {t('jar.back')}
            </button>
          </div>
        </div>
      )}

      <div className="mt-8" role="group" aria-label={t('home.howFeel')}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {publicEmotions.map((e) => (
            <li key={e.id}>
              <EmotionButton emotion={e} active={e.id === emotionId && phase !== 'idle'} count={counts[e.id] ?? 0} onClick={() => draw(e.id)} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
