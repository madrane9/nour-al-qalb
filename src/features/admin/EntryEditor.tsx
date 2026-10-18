import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { entryFormSchema, type EntryForm } from '@/lib/schemas';
import { createSource, listSources, saveEntry, type SourceRow } from '@/services/admin';
import { useContent } from '@/state/ContentContext';
import { useLang } from '@/hooks/useLang';
import type { Entry, EntryType } from '@/types';

type Draft = Record<string, unknown>;

function toDraft(type: EntryType, e?: Entry): Draft {
  const tr = (lang: string, kind: string) => e?.translations.find((x) => x.lang === lang && x.kind === kind);
  const k = type === 'reflection' ? 'reflection' : 'translation';
  return {
    type,
    arabic: e?.arabic ?? '',
    surahNumber: e?.surah?.number ?? '',
    surahNameAr: e?.surah?.nameAr ?? '',
    surahNameEn: e?.surah?.nameEn ?? '',
    ayahNumber: e?.ayah ?? '',
    sourceId: '',
    sourceReference: e?.sourceReference ?? '',
    sourceUrl: e?.sourceUrl ?? '',
    grade: e?.grade ?? '',
    gradeSource: e?.gradeSource ?? '',
    audioUrl: e?.audioUrl ?? '',
    audioSource: e?.audioSource ?? '',
    status: e?.status ?? 'draft',
    sourceVerified: e?.sourceVerified ?? false,
    emotionIds: e?.emotionIds ?? [],
    de: tr('de', k)?.body ?? '',
    deSource: tr('de', k)?.sourceName ?? '',
    en: tr('en', k)?.body ?? '',
    enSource: tr('en', k)?.sourceName ?? '',
    ar: tr('ar', type === 'reflection' ? 'reflection' : 'explanation')?.body ?? '',
  };
}

function Field({ label, children, error }: { k: string; label: string; children: ReactNode; error: ReactNode }) {
  return <label className="block text-sm font-medium">{label}{children}{error}</label>;
}

const num = (v: unknown) => (v === '' || v == null ? null : Number(v));

