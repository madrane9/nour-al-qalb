import { useTranslation } from 'react-i18next';
import { useContent } from '@/state/ContentContext';
import { useFavorites } from '@/state/FavoritesContext';
import { EntryCard } from '@/components/EntryCard';

export function FavoritesPage() {
  const { t } = useTranslation();
  const { publicEmotions, publicEntries } = useContent();
  const { ids, synced } = useFavorites();
  const list = publicEntries.filter((e) => ids.has(e.id));
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-3xl font-bold">{t('favorites.title')}</h1>
      {!synced && <p className="mb-6 text-sm text-muted">{t('favorites.guestNote')}</p>}
      {list.length === 0 ? (
        <p>{t('favorites.empty')}</p>
      ) : (
        <ul className="space-y-6" data-testid="favorites-list">
          {list.map((e) => (
            <li key={e.id}><EntryCard entry={e} emotions={publicEmotions} /></li>
          ))}
        </ul>
      )}
    </div>
  );
}
