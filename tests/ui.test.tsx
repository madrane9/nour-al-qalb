import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n, { applyDocumentLang, setLanguage } from '@/i18n';
import App from '@/App';
import { buildLocalCatalog } from '@/data/localCatalog';
import { EntryCard } from '@/components/EntryCard';
import { AuthProvider } from '@/state/AuthContext';
import { FavoritesProvider } from '@/state/FavoritesContext';

const { emotions, entries } = buildLocalCatalog();

function renderApp() {
  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  setLanguage('de');
});

describe('Sprache und RTL', () => {
  it('setzt dir=rtl für Darija und ltr für Deutsch/Englisch', () => {
    setLanguage('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar-MA');
    setLanguage('en');
    expect(document.documentElement.dir).toBe('ltr');
    applyDocumentLang('de');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('lokalisiert die Startseite vollständig', async () => {
    renderApp();
    expect(await screen.findByText('Wie fühlst du dich heute?')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('lang-en'));
    expect(await screen.findByText('How are you feeling today?')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('lang-ar'));
    expect(await screen.findByText('كيف تشعر اليوم؟')).toBeInTheDocument();
  });

  it('hat in allen Sprachen dieselben Übersetzungsschlüssel', () => {
    const keys = (o: unknown, p = ''): string[] =>
      Object.entries(o as Record<string, unknown>).flatMap(([k, v]) =>
        typeof v === 'object' && v ? keys(v, `${p}${k}.`) : [`${p}${k}`],
      );
    const de = keys(i18n.getResourceBundle('de', 'translation')).sort();
    expect(keys(i18n.getResourceBundle('en', 'translation')).sort()).toEqual(de);
    expect(keys(i18n.getResourceBundle('ar', 'translation')).sort()).toEqual(de);
  });
});

describe('Hoffnungsglas', () => {
  it('Gefühl wählen zeigt einen passenden Vers; weiterer Vers ist ein anderer', async () => {
    renderApp();
    await userEvent.click(await screen.findByTestId('emotion-hope'));
    const result = await screen.findByTestId('jar-result', {}, { timeout: 3000 });
    const firstText = within(result).getByTestId('entry-card').textContent;
    expect(within(result).getByTestId('entry-arabic')).toBeInTheDocument();
    await userEvent.click(within(result).getByRole('button', { name: /Noch einen entdecken/ }));
    const next = await screen.findByTestId('jar-result', {}, { timeout: 3000 });
    await waitFor(() => expect(within(next).getByTestId('entry-card').textContent).not.toBe(firstText), { timeout: 3000 });
  });

  it('wechselt zur Mindmap-/Listenansicht', async () => {
    renderApp();
    await userEvent.click(await screen.findByTestId('mode-list'));
    expect(await screen.findByTestId('list-view')).toBeInTheDocument();
  });
});

describe('Verskarte', () => {
  const quran = entries.find((e) => e.sourceReference === '94:6')!;
  const wrap = (ui: React.ReactElement) =>
    render(
      <AuthProvider>
        <FavoritesProvider>{ui}</FavoritesProvider>
      </AuthProvider>,
    );

  it('trennt Übersetzung und eigene Darija-Erklärung deutlich', () => {
    wrap(<EntryCard entry={quran} emotions={emotions} />);
    expect(screen.getByText(/Bubenheim/)).toBeInTheDocument();
    expect(screen.getByText(/Keine Übersetzung und kein Korantext/)).toBeInTheDocument();
    expect(screen.getByTestId('entry-arabic')).toHaveAttribute('lang', 'ar');
  });

  it('speichert Favoriten für Gäste lokal', async () => {
    wrap(<EntryCard entry={quran} emotions={emotions} />);
    await userEvent.click(screen.getByRole('button', { name: 'Zu Favoriten hinzufügen' }));
    expect(JSON.parse(window.localStorage.getItem('nq.favorites') ?? '[]')).toContain(quran.id);
  });

  it('zeigt keinen Audio-Player ohne Audioquelle', () => {
    const { container } = wrap(<EntryCard entry={{ ...quran, audioUrl: null }} emotions={emotions} />);
    expect(container.querySelector('audio')).toBeNull();
  });

  it('rendert Text als Text (XSS-sicher)', () => {
    const evil = { ...quran, translations: [{ lang: 'de' as const, kind: 'translation' as const, body: '<img src=x onerror=alert(1)>', sourceName: 'x' }] };
    const { container } = wrap(<EntryCard entry={evil} emotions={emotions} />);
    expect(container.querySelector('img')).toBeNull();
  });

  it('verwirft nicht-https Quelllinks', () => {
    wrap(<EntryCard entry={{ ...quran, sourceUrl: 'javascript:alert(1)' }} emotions={emotions} />);
    expect(screen.queryByRole('link', { name: /Quelle öffnen/ })).toBeNull();
  });
});
