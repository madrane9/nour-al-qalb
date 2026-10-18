import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173/nour-al-qalb/', trace: 'on-first-retry' },
  webServer: {
    command: 'npm run dev -- --port 4173 --host 127.0.0.1',
    url: 'http://127.0.0.1:4173/nour-al-qalb/',
    reuseExistingServer: !process.env.CI,
    // E2E laufen im lokalen Modus (ohne Supabase)
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
