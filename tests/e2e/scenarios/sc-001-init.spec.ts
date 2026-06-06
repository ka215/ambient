import { expect } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';

test.describe('SC-001 Player initialization on page load', () => {
  test('loads base UI and playlist readiness state', async ({ ambientPage, page }) => {
    // Arrange
    await ambientPage.gotoHome();

    // Act
    await ambientPage.waitForBaseUi();
    await ambientPage.waitForPlaylistReady();

    // Toast container must always exist to satisfy updateNotice DOM contract.
    await expect(page.locator('#alert-notification')).toHaveCount(1);

    // Assert
    const items = page.locator('#playlist-list-group a[data-playlist-item]');
    const count = await items.count();
    if (count > 0) {
      await expect(items.first()).toBeVisible();
      await expect(page.locator('#btn-play')).toBeEnabled();
    } else {
      await expect(page.locator('#no-media')).toBeVisible();
      await expect(page.locator('#current-playlist')).toBeVisible();
      await expect(page.locator('#btn-play')).toBeDisabled();
    }
  });
});
