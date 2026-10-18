import { useTranslation } from 'react-i18next';
import type { Emotion, Entry } from '@/types';
import { useLang } from '@/hooks/useLang';
import { emotionIcon, readableOn } from '@/lib/icons';
import { entryTitle } from '@/lib/entries';
import { EntryCard } from '@/components/EntryCard';

interface Props {
  emotions: Emotion[];
  entries: Entry[];
}

/** Barrierefreie Alternative zur Mindmap: reine Listen mit aufklappbaren Details. */
export function ListView({ emotions, entries }: Props) {
  const { t } = useTranslation();
  const { lang } = useLang();
  return (
    <section aria-label={t('map.listHint')} className="space-y-3" data-testid="list-view">
      {emotions.map((em) => {
        const list = entries.filter((e) => e.emotionIds.includes(em.id));
        const Icon = emotionIcon(em.icon);
        return (
          <details key={em.id} className="rounded-2xl border border-line bg-card">
            <summary className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl px-4 py-2 font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-full" style={{ background: em.color, color: readableOn(em.color) }}>
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              {em.name[lang]}
              <span className="ms-auto text-sm font-normal text-muted">{t('map.entries', { count: list.length })}</span>
            </summary>
            <ul className="space-y-2 p-4 pt-0">
              {list.length === 0 && <li className="text-sm text-muted">{t('map.noEntries')}</li>}
              {list.map((e) => (
                <li key={e.id}>
                  <details className="rounded-xl border border-line">
                    <summary className="min-h-11 cursor-pointer px-3 py-2 text-sm">
                      <span className="font-semibold text-gold">{t(`entry.types.${e.type}`)} · {entryTitle(e, lang)}</span>
                    </summary>
                    <div className="p-3"><EntryCard entry={e} emotions={emotions} accent={em.color} /></div>
                  </details>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </section>
  );
}
