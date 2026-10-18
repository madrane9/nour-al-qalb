import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('Sprache wählen: Darija schaltet auf RTL, Deutsch zurück auf LTR', async ({ page }) => {
  await page.getByTestId('lang-ar').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByTestId('how-feel')).toHaveText('كيف تشعر اليوم؟');
  await page.getByTestId('lang-de').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByTestId('how-feel')).toHaveText('Wie fühlst du dich heute?');
  await page.getByTestId('lang-en').click();
  await expect(page.getByTestId('how-feel')).toHaveText('How are you feeling today?');
});

test('Gefühl anklicken, Zettel ziehen, weiteren Vers entdecken, zurück zum Glas', async ({ page }) => {
  await page.getByTestId('lang-de').click();
  await page.getByTestId('emotion-patience').click();
  const result = page.getByTestId('jar-result');
  await expect(result.getByTestId('entry-arabic')).toBeVisible();
  const first = await result.getByTestId('entry-card').innerText();
  await result.getByRole('button', { name: 'Noch einen entdecken' }).click();
  await expect(result.getByTestId('entry-card')).not.toHaveText(first);
  await result.getByRole('button', { name: 'Zurück zum Glas' }).click();
  await expect(page.getByTestId('jar-result')).toHaveCount(0);
});

test('Dieselben Inhalte über die Mindmap entdecken', async ({ page }) => {
  await page.getByTestId('lang-de').click();
  await page.getByTestId('mode-map').click();
  await expect(page.getByTestId('mindmap')).toBeVisible();
  await page.locator('.react-flow__node', { hasText: 'Hoffnung' }).click();
  const panel = page.getByTestId('map-panel');
  await expect(panel).toBeVisible();
  await panel.getByRole('button').nth(1).click();
  await expect(panel.getByTestId('entry-arabic')).toBeVisible();
});

test('Listenansicht (barrierefreie Alternative) und Filter Hadith', async ({ page }) => {
  await page.getByTestId('lang-de').click();
  await page.getByTestId('mode-list').click();
  await expect(page.getByTestId('list-view')).toBeVisible();
  await page.getByRole('button', { name: 'Hadith' }).click();
  await expect(page.getByTestId('list-view').getByText('0 Inhalte').first()).toBeVisible();
});

test('Favoriten speichern und auf der Favoritenseite sehen', async ({ page }) => {
  await page.getByTestId('lang-de').click();
  await page.getByTestId('emotion-hope').click();
  await page.getByTestId('jar-result').getByRole('button', { name: 'Zu Favoriten hinzufügen' }).click();
  await page.getByRole('link', { name: 'Favoriten' }).click();
  await expect(page.getByTestId('favorites-list').getByTestId('entry-card')).toHaveCount(1);
});

test('Suche findet Verse nach Begriff', async ({ page }) => {
  await page.getByTestId('lang-en').click();
  await page.getByRole('link', { name: 'Search' }).click();
  await page.getByRole('searchbox').fill('hardship');
  await expect(page.getByTestId('entry-card').first()).toContainText('hardship');
});

test('Adminbereich ist ohne Anmeldung nicht zugänglich', async ({ page }) => {
  await page.goto('./#/admin');
  await expect(page.getByTestId('admin-entry')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Verwaltung' })).toHaveCount(0);
});
