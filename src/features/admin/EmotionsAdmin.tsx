import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { emotionFormSchema, type EmotionForm } from '@/lib/schemas';
import { EMOTION_ICONS, emotionIcon, readableOn } from '@/lib/icons';
import { saveEmotion } from '@/services/admin';
import { useContent } from '@/state/ContentContext';
import { useLang } from '@/hooks/useLang';
import type { Emotion } from '@/types';

const empty: EmotionForm = { slug: '', nameAr: '', nameDe: '', nameEn: '', color: '#A8E0C5', icon: 'sparkles', archived: false };

export function EmotionsAdmin() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const { emotions, reload } = useContent();
  const [editing, setEditing] = useState<Emotion | null>(null);
  const [form, setForm] = useState<EmotionForm>(empty);
  const [msg, setMsg] = useState('');

  const edit = (e: Emotion | null) => {
    setEditing(e);
    setForm(e ? { slug: e.slug, nameAr: e.name.ar, nameDe: e.name.de, nameEn: e.name.en, color: e.color, icon: e.icon, archived: e.archived } : empty);
    setMsg('');
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const parsed = emotionFormSchema.safeParse(form);
    if (!parsed.success) {
      setMsg(t('admin.form.invalid'));
      return;
    }
    try {
      await saveEmotion(parsed.data, editing?.id);
      await reload();
      edit(null);
      setMsg(t('admin.saved'));
    } catch (e) {
      setMsg(t('admin.error', { message: (e as Error).message }));
    }
  };

  const input = 'min-h-11 w-full rounded-xl border border-line bg-card px-3';
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <ul className="space-y-2">
        {emotions.map((e) => {
          const Icon = emotionIcon(e.icon);
          return (
            <li key={e.id} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3">
              <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: e.color, color: readableOn(e.color) }}><Icon className="h-5 w-5" aria-hidden /></span>
              <span className="flex-1 font-semibold">{e.name[lang]}{e.archived && <span className="ms-2 text-xs text-muted">({t('admin.status.archived')})</span>}</span>
              <button type="button" onClick={() => edit(e)} className="min-h-9 rounded-full border border-line px-3 text-xs font-semibold hover:bg-line/40">{t('admin.edit')}</button>
            </li>
          );
        })}
      </ul>

      <form onSubmit={(e) => void submit(e)} className="space-y-3 rounded-2xl border border-line bg-card p-4" noValidate>
        <h2 className="text-lg font-bold">{editing ? editing.name[lang] : t('admin.emotion.new')}</h2>
        <label className="block text-sm font-medium">{t('admin.emotion.slug')}<input className={input} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></label>
        <label className="block text-sm font-medium">{t('admin.emotion.nameAr')}<input className={input} dir="rtl" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} /></label>
        <label className="block text-sm font-medium">{t('admin.emotion.nameDe')}<input className={input} value={form.nameDe} onChange={(e) => setForm({ ...form, nameDe: e.target.value })} /></label>
        <label className="block text-sm font-medium">{t('admin.emotion.nameEn')}<input className={input} value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} /></label>
        <div className="flex gap-4">
          <label className="block text-sm font-medium">{t('admin.emotion.color')}<input className="block h-11 w-20 rounded-xl border border-line" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value.toUpperCase() })} /></label>
          <label className="block flex-1 text-sm font-medium">{t('admin.emotion.icon')}
            <select className={input} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
              {Object.keys(EMOTION_ICONS).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5" checked={form.archived} onChange={(e) => setForm({ ...form, archived: e.target.checked })} />{t('admin.emotion.archived')}</label>
        <p role="status" className="min-h-5 text-sm text-gold">{msg}</p>
        <div className="flex gap-2">
          <button type="submit" className="min-h-11 rounded-full bg-gold px-6 font-semibold text-ivory">{editing ? t('admin.emotion.save') : t('admin.emotion.add')}</button>
          {editing && <button type="button" onClick={() => edit(null)} className="min-h-11 rounded-full border border-line px-6">{t('map.close')}</button>}
        </div>
      </form>
    </div>
  );
}
