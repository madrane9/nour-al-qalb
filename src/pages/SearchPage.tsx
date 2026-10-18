import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useContent } from '@/state/ContentContext';
import { useLang } from '@/hooks/useLang';
import { searchEntries } from '@/lib/entries';
import { EntryCard } from '@/components/EntryCard';
import { ExploreToolbar, type TypeFilter } from '@/features/explore/ExploreToolbar';

export function SearchPage() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const { publicEmotions, publicEntries } = useContent();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [emotionId, setEmotionId] = useState('all');

  const results = useMemo(
    () => searchEntries(publicEntries, { query, type, emotionId, lang, emotions: publicEmotions }),
    [publicEntries, query, type, emotionId, lang, publicEmotions],
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold">{t('search.title')}</h1>
      <ExploreToolbar query={query} type={type} onQuery={setQuery} onType={setType} />
      <label className="mb-6 flex items-center gap-3 text-sm font-medium">
        {t('search.emotion')}
        <select
          value={emotionId}
          onChange={(e) => setEmotionId(e.target.value)}
          className="min-h-11 rounded-full border border-line bg-card px-4"
          data-testid="search-emotion"
        >
          <option value="all">{t('map.all')}</option>
          {publicEmotions.map((e) => (
            <option key={e.id} value={e.id}>{e.name[lang]}</option>
          ))}
        </select>
      </label>
      <p role="status" className="mb-4 text-sm text-muted">{t('search.results', { count: results.length })}</p>
      {results.length === 0 ? (
        <p>{t('search.none')}</p>
      ) : (
        <ul className="space-y-6">
          {results.map((e) => (
            <li key={e.id}><EntryCard entry={e} emotions={publicEmotions} /></li>
          ))}
        </ul>
      )}
    </div>
  );
}
