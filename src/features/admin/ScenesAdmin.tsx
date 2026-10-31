import { useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { sceneFormSchema, type SceneForm } from '@/lib/schemas';
import { deleteScene, deleteSceneImage, saveScene, updateSceneImageAlt, uploadSceneImage } from '@/services/admin';
import { useContent } from '@/state/ContentContext';
import { useLang } from '@/hooks/useLang';
import { entryTitle } from '@/lib/entries';
import { pickSceneImage } from '@/lib/scenes';
import { SCENE_LANGS, type Scene, type SceneLang } from '@/types';

const empty: SceneForm = { entryId: '', status: 'draft', sortOrder: 0 };

/** Pro Sprache: ausgewählte neue Datei und Bildbeschreibung. */
type ImageDraft = Record<SceneLang, { file: File | null; alt: string }>;
const emptyImages = (): ImageDraft => ({
  ar: { file: null, alt: '' },
  de: { file: null, alt: '' },
  en: { file: null, alt: '' },
  fr: { file: null, alt: '' },
});

export function ScenesAdmin() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const { scenes, entries, reload } = useContent();
  const [editing, setEditing] = useState<Scene | null>(null);
  const [form, setForm] = useState<SceneForm>(empty);
  const [images, setImages] = useState<ImageDraft>(emptyImages);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // Nur Koranverse und Hadithe als Antwort anbieten (keine eigenen Reflexionen).
  const answerOptions = useMemo(() => entries.filter((e) => e.type !== 'reflection'), [entries]);

  const edit = (s: Scene | null) => {
    setEditing(s);
    setForm(s ? { entryId: s.entryId, status: s.status, sortOrder: s.sortOrder } : empty);
    const draft = emptyImages();
    s?.images.forEach((i) => (draft[i.lang] = { file: null, alt: i.alt }));
    setImages(draft);
    setMsg('');
  };

  const errorText = (e: unknown) => {
    const m = (e as Error).message;
    if (m === 'image-type') return t('admin.scene.imageType');
    if (m === 'image-size') return t('admin.scene.imageSize');
    return t('admin.error', { message: m });
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const parsed = sceneFormSchema.safeParse(form);
    if (!parsed.success) return setMsg(t('admin.form.invalid'));

    // Veröffentlichen nur mit mindestens einem Bild (vorhanden oder neu gewählt).
    const hasImage = SCENE_LANGS.some((l) => images[l].file || editing?.images.some((i) => i.lang === l));
    if (parsed.data.status === 'published' && !hasImage) return setMsg(t('admin.scene.needImage'));
    // Zu jedem neuen Bild gehört eine Beschreibung (Barrierefreiheit).
    if (SCENE_LANGS.some((l) => images[l].file && !images[l].alt.trim())) return setMsg(t('admin.scene.needAlt'));

    setBusy(true);
    try {
      const id = await saveScene(parsed.data, editing?.id);
      for (const l of SCENE_LANGS) {
        const draft = images[l];
        const old = editing?.images.find((i) => i.lang === l);
        if (draft.file) await uploadSceneImage(id, l, draft.file, draft.alt.trim(), old?.path);
        else if (old && draft.alt.trim() && draft.alt.trim() !== old.alt) await updateSceneImageAlt(id, l, draft.alt.trim());
      }
      await reload();
      edit(null);
      setMsg(t('admin.saved'));
    } catch (e) {
      setMsg(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const removeImage = async (l: SceneLang) => {
    const old = editing?.images.find((i) => i.lang === l);
    if (!editing || !old) return;
    try {
      await deleteSceneImage(editing.id, l, old.path);
      await reload();
      setEditing({ ...editing, images: editing.images.filter((i) => i.lang !== l) });
      setImages({ ...images, [l]: { file: null, alt: '' } });
    } catch (e) {
      setMsg(errorText(e));
    }
  };

  const remove = async (s: Scene) => {
    if (!window.confirm(t('admin.scene.confirmDelete'))) return;
    try {
      await deleteScene(s.id, s.images.map((i) => i.path));
      await reload();
      if (editing?.id === s.id) edit(null);
    } catch (e) {
      setMsg(errorText(e));
    }
  };

  const input = 'min-h-11 w-full rounded-xl border border-line bg-card px-3';
  const small = 'min-h-9 rounded-full border border-line px-3 text-xs font-semibold hover:bg-line/40';

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <ul className="space-y-2" data-testid="scenes-admin-list">
        {scenes.length === 0 && <li className="text-muted">{t('admin.scene.none')}</li>}
        {scenes.map((s) => {
          const img = pickSceneImage(s, lang);
          const entry = entries.find((e) => e.id === s.entryId);
          return (
            <li key={s.id} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3">
              {img ? <img src={img.url} alt="" className="h-14 w-14 rounded-lg object-cover" /> : <span className="h-14 w-14 rounded-lg bg-line/50" />}
              <span className="flex-1 text-sm">
                <span className="block font-semibold">{entry ? entryTitle(entry, lang) : '–'}</span>
                <span className="text-xs text-muted">
                  {t(`admin.status.${s.status}`)} · {s.images.map((i) => i.lang.toUpperCase()).join(', ') || t('admin.scene.noImages')}
                </span>
              </span>
              <button type="button" onClick={() => edit(s)} className={small}>{t('admin.edit')}</button>
              <button type="button" onClick={() => void remove(s)} className={small}>{t('admin.delete')}</button>
            </li>
          );
        })}
      </ul>

      <form onSubmit={(e) => void submit(e)} className="space-y-4 rounded-2xl border border-line bg-card p-4" noValidate>
        <h2 className="text-lg font-bold">{editing ? t('admin.scene.edit') : t('admin.scene.new')}</h2>

        <label className="block text-sm font-medium">{t('admin.scene.answer')}
          <select className={input} value={form.entryId} onChange={(e) => setForm({ ...form, entryId: e.target.value })}>
            <option value="">{t('admin.scene.chooseAnswer')}</option>
            {answerOptions.map((e) => (
              <option key={e.id} value={e.id}>{entryTitle(e, lang)}{e.status !== 'published' ? ` (${t(`admin.status.${e.status}`)})` : ''}</option>
            ))}
          </select>
        </label>

        <div className="flex gap-4">
          <label className="block flex-1 text-sm font-medium">{t('admin.form.status')}
            <select className={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as SceneForm['status'] })}>
              {(['draft', 'published', 'archived'] as const).map((s) => <option key={s} value={s}>{t(`admin.status.${s}`)}</option>)}
            </select>
          </label>
          <label className="block w-28 text-sm font-medium">{t('admin.scene.order')}
            <input className={input} type="number" min={0} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })} />
          </label>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">{t('admin.scene.images')}</legend>
          <p className="text-xs text-muted">{t('admin.scene.imagesHelp')}</p>
          {SCENE_LANGS.map((l) => {
            const current = editing?.images.find((i) => i.lang === l);
            return (
              <div key={l} className="rounded-xl border border-line p-3">
                <div className="mb-2 flex items-center gap-3">
                  <span className="w-8 font-bold">{l.toUpperCase()}</span>
                  {current && <img src={current.url} alt="" className="h-12 w-12 rounded object-cover" />}
                  <input
                    type="file"
                    accept="image/webp,image/png,image/jpeg"
                    aria-label={t('admin.scene.file', { lang: l.toUpperCase() })}
                    className="flex-1 text-sm"
                    onChange={(e) => setImages({ ...images, [l]: { ...images[l], file: e.target.files?.[0] ?? null } })}
                  />
                  {current && <button type="button" onClick={() => void removeImage(l)} className={small}>{t('admin.delete')}</button>}
                </div>
                <label className="block text-xs font-medium">{t('admin.scene.alt')}
                  <input
                    className={input}
                    dir={l === 'ar' ? 'rtl' : 'ltr'}
                    lang={l}
                    value={images[l].alt}
                    onChange={(e) => setImages({ ...images, [l]: { ...images[l], alt: e.target.value } })}
                  />
                </label>
              </div>
            );
          })}
        </fieldset>

        <p role="status" className="min-h-5 text-sm text-gold">{msg}</p>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="min-h-11 rounded-full bg-gold px-6 font-semibold text-ivory disabled:opacity-60">
            {busy ? t('home.loading') : t('admin.form.save')}
          </button>
          {editing && <button type="button" onClick={() => edit(null)} className="min-h-11 rounded-full border border-line px-6">{t('map.close')}</button>}
        </div>
      </form>
    </div>
  );
}
