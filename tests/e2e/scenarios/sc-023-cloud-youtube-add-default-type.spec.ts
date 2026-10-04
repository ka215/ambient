import { expect } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';

// Regression: YouTube add must work without toggling the media-type radio (addtype stays null).
test('SC-023 cloud adds YouTube media with applied metadata and default media type', async ({ ambientPage, page }) => {
  await page.route('**/youtube-metadata/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      state: 'ok',
      code: 200,
      data: {
        videoId: 'dQw4w9WgXcQ',
        title: 'Meta Title',
        artist: 'Meta Artist',
        desc: 'line1\nline2',
        source: 'youtube-data-api',
        usage: { count: 1, limit: 100, limited: false },
      },
    }),
  }));
  await page.addInitScript(() => { localStorage.clear(); });
  await ambientPage.gotoHome();
  await ambientPage.waitForBaseUi();
  await ambientPage.waitForPlaylistReady();
  await page.evaluate(() => { (window as any).AmbientData.youtubeMetadata = { enabled: true }; });
  await page.evaluate(() => document.querySelector<HTMLElement>('#btn-options')?.click());
  await page.evaluate(() => document.querySelector<HTMLElement>('#collapse-item-heading-media button')?.click());

  await page.evaluate(() => {
    const url = document.getElementById('youtube-url') as HTMLInputElement;
    url.value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    url.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#btn-apply-youtube-metadata-all').click();
  await page.evaluate(() => {
    const category = document.getElementById('media-category-new') as HTMLInputElement | null;
    category?.dispatchEvent(new Event('input', { bubbles: true }));
    category?.dispatchEvent(new Event('change', { bubbles: true }));
  });

  await expect(page.locator('#btn-add-media')).toBeEnabled();
  await page.locator('#btn-add-media').click();
  await expect(page.locator('#alert-notification')).toContainClass('bg-green-50');
});
