import {
  BatteryLow,
  Circle,
  CloudRain,
  Compass,
  Flame,
  Heart,
  Hourglass,
  Leaf,
  Moon,
  Shield,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Wind,
  type LucideIcon,
} from 'lucide-react';

/** Erlaubte Symbole für Emotionen (im Adminbereich wählbar). */
export const EMOTION_ICONS: Record<string, LucideIcon> = {
  'cloud-rain': CloudRain,
  shield: Shield,
  flame: Flame,
  moon: Moon,
  wind: Wind,
  sunrise: Sunrise,
  hourglass: Hourglass,
  sun: Sun,
  heart: Heart,
  leaf: Leaf,
  compass: Compass,
  'battery-low': BatteryLow,
  star: Star,
  sparkles: Sparkles,
};

export function emotionIcon(name: string): LucideIcon {
  return EMOTION_ICONS[name] ?? Circle;
}

/** Dunkle Schrift oder helle Schrift auf einer Pastellfarbe (WCAG-nah). */
export function readableOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.35 ? '#2B261E' : '#FFFFFF';
}
