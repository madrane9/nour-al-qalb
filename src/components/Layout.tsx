import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, LogIn, LogOut, Moon, Search, Settings, Sparkles, Sun } from 'lucide-react';
import { LANGS, type Lang } from '@/types';
import { useLang } from '@/hooks/useLang';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/state/AuthContext';
import { isSupabaseConfigured } from '@/services/supabase';

const LANG_LABEL: Record<Lang, { flag: string; name: string; native: string }> = {
  ar: { flag: '🇲🇦', name: 'Darija', native: 'الدارجة' },
  de: { flag: '🇩🇪', name: 'Deutsch', native: 'DE' },
  en: { flag: '🇬🇧', name: 'English', native: 'EN' },
};

function LanguageSwitcher() {
  const { t } = useTranslation();
  const { lang, setLang } = useLang();
  return (
    <div role="group" aria-label={t('prefs.language')} className="flex rounded-full border border-line bg-card p-1">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          lang={l === 'ar' ? 'ar' : l}
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          data-testid={`lang-${l}`}
          className={`min-h-9 rounded-full px-3 text-sm font-semibold transition ${
            lang === l ? 'bg-gold text-ivory' : 'hover:bg-line/50'
          }`}
        >
          <span aria-hidden>{LANG_LABEL[l].flag} </span>
          {l === 'ar' ? LANG_LABEL[l].native : LANG_LABEL[l].name}
        </button>
      ))}
    </div>
  );
}

function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={theme === 'dark'}
      aria-label={`${t('prefs.theme')}: ${theme === 'dark' ? t('prefs.dark') : t('prefs.light')}`}
      className="grid h-11 w-11 place-items-center rounded-full border border-line bg-card hover:bg-line/50"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
    </button>
  );
}

function Stars() {
  const stars = Array.from({ length: 18 }, (_, i) => ({
    left: (i * 37) % 100,
    top: (i * 53) % 100,
    delay: (i % 6) * 0.7,
    size: 2 + (i % 3),
  }));
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {stars.map((s, i) => (
        <span
          key={i}
          className="star absolute rounded-full bg-gold"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
        />
      ))}
    </div>
  );
}

export function Layout() {
  const { t } = useTranslation();
  const { user, isAdmin, signOut } = useAuth();
  const link = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ${isActive ? 'bg-line/70' : 'hover:bg-line/40'}`;

  return (
    <div className="ornament-bg flex min-h-dvh flex-col">
      <Stars />
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-card focus:p-3">
        {t('app.skip')}
      </a>
      <header className="border-b border-line/70 bg-ivory/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-gold" end>
            <Sparkles className="h-5 w-5" aria-hidden />
            <span lang="ar" className="font-arabic text-2xl">نور القلب</span>
          </NavLink>
          <nav aria-label={t('nav.menu')} className="order-last flex w-full flex-wrap gap-1 sm:order-none sm:w-auto">
            <NavLink to="/" end className={link}><Sparkles className="h-4 w-4" aria-hidden />{t('nav.discover')}</NavLink>
            <NavLink to="/search" className={link}><Search className="h-4 w-4" aria-hidden />{t('nav.search')}</NavLink>
            <NavLink to="/favorites" className={link}><Heart className="h-4 w-4" aria-hidden />{t('nav.favorites')}</NavLink>
            {isAdmin && <NavLink to="/admin" className={link}><Settings className="h-4 w-4" aria-hidden />{t('nav.admin')}</NavLink>}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            {isSupabaseConfigured &&
              (user ? (
                <button type="button" onClick={() => void signOut()} className={link({ isActive: false })}>
                  <LogOut className="h-4 w-4" aria-hidden />{t('nav.logout')}
                </button>
              ) : (
                <NavLink to="/login" className={link}><LogIn className="h-4 w-4" aria-hidden />{t('nav.login')}</NavLink>
              ))}
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-line/70 px-4 py-6 text-center text-sm text-muted">{t('footer')}</footer>
    </div>
  );
}
