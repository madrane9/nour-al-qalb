import type { Emotion } from '@/types';
import { useLang } from '@/hooks/useLang';
import { emotionIcon, readableOn } from '@/lib/icons';

interface Props {
  emotion: Emotion;
  active?: boolean;
  count?: number;
  onClick: () => void;
}

/** Farbe + Symbol + Name: Bedeutung hängt nie allein an der Farbe. */
export function EmotionButton({ emotion, active, count, onClick }: Props) {
  const { lang } = useLang();
  const Icon = emotionIcon(emotion.icon);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-testid={`emotion-${emotion.slug}`}
      className={`group flex min-h-12 items-center gap-2 rounded-full border-2 px-4 py-2 text-start text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft ${
        active ? 'border-gold' : 'border-transparent'
      }`}
      style={{ background: emotion.color, color: readableOn(emotion.color) }}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span>{emotion.name[lang]}</span>
      {count !== undefined && <span className="ms-auto rounded-full bg-black/10 px-2 text-xs">{count}</span>}
    </button>
  );
}
