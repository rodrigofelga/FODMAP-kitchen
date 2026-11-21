import { defineConfig } from '@playwright/test';

// Uses an installed browser channel (Edge by default on Windows) so no browser
// download is required. Override with PW_CHANNEL=chrome or PW_CHANNEL=chromium.
const channel = process.env.PW_CHANNEL ?? 'msedge';
const baseURL = process.env.BASE_URL ?? 'http://localhost:4173';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL, channel: channel === 'chromium' ? undefined : channel, serviceWorkers: 'allow' },
  projects: [
    { name: 'mobile', use: { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: false, deviceScaleFactor: 2 } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 860 } } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : { command: 'npm run preview', url: baseURL, reuseExistingServer: true, timeout: 60_000 },
});
