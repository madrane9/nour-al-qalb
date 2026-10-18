import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import type { EntryType } from '@/types';

export type TypeFilter = EntryType | 'all';

interface Props {
  query: string;
  type: TypeFilter;
  onQuery: (q: string) => void;
  onType: (t: TypeFilter) => void;
}

const TYPES: TypeFilter[] = ['all', 'quran', 'hadith', 'reflection'];

export function ExploreToolbar({ query, type, onQuery, onType }: Props) {
  const { t } = useTranslation();
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <label className="relative flex-1">
        <span className="sr-only">{t('map.search')}</span>
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={t('map.search')}
          className="min-h-11 w-full rounded-full border border-line bg-card ps-10 pe-4 text-sm"
        />
      </label>
      <div role="group" aria-label={t('map.filter')} className="flex flex-wrap gap-2">
        {TYPES.map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={type === k}
            onClick={() => onType(k)}
            className={`min-h-11 rounded-full border px-4 text-sm font-medium ${
              type === k ? 'border-gold bg-gold text-ivory' : 'border-line bg-card hover:bg-line/40'
            }`}
          >
            {t(k === 'all' ? 'map.all' : `map.${k}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
