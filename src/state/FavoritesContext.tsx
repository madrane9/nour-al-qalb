import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '@/services/supabase';
import { readJson, writeJson } from '@/services/storage';
import { useAuth } from './AuthContext';

const KEY = 'nq.favorites';

interface FavoritesValue {
  ids: ReadonlySet<string>;
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => Promise<void>;
  /** true, wenn Favoriten in der Datenbank liegen */
  synced: boolean;
}

const FavoritesContext = createContext<FavoritesValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(() => new Set(readJson<string[]>(KEY, [])));
  const synced = Boolean(user && supabase);

  // Beim Login: Gast-Favoriten in die Datenbank übernehmen und DB-Stand laden
  useEffect(() => {
    if (!user || !supabase) return;
    const client = supabase;
    let active = true;
    void (async () => {
      const local = readJson<string[]>(KEY, []);
      if (local.length) {
        await client
          .from('favorites')
          .upsert(local.map((entry_id) => ({ user_id: user.id, entry_id })), { onConflict: 'user_id,entry_id', ignoreDuplicates: true });
        writeJson(KEY, []);
      }
      const { data } = await client.from('favorites').select('entry_id').eq('user_id', user.id);
      if (active && data) setIds(new Set(data.map((r) => r.entry_id as string)));
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const toggle = useCallback(
    async (id: string) => {
      const adding = !ids.has(id);
      const next = new Set(ids);
      if (adding) next.add(id);
      else next.delete(id);
      setIds(next);
      if (user && supabase) {
        const { error } = adding
          ? await supabase.from('favorites').insert({ user_id: user.id, entry_id: id })
          : await supabase.from('favorites').delete().eq('user_id', user.id).eq('entry_id', id);
        if (error) setIds(ids); // zurückrollen
      } else {
        writeJson(KEY, [...next]);
      }
    },
    [ids, user],
  );

  const value = useMemo<FavoritesValue>(
    () => ({ ids, isFavorite: (id) => ids.has(id), toggle, synced }),
    [ids, toggle, synced],
  );
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesValue {
  const v = useContext(FavoritesContext);
  if (!v) throw new Error('useFavorites außerhalb von FavoritesProvider');
  return v;
}
