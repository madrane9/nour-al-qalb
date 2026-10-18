import { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Emotion } from '@/types';

interface Props {
  emotions: Emotion[];
  /** Anzahl Zettel je Gefühl (bestimmt die Füllung) */
  counts: Record<string, number>;
  shaking: boolean;
  /** Farbe des gerade gezogenen Zettels */
  pulledColor: string | null;
  onSlipClick: (emotionId: string) => void;
}

interface Slip {
  key: string;
  emotionId: string;
  color: string;
  x: number;
  y: number;
  rot: number;
  w: number;
  h: number;
}

/** Deterministischer Pseudozufall, damit das Glas bei jedem Rendern gleich aussieht. */
function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function HopeJar({ emotions, counts, shaking, pulledColor, onSlipClick }: Props) {
  const reduce = useReducedMotion();

  const slips = useMemo<Slip[]>(() => {
    if (emotions.length === 0) return [];
    const rnd = mulberry(7);
    const out: Slip[] = [];
    const total = 44;
    for (let i = 0; i < total; i++) {
      const em = emotions[i % emotions.length]!;
      if ((counts[em.id] ?? 0) === 0) continue;
      const row = Math.floor(i / 6);
      out.push({
        key: `${em.id}-${i}`,
        emotionId: em.id,
        color: em.color,
        x: 70 + (i % 6) * 26 + rnd() * 10,
        y: 330 - row * 24 + rnd() * 8,
        rot: -40 + rnd() * 80,
        w: 34 + rnd() * 12,
        h: 18 + rnd() * 6,
      });
    }
    return out;
  }, [emotions, counts]);

  return (
    <div className="relative mx-auto w-full max-w-[340px]" aria-hidden="false">
      <motion.svg
        viewBox="0 0 300 400"
        role="img"
        aria-label="Hope jar"
        className="h-auto w-full drop-shadow-xl"
        animate={shaking && !reduce ? { rotate: [0, -3, 3, -2, 2, 0], y: [0, -4, 0] } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ transformOrigin: '50% 90%' }}
      >
        <defs>
          <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="0.25" stopColor="#fff" stopOpacity="0.08" />
            <stop offset="0.8" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.4" />
          </linearGradient>
          <clipPath id="jarBody">
            <path d="M62 120 Q40 140 40 190 L40 340 Q40 372 76 372 L224 372 Q260 372 260 340 L260 190 Q260 140 238 120 Z" />
          </clipPath>
        </defs>

        {/* Zettel (dekorativ; Bedienung über die Gefühlsauswahl) */}
        <g clipPath="url(#jarBody)">
          {slips.map((s) => (
            <g
              key={s.key}
              transform={`translate(${s.x} ${s.y}) rotate(${s.rot})`}
              onClick={() => onSlipClick(s.emotionId)}
              style={{ cursor: 'pointer' }}
            >
              <rect width={s.w} height={s.h} rx="3" fill={s.color} stroke="rgb(0 0 0 / 0.18)" strokeWidth="0.8" />
              <path d={`M0 0 L${s.w / 2} ${s.h / 2} L${s.w} 0`} fill="rgb(255 255 255 / 0.35)" />
              <line x1={s.w / 2} y1={s.h / 2} x2={s.w / 2} y2={s.h} stroke="rgb(0 0 0 / 0.12)" strokeWidth="0.8" />
            </g>
          ))}
        </g>

        {/* Glas */}
        <path
          d="M62 120 Q40 140 40 190 L40 340 Q40 372 76 372 L224 372 Q260 372 260 340 L260 190 Q260 140 238 120 Z"
          fill="url(#glass)"
          stroke="rgb(var(--c-ink) / 0.45)"
          strokeWidth="2.5"
        />
        <path d="M58 170 L58 330" stroke="#fff" strokeOpacity="0.7" strokeWidth="5" strokeLinecap="round" />
        {/* Hals + Deckel */}
        <rect x="76" y="100" width="148" height="24" rx="6" fill="url(#glass)" stroke="rgb(var(--c-ink) / 0.45)" strokeWidth="2.5" />
        <rect x="70" y="62" width="160" height="40" rx="12" fill="rgb(var(--c-gold))" stroke="rgb(var(--c-ink) / 0.35)" strokeWidth="2" />
        <path d="M95 82h110" stroke="#fff" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 8" />
        <circle cx="150" cy="44" r="14" fill="rgb(var(--c-gold))" stroke="rgb(var(--c-ink) / 0.35)" strokeWidth="2" />
      </motion.svg>

      {pulledColor && !reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[20%] h-10 w-16 -translate-x-1/2 rounded-md border border-black/20 shadow-lg"
          style={{ background: pulledColor }}
          initial={{ y: 80, scale: 0.6, rotate: -20, opacity: 0 }}
          animate={{ y: -60, scale: 1.4, rotate: 0, opacity: [0, 1, 1] }}
          transition={{ duration: 0.85, ease: 'easeOut' }}
        />
      )}
    </div>
  );
}
