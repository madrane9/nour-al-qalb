import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/state/AuthContext';
import { isSupabaseConfigured } from '@/services/supabase';

/** Schützt den Adminbereich. Die eigentliche Sicherheit liefert RLS; dies ist nur die Oberfläche. */
export function AdminLayout() {
  const { t } = useTranslation();
  const { user, isAdmin, loading } = useAuth();
  if (!isSupabaseConfigured) return <p className="text-center">{t('admin.notConfigured')}</p>;
  if (loading) return <p role="status">{t('home.loading')}</p>;
  if (!user) return <p className="text-center">{t('admin.loginRequired')}</p>;
  if (!isAdmin) return <p role="alert" className="text-center">{t('admin.noAccess')}</p>;

  const link = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold ${isActive ? 'bg-gold text-ivory' : 'border border-line hover:bg-line/40'}`;
  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">{t('admin.title')}</h1>
      <nav className="mb-6 flex flex-wrap gap-2" aria-label={t('admin.title')}>
        <NavLink to="/admin" end className={link}>{t('admin.dashboard')}</NavLink>
        <NavLink to="/admin/entries" className={link}>{t('admin.entries')}</NavLink>
        <NavLink to="/admin/emotions" className={link}>{t('admin.emotions')}</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
