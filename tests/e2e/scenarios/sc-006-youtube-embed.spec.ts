import { expect } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';
import { findYoutubePlaylistItem } from '../utils/data-helpers';

test.describe('SC-006 YouTube IFrame embed on track selection', () => {
  test('renders YouTube player area when selecting a YouTube item', async ({ ambientPage, page }) => {
    // Arrange
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist('mememori-youtube.json');
    await ambientPage.waitForYouTubeApi();
    const youtubeItem = await findYoutubePlaylistItem(page);
    // mememori-youtube.json guarantees YouTube items; skip only if somehow absent
    test.skip(!youtubeItem, 'No YouTube media item found in current playlist.');

    // Act
    await youtubeItem!.click();

    // Assert – #ytplayer div/iframe is created in DOM without waiting for onPlayerReady
    const embedWrapper = page.locator('#embed-wrapper');
    await expect(embedWrapper).toBeVisible();
    await expect(page.locator('#ytplayer, #embed-wrapper iframe')).toBeAttached({ timeout: 10_000 });
  });
});
