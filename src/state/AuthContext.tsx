import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { checkIsAdmin } from '@/services/admin';

interface AuthValue {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirm: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const apply = async (u: User | null) => {
      const admin = u ? await checkIsAdmin(u.id) : false;
      if (!active) return;
      setUser(u);
      setIsAdmin(admin);
      setLoading(false);
    };
    void supabase.auth.getSession().then(({ data }) => apply(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      // Nicht innerhalb des Callbacks awaiten (Supabase-Empfehlung)
      setTimeout(() => void apply(session?.user ?? null), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return 'not-configured';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'not-configured', needsConfirm: false };
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null, needsConfirm: !error && !data.session };
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ user, isAdmin, loading, signIn, signUp, signOut }),
    [user, isAdmin, loading, signIn, signUp, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth außerhalb von AuthProvider');
  return v;
}
