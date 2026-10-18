import type { Entry, Lang } from '@/types';
import { entryTitle, getText } from './entries';

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** Erzeugt eine PNG-Bildkarte (1080x1350) zum Speichern/Teilen. */
export async function renderShareCard(entry: Entry, lang: Lang, dark = false): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas-unavailable');
  try {
    await document.fonts.load('48px Amiri');
    await document.fonts.load('28px "Inter Variable"');
  } catch {
    /* Systemschrift als Rückfall */
  }

  const bg = dark ? '#0E1628' : '#FAF5E9';
  const ink = dark ? '#F0E8D6' : '#2B261E';
  const gold = dark ? '#D6B260' : '#8A681E';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, W - 96, H - 96);
  ctx.globalAlpha = 0.5;
  ctx.strokeRect(64, 64, W - 128, H - 128);
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center';
  ctx.fillStyle = gold;
  ctx.font = '700 64px Amiri, serif';
  ctx.direction = 'rtl';
  ctx.fillText('نور القلب', W / 2, 170);

  let y = 300;
  ctx.fillStyle = ink;
  if (entry.arabic) {
    ctx.font = '56px Amiri, serif';
    ctx.direction = 'rtl';
    for (const l of wrap(ctx, entry.arabic, W - 240).slice(0, 8)) {
      ctx.fillText(l, W / 2, y);
      y += 100;
    }
  }
  const tr = getText(entry, lang === 'ar' ? 'en' : lang, 'translation') ?? getText(entry, lang, 'reflection');
  if (tr) {
    y += 30;
    ctx.direction = 'ltr';
    ctx.font = '30px "Inter Variable", system-ui, sans-serif';
    for (const l of wrap(ctx, tr.body, W - 260).slice(0, 8)) {
      ctx.fillText(l, W / 2, y);
      y += 46;
    }
  }
  ctx.fillStyle = gold;
  ctx.direction = 'ltr';
  ctx.font = '600 30px "Inter Variable", system-ui, sans-serif';
  ctx.fillText(entryTitle(entry, 'en'), W / 2, H - 150);

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png'),
  );
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
