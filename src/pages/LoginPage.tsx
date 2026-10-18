import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useAuth } from '@/state/AuthContext';
import { isSupabaseConfigured } from '@/services/supabase';

const credentials = z.object({ email: z.string().trim().email(), password: z.string().min(8) });

export function LoginPage() {
  const { t } = useTranslation();
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured) return <p className="mx-auto max-w-md text-center">{t('auth.notConfigured')}</p>;
  if (user) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      setMessage(t('auth.invalid'));
      return;
    }
    setBusy(true);
    setMessage('');
    if (mode === 'in') {
      const err = await signIn(parsed.data.email, parsed.data.password);
      if (err) setMessage(t('auth.invalid'));
      else navigate('/');
    } else {
      const r = await signUp(parsed.data.email, parsed.data.password);
      if (r.error) setMessage(t('auth.invalid'));
      else if (r.needsConfirm) setMessage(t('auth.checkMail'));
      else navigate('/');
    }
    setBusy(false);
  };

  const field = 'min-h-11 w-full rounded-xl border border-line bg-card px-4';
  return (
    <form onSubmit={(e) => void submit(e)} className="mx-auto max-w-md space-y-4 rounded-xl2 border border-line bg-card p-6 shadow-soft" noValidate>
      <h1 className="text-2xl font-bold">{mode === 'in' ? t('auth.signIn') : t('auth.signUp')}</h1>
      <label className="block text-sm font-medium">
        {t('auth.email')}
        <input className={field} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label className="block text-sm font-medium">
        {t('auth.password')}
        <input className={field} type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      </label>
      <p role="alert" className="min-h-5 text-sm text-gold">{message}</p>
      <button disabled={busy} className="min-h-11 w-full rounded-full bg-gold font-semibold text-ivory disabled:opacity-60" type="submit">
        {mode === 'in' ? t('auth.signIn') : t('auth.signUp')}
      </button>
      <button type="button" className="w-full text-sm underline" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
        {mode === 'in' ? t('auth.switchToSignUp') : t('auth.switchToSignIn')}
      </button>
      <p className="text-xs text-muted">{t('auth.note')}</p>
    </form>
  );
}
