import { expect } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';

test.describe('SC-017 Public release smoke @public-release', () => {
  test('renders base UI and core controls on public environment', async ({ ambientPage, page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Public release verification is validated on chromium only.');

    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.waitForPlaylistReady();

    await expect(page.locator('#btn-play')).toBeVisible();
    await expect(page.locator('#btn-playlist')).toBeVisible();
    await expect(page.locator('#btn-settings')).toBeVisible();

    await ambientPage.openSettingsDrawer();
    await expect(page.locator('#current-playlist')).toBeVisible();
    await ambientPage.closeSettingsDrawer();

    await expect.poll(async () => {
      return page.evaluate(() => !document.body.classList.contains('app-boot-pending'));
    }, { timeout: 15_000 }).toBeTruthy();
  });
});