export function EntryEditor() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const navigate = useNavigate();
  const { id, type: typeParam } = useParams();
  const { entries, emotions, reload } = useContent();
  const existing = entries.find((e) => e.id === id);
  const type = (existing?.type ?? typeParam ?? 'quran') as EntryType;

  const [d, setD] = useState<Draft>(() => toDraft(type, existing));
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [newSource, setNewSource] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void listSources().then(setSources).catch(() => setSources([]));
  }, []);
  useEffect(() => {
    if (existing) setD(toDraft(existing.type, existing));
  }, [existing]);
  // Quelle des bestehenden Eintrags nach dem Laden zuordnen
  useEffect(() => {
    if (existing?.sourceName && sources.length) {
      const s = sources.find((x) => x.name === existing.sourceName);
      if (s) setD((p) => (p.sourceId ? p : { ...p, sourceId: s.id }));
    }
  }, [existing, sources]);

  const set = (k: string, v: unknown) => setD((p) => ({ ...p, [k]: v }));
  const text = (k: string) => String(d[k] ?? '');
  const ids = (d.emotionIds as string[]) ?? [];
  const err = (k: string) => (errors[k] ? <p className="text-xs text-gold" role="alert">{t(errors[k] === 'emotionRequired' || errors[k] === 'verifyRequired' ? `admin.form.${errors[k]}` : 'admin.form.required')}</p> : null);

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setMsg('');
    const parsed = entryFormSchema.safeParse({
      ...d,
      surahNumber: num(d.surahNumber),
      ayahNumber: num(d.ayahNumber),
      sourceId: d.sourceId || null,
    });
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const i of parsed.error.issues) map[String(i.path[0])] = i.message;
      setErrors(map);
      setMsg(t('admin.form.invalid'));
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const form: EntryForm = parsed.data;
      if (newSource.trim() && !form.sourceId) {
        const s = await createSource(newSource.trim(), form.type === 'hadith' ? 'hadith' : form.type === 'quran' ? 'quran' : 'other', '');
        form.sourceId = s.id;
      }
      await saveEntry(form, existing?.id);
      await reload();
      setMsg(t('admin.saved'));
      navigate('/admin/entries');
    } catch (e) {
      setMsg(t('admin.error', { message: (e as Error).message }));
    } finally {
      setBusy(false);
    }
  };

  const input = 'min-h-11 w-full rounded-xl border border-line bg-card px-3';
  const status = text('status');
  const isRef = type === 'reflection';

  return (
    <form onSubmit={(e) => void submit(e)} className="max-w-3xl space-y-5" noValidate>
      <h2 className="text-2xl font-bold">{t(`entry.types.${type}`)}</h2>

      {!isRef && (
        <Field error={err('arabic')} k="arabic" label={t('admin.form.arabic')}>
          <textarea className={`${input} font-arabic text-xl`} dir="rtl" lang="ar" rows={4} value={text('arabic')} onChange={(e) => set('arabic', e.target.value)} />
        </Field>
      )}

      {type === 'quran' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field error={err('surahNumber')} k="surahNumber" label={t('admin.form.surahNumber')}><input className={input} type="number" min={1} max={114} value={text('surahNumber')} onChange={(e) => set('surahNumber', e.target.value)} /></Field>
          <Field error={err('ayahNumber')} k="ayahNumber" label={t('admin.form.ayahNumber')}><input className={input} type="number" min={1} value={text('ayahNumber')} onChange={(e) => set('ayahNumber', e.target.value)} /></Field>
          <Field error={err('surahNameAr')} k="surahNameAr" label={t('admin.form.surahNameAr')}><input className={input} dir="rtl" value={text('surahNameAr')} onChange={(e) => set('surahNameAr', e.target.value)} /></Field>
          <Field error={err('surahNameEn')} k="surahNameEn" label={t('admin.form.surahNameEn')}><input className={input} value={text('surahNameEn')} onChange={(e) => set('surahNameEn', e.target.value)} /></Field>
        </div>
      )}

      {!isRef && (
        <fieldset className="space-y-3 rounded-2xl border border-line p-4">
          <legend className="px-2 text-sm font-semibold">{t('admin.form.source')}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field error={err('sourceId')} k="sourceId" label={t('admin.form.source')}>
              <select className={input} value={text('sourceId')} onChange={(e) => set('sourceId', e.target.value)}>
                <option value="">—</option>
                {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field error={err('newSource')} k="newSource" label={t('admin.form.sourceNewName')}><input className={input} value={newSource} onChange={(e) => setNewSource(e.target.value)} /></Field>
            <Field error={err('sourceReference')} k="sourceReference" label={t('admin.form.sourceReference')}><input className={input} value={text('sourceReference')} onChange={(e) => set('sourceReference', e.target.value)} /></Field>
            <Field error={err('sourceUrl')} k="sourceUrl" label={t('admin.form.sourceUrl')}><input className={input} type="url" inputMode="url" value={text('sourceUrl')} onChange={(e) => set('sourceUrl', e.target.value)} /></Field>
          </div>
          {type === 'hadith' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field error={err('grade')} k="grade" label={t('admin.form.grade')}><input className={input} value={text('grade')} onChange={(e) => set('grade', e.target.value)} /></Field>
              <Field error={err('gradeSource')} k="gradeSource" label={t('admin.form.gradeSource')}><input className={input} value={text('gradeSource')} onChange={(e) => set('gradeSource', e.target.value)} /></Field>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field error={err('audioUrl')} k="audioUrl" label={t('admin.form.audioUrl')}><input className={input} type="url" value={text('audioUrl')} onChange={(e) => set('audioUrl', e.target.value)} /></Field>
            <Field error={err('audioSource')} k="audioSource" label={t('admin.form.audioSource')}><input className={input} value={text('audioSource')} onChange={(e) => set('audioSource', e.target.value)} /></Field>
          </div>
        </fieldset>
      )}

      <fieldset className="space-y-3 rounded-2xl border border-line p-4">
        <legend className="px-2 text-sm font-semibold">{t('admin.form.emotions')}</legend>
        <div className="flex flex-wrap gap-2">
          {emotions.map((em) => (
            <label key={em.id} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line px-3 text-sm">
              <input type="checkbox" checked={ids.includes(em.id)} onChange={(e) => set('emotionIds', e.target.checked ? [...ids, em.id] : ids.filter((x) => x !== em.id))} />
              <span aria-hidden className="h-3 w-3 rounded-full" style={{ background: em.color }} />
              {em.name[lang]}
            </label>
          ))}
        </div>
        {err('emotionIds')}
      </fieldset>

      <div className="grid gap-4">
        <Field error={err('de')} k="de" label={isRef ? `${t('admin.form.reflection')} (de)` : t('admin.form.de')}><textarea className={input} rows={3} value={text('de')} onChange={(e) => set('de', e.target.value)} /></Field>
        {!isRef && <Field error={err('deSource')} k="deSource" label={t('admin.form.deSource')}><input className={input} value={text('deSource')} onChange={(e) => set('deSource', e.target.value)} /></Field>}
        <Field error={err('en')} k="en" label={isRef ? `${t('admin.form.reflection')} (en)` : t('admin.form.en')}><textarea className={input} rows={3} value={text('en')} onChange={(e) => set('en', e.target.value)} /></Field>
        {!isRef && <Field error={err('enSource')} k="enSource" label={t('admin.form.enSource')}><input className={input} value={text('enSource')} onChange={(e) => set('enSource', e.target.value)} /></Field>}
        <Field error={err('ar')} k="ar" label={isRef ? `${t('admin.form.reflection')} (Darija)` : t('admin.form.ar')}><textarea className={`${input} font-arabic text-lg`} dir="rtl" lang="ar-MA" rows={3} value={text('ar')} onChange={(e) => set('ar', e.target.value)} /></Field>
      </div>

      <fieldset className="space-y-3 rounded-2xl border border-gold/60 p-4">
        <legend className="px-2 text-sm font-semibold">{t('admin.form.status')}</legend>
        {!isRef && (
          <>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-1 h-5 w-5" checked={Boolean(d.sourceVerified)} onChange={(e) => set('sourceVerified', e.target.checked)} />
              <span>{t('admin.form.verified')}<br /><span className="text-xs text-muted">{t('admin.form.verifiedHelp')}</span></span>
            </label>
            {err('sourceVerified')}
          </>
        )}
        <select className={input} aria-label={t('admin.form.status')} value={status} onChange={(e) => set('status', e.target.value)}>
          {(['draft', 'published', 'archived'] as const).map((s) => <option key={s} value={s}>{t(`admin.status.${s}`)}</option>)}
        </select>
      </fieldset>

      <p role="status" className="min-h-5 text-sm text-gold">{msg}</p>
      <button disabled={busy} type="submit" className="min-h-11 rounded-full bg-gold px-8 font-semibold text-ivory disabled:opacity-60">{t('admin.form.save')}</button>
    </form>
  );
}
