import { useCallback, useSyncExternalStore } from 'react';
import { readString, writeString } from '@/services/storage';

export type Theme = 'light' | 'dark';
const KEY = 'nq.theme';
const listeners = new Set<() => void>();

function initial(): Theme {
  const saved = readString(KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

let current: Theme = initial();
if (typeof document !== 'undefined') document.documentElement.dataset.theme = current;

function setTheme(next: Theme) {
  current = next;
  document.documentElement.dataset.theme = next;
  writeString(KEY, next);
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => current, () => 'light' as Theme);
  const toggle = useCallback(() => setTheme(current === 'dark' ? 'light' : 'dark'), []);
  return { theme, toggle };
}
