import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, ExternalLink, Heart, Image as ImageIcon, Share2 } from 'lucide-react';
import type { Emotion, Entry } from '@/types';
import { useLang } from '@/hooks/useLang';
import { entryTitle, getText, shareText } from '@/lib/entries';
import { emotionIcon, readableOn } from '@/lib/icons';
import { downloadBlob, renderShareCard } from '@/lib/shareCard';
import { useFavorites } from '@/state/FavoritesContext';

interface Props {
  entry: Entry;
  emotions: Emotion[];
  /** Name der Emotionsfarbe für die Akzentlinie */
  accent?: string;
}

const isHttps = (u: string | null): u is string => Boolean(u && u.startsWith('https://'));

export function EntryCard({ entry, emotions, accent }: Props) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const { isFavorite, toggle } = useFavorites();
  const [message, setMessage] = useState('');
  const fav = isFavorite(entry.id);

  const translation = lang === 'ar' ? null : getText(entry, lang, 'translation');
  const explanation = getText(entry, 'ar', 'explanation');
  const reflection = getText(entry, lang, 'reflection') ?? getText(entry, 'de', 'reflection') ?? getText(entry, 'en', 'reflection');
  const tags = entry.emotionIds.map((id) => emotions.find((e) => e.id === id)).filter((e): e is Emotion => Boolean(e));

  const say = (m: string) => {
    setMessage(m);
    window.setTimeout(() => setMessage(''), 3500);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText(entry, lang));
      say(t('actions.copied'));
    } catch {
      say(t('actions.shareFailed'));
    }
  };

  const share = async () => {
    const text = shareText(entry, lang);
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: entryTitle(entry, lang), text });
        return;
      } catch (e) {
        if ((e as DOMException).name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignorieren */
    }
    say(t('actions.shareFailed'));
  };

  const image = async () => {
    try {
      const dark = document.documentElement.dataset.theme === 'dark';
      downloadBlob(await renderShareCard(entry, lang, dark), `nour-al-qalb-${entry.id.slice(0, 8)}.png`);
    } catch {
      say(t('actions.imageFailed'));
    }
  };

  const btn =
    'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-line px-4 text-sm font-medium transition hover:bg-line/40';

  return (
    <article
      className="relative overflow-hidden rounded-xl2 border border-line bg-card p-6 shadow-soft sm:p-8"
      aria-label={entryTitle(entry, lang)}
      data-testid="entry-card"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: accent ?? 'rgb(var(--c-gold))' }} />
      <header className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-line/50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
          {t(`entry.types.${entry.type}`)}
        </span>
        <span className="text-sm font-medium text-gold">{entryTitle(entry, lang)}</span>
      </header>

      {entry.arabic && (
        <p lang="ar" dir="rtl" className="mb-6 text-center font-arabic text-3xl leading-[2.2] sm:text-4xl" data-testid="entry-arabic">
          {entry.arabic}
        </p>
      )}

      {entry.type === 'quran' && entry.surah && (
        <p className="mb-4 text-center text-sm text-muted">
          {t('entry.surah')} {lang === 'ar' ? entry.surah.nameAr : entry.surah.nameEn} ({entry.surah.number}) · {t('entry.ayah')} {entry.ayah}
        </p>
      )}

      {translation && (
        <section className="mb-5" aria-label={t('entry.translation')}>
          <p className="text-lg leading-relaxed" lang={lang}>{translation.body}</p>
          {translation.sourceName && (
            <p className="mt-1 text-xs text-muted">{t('entry.translationBy', { name: translation.sourceName })}</p>
          )}
        </section>
      )}
      {lang !== 'ar' && entry.type !== 'reflection' && !translation && (
        <p className="mb-5 text-sm italic text-muted">{t('entry.noTranslation')}</p>
      )}

      {entry.type === 'reflection' && reflection && (
        <section className="mb-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gold">{t('entry.reflectionLabel')}</p>
          <p className="text-lg leading-relaxed" lang={reflection.lang === 'ar' ? 'ar-MA' : reflection.lang} dir={reflection.lang === 'ar' ? 'rtl' : 'ltr'}>
            {reflection.body}
          </p>
          <p className="mt-1 text-xs text-muted">{t('entry.reflectionNote')}</p>
        </section>
      )}

      {explanation && entry.type !== 'reflection' && (
        <section className="mb-5 rounded-2xl border border-dashed border-line bg-ivory/60 p-4" aria-label={t('entry.explanationDarija')}>
          <p className="mb-1 text-xs font-semibold text-gold">{t('entry.explanationDarija')}</p>
          <p lang="ar-MA" dir="rtl" className="font-arabic text-xl leading-loose">{explanation.body}</p>
          <p className="mt-1 text-xs text-muted">{t('entry.explanationNote')}</p>
        </section>
      )}

      {entry.type === 'hadith' && (
        <dl className="mb-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {entry.sourceName && (<><dt className="text-muted">{t('entry.collection')}</dt><dd>{entry.sourceName}</dd></>)}
          {entry.sourceReference && (<><dt className="text-muted">{t('entry.number')}</dt><dd>{entry.sourceReference}</dd></>)}
          {entry.grade && (<><dt className="text-muted">{t('entry.grade')}</dt><dd>{entry.grade}</dd></>)}
          {entry.gradeSource && (<><dt className="text-muted">{t('entry.gradeSource')}</dt><dd>{entry.gradeSource}</dd></>)}
        </dl>
      )}

      {isHttps(entry.audioUrl) && (
        <div className="mb-5">
          <p className="mb-1 text-xs font-semibold text-muted">{t('entry.audio')}</p>
          <audio controls preload="none" src={entry.audioUrl} className="w-full" />
          {entry.audioSource && <p className="mt-1 text-xs text-muted">{t('entry.audioBy', { name: entry.audioSource })}</p>}
        </div>
      )}

      {tags.length > 0 && (
        <ul className="mb-5 flex flex-wrap gap-2" aria-label={t('search.emotion')}>
          {tags.map((e) => {
            const Icon = emotionIcon(e.icon);
            return (
              <li key={e.id} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium" style={{ background: e.color, color: readableOn(e.color) }}>
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {e.name[lang]}
              </li>
            );
          })}
        </ul>
      )}

      <footer className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <button type="button" className={btn} aria-pressed={fav} onClick={() => void toggle(entry.id)} aria-label={fav ? t('actions.unfavorite') : t('actions.favorite')}>
          <Heart className="h-4 w-4" fill={fav ? 'currentColor' : 'none'} aria-hidden />
        </button>
        <button type="button" className={btn} onClick={() => void share()}>
          <Share2 className="h-4 w-4" aria-hidden /> {t('actions.share')}
        </button>
        <button type="button" className={btn} onClick={() => void copy()}>
          <Copy className="h-4 w-4" aria-hidden /> {t('actions.copy')}
        </button>
        <button type="button" className={btn} onClick={() => void image()}>
          <ImageIcon className="h-4 w-4" aria-hidden /> {t('actions.image')}
        </button>
        {isHttps(entry.sourceUrl) && (
          <a className={`${btn} ms-auto`} href={entry.sourceUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" aria-hidden /> {t('entry.openSource')}
          </a>
        )}
      </footer>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-gold">{message}</p>
    </article>
  );
}
