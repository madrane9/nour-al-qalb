import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContent } from '@/state/ContentContext';

export function Dashboard() {
  const { t } = useTranslation();
  const { entries, emotions } = useContent();
  const stats = [
    { k: 'total', v: entries.length },
    { k: 'published', v: entries.filter((e) => e.status === 'published').length },
    { k: 'drafts', v: entries.filter((e) => e.status === 'draft').length },
    { k: 'emotions', v: emotions.length },
  ];
  const add = 'inline-flex min-h-11 items-center rounded-full bg-gold px-5 text-sm font-semibold text-ivory';
  return (
    <div className="space-y-8">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.k} className="rounded-2xl border border-line bg-card p-4">
            <dt className="text-sm text-muted">{t(`admin.stats.${s.k}`)}</dt>
            <dd className="text-3xl font-bold" data-testid={`stat-${s.k}`}>{s.v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-3">
        <Link className={add} to="/admin/entries/new/quran">{t('admin.newQuran')}</Link>
        <Link className={add} to="/admin/entries/new/hadith">{t('admin.newHadith')}</Link>
        <Link className={add} to="/admin/entries/new/reflection">{t('admin.newReflection')}</Link>
      </div>
    </div>
  );
}
