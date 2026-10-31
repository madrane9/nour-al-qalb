import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { List, Network, FlaskConical } from 'lucide-react';
import { useContent } from '@/state/ContentContext';
import { useLang } from '@/hooks/useLang';
import { dailyEntry, searchEntries } from '@/lib/entries';
import { isSupabaseConfigured } from '@/services/supabase';
import { EntryCard } from '@/components/EntryCard';
import { JarView } from '@/features/jar/JarView';
import { MapView } from '@/features/explore/MapView';
import { ListView } from '@/features/explore/ListView';
import { ExploreToolbar, type TypeFilter } from '@/features/explore/ExploreToolbar';
import { ScenesSection } from '@/features/scenes/ScenesSection';

type Mode = 'jar' | 'map' | 'list';
const MODES: { id: Mode; icon: typeof List }[] = [
  { id: 'jar', icon: FlaskConical },
  { id: 'map', icon: Network },
  { id: 'list', icon: List },
];

export function DiscoverPage() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const { status, publicEmotions, publicEntries, publicScenes, reload } = useContent();
  const [params, setParams] = useSearchParams();
  const mode: Mode = (['jar', 'map', 'list'] as const).find((m) => m === params.get('mode')) ?? 'jar';
  const [query, setQuery] = useState('');
  const [type, setType] = useState<TypeFilter>('all');

  const filtered = useMemo(
    () => searchEntries(publicEntries, { query, type, emotionId: 'all', lang, emotions: publicEmotions }),
    [publicEntries, query, type, lang, publicEmotions],
  );
  const daily = useMemo(() => dailyEntry(publicEntries), [publicEntries]);

  return (
    <div>
      <section className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="mb-2 font-arabic text-6xl text-gold" lang="ar">نور القلب</h1>
        <p className="text-2xl font-semibold">{t('app.name')}</p>
        <p className="mt-2 text-lg text-muted">{t('app.tagline')}</p>
        <p className="mt-6 text-2xl font-bold" data-testid="how-feel">{t('home.howFeel')}</p>
      </section>

      {!isSupabaseConfigured && (
        <p className="mx-auto mb-6 max-w-2xl rounded-2xl border border-dashed border-gold/60 p-3 text-center text-sm text-muted">
          {t('home.localMode')}
        </p>
      )}

      {status === 'loading' && <p role="status" className="text-center">{t('home.loading')}</p>}
      {status === 'error' && (
        <div role="alert" className="text-center">
          <p className="mb-3">{t('home.loadError')}</p>
          <button type="button" onClick={() => void reload()} className="min-h-11 rounded-full bg-gold px-5 font-semibold text-ivory">{t('home.retry')}</button>
        </div>
      )}

      {status === 'ready' && (
        <>
          <div role="group" aria-label={t('mode.label')} className="mx-auto mb-8 flex w-fit rounded-full border border-line bg-card p-1">
            {MODES.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={mode === id}
                data-testid={`mode-${id}`}
                onClick={() => setParams(id === 'jar' ? {} : { mode: id })}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ${mode === id ? 'bg-gold text-ivory' : 'hover:bg-line/50'}`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {t(`mode.${id}`)}
              </button>
            ))}
          </div>

          {mode === 'jar' && <JarView />}
          {mode !== 'jar' && (
            <>
              <ExploreToolbar query={query} type={type} onQuery={setQuery} onType={setType} />
              {mode === 'map' ? (
                <MapView emotions={publicEmotions} entries={filtered} query={query} />
              ) : (
                <ListView emotions={publicEmotions} entries={filtered} />
              )}
            </>
          )}

          {daily && (
            <section className="mx-auto mt-14 max-w-3xl" aria-labelledby="daily-title">
              <h2 id="daily-title" className="mb-4 text-center text-xl font-bold text-gold">{t('home.daily')}</h2>
              <EntryCard entry={daily} emotions={publicEmotions} />
            </section>
          )}

          <ScenesSection scenes={publicScenes} entries={publicEntries} emotions={publicEmotions} />
        </>
      )}
    </div>
  );
}
