import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Catalog, Emotion, Entry } from '@/types';
import { loadCatalog } from '@/services/catalog';
import { useAuth } from './AuthContext';

interface ContentValue {
  status: 'loading' | 'ready' | 'error';
  emotions: Emotion[];
  entries: Entry[];
  /** Öffentlich sichtbare Daten: veröffentlicht + nicht archivierte Gefühle. */
  publicEmotions: Emotion[];
  publicEntries: Entry[];
  reload: () => Promise<void>;
}

const ContentContext = createContext<ContentValue | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<Catalog>({ emotions: [], entries: [] });
  const [status, setStatus] = useState<ContentValue['status']>('loading');

  const reload = useCallback(async () => {
    try {
      setCatalog(await loadCatalog());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  // Beim Wechsel des Anmeldestatus neu laden (Admins sehen zusätzlich Entwürfe)
  useEffect(() => {
    void reload();
  }, [reload, user?.id]);

  const value = useMemo<ContentValue>(() => {
    const publicEmotions = catalog.emotions.filter((e) => !e.archived);
    const publicEntries = catalog.entries.filter((e) => e.status === 'published');
    return { status, ...catalog, publicEmotions, publicEntries, reload };
  }, [catalog, status, reload]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentValue {
  const v = useContext(ContentContext);
  if (!v) throw new Error('useContent außerhalb von ContentProvider');
  return v;
}
