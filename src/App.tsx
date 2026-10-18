import { Link, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from '@/state/AuthContext';
import { ContentProvider } from '@/state/ContentContext';
import { FavoritesProvider } from '@/state/FavoritesContext';
import { Layout } from '@/components/Layout';
import { DiscoverPage } from '@/pages/DiscoverPage';
import { SearchPage } from '@/pages/SearchPage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { LoginPage } from '@/pages/LoginPage';
import { AdminLayout } from '@/features/admin/AdminLayout';
import { Dashboard } from '@/features/admin/Dashboard';
import { EntriesList } from '@/features/admin/EntriesList';
import { EntryEditor } from '@/features/admin/EntryEditor';
import { EmotionsAdmin } from '@/features/admin/EmotionsAdmin';

function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="text-center">
      <h1 className="mb-4 text-2xl font-bold">{t('errors.notFound')}</h1>
      <Link className="underline" to="/">{t('errors.home')}</Link>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ContentProvider>
        <FavoritesProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<DiscoverPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="favorites" element={<FavoritesPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="entries" element={<EntriesList />} />
                <Route path="entries/new/:type" element={<EntryEditor />} />
                <Route path="entries/:id" element={<EntryEditor />} />
                <Route path="emotions" element={<EmotionsAdmin />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </FavoritesProvider>
      </ContentProvider>
    </AuthProvider>
  );
}
