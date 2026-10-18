import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContent } from '@/state/ContentContext';
import { useLang } from '@/hooks/useLang';
import { entryTitle, searchEntries } from '@/lib/entries';
import { deleteEntry, setEntryStatus } from '@/services/admin';
import type { EntryStatus, EntryType } from '@/types';

export function EntriesList() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const { entries, emotions, reload } = useContent();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<EntryStatus | 'all'>('all');
  const [type, setType] = useState<EntryType | 'all'>('all');
  const [msg, setMsg] = useState('');

  const list = useMemo(
    () => searchEntries(entries, { query, type, emotionId: 'all', lang, emotions }).filter((e) => status === 'all' || e.status === status),
    [entries, query, type, status, lang, emotions],
  );

  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
      await reload();
      setMsg(t('admin.saved'));
    } catch (e) {
      setMsg(t('admin.error', { message: (e as Error).message }));
    }
  };

  const sel = 'min-h-11 rounded-full border border-line bg-card px-4 text-sm';
  const act = 'min-h-9 rounded-full border border-line px-3 text-xs font-semibold hover:bg-line/40';
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('search.placeholder')} aria-label={t('search.placeholder')} className={`${sel} flex-1`} />
        <select aria-label={t('admin.filters.status')} className={sel} value={status} onChange={(e) => setStatus(e.target.value as EntryStatus | 'all')}>
          <option value="all">{t('admin.filters.all')}</option>
          {(['draft', 'published', 'archived'] as const).map((s) => <option key={s} value={s}>{t(`admin.status.${s}`)}</option>)}
        </select>
        <select aria-label={t('admin.filters.type')} className={sel} value={type} onChange={(e) => setType(e.target.value as EntryType | 'all')}>
          <option value="all">{t('admin.filters.all')}</option>
          {(['quran', 'hadith', 'reflection'] as const).map((s) => <option key={s} value={s}>{t(`entry.types.${s}`)}</option>)}
        </select>
      </div>
      <p role="status" className="mb-3 min-h-5 text-sm text-gold">{msg}</p>
      {list.length === 0 ? (
        <p>{t('admin.noEntries')}</p>
      ) : (
        <ul className="space-y-2">
          {list.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-card p-3" data-testid="admin-entry">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t(`entry.types.${e.type}`)} · {entryTitle(e, lang)}</p>
                <p className="truncate text-sm text-muted" lang={e.arabic ? 'ar' : undefined}>{e.arabic ?? e.translations[0]?.body}</p>
              </div>
              <span className="rounded-full bg-line/60 px-3 py-1 text-xs font-semibold">{t(`admin.status.${e.status}`)}</span>
              <Link className={act} to={`/admin/entries/${e.id}`}>{t('admin.edit')}</Link>
              {e.status === 'published' ? (
                <button type="button" className={act} onClick={() => void run(() => setEntryStatus(e.id, 'draft'))}>{t('admin.unpublish')}</button>
              ) : e.sourceVerified || e.type === 'reflection' ? (
                <button type="button" className={act} onClick={() => void run(() => setEntryStatus(e.id, 'published'))}>{t('admin.publish')}</button>
              ) : null}
              {e.status !== 'archived' && <button type="button" className={act} onClick={() => void run(() => setEntryStatus(e.id, 'archived'))}>{t('admin.archive')}</button>}
              <button type="button" className={act} onClick={() => { if (window.confirm(t('admin.confirmDelete'))) void run(() => deleteEntry(e.id)); }}>{t('admin.delete')}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
