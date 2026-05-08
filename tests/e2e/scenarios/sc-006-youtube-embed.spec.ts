import { expect } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';
import { findYoutubePlaylistItem } from '../utils/data-helpers';

test.describe('SC-006 YouTube IFrame embed on track selection', () => {
  test('renders YouTube player area when selecting a YouTube item', async ({ ambientPage, page }) => {
    // Arrange
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist('mememori-yt.json');
    await ambientPage.waitForYouTubeApi();
    await ambientPage.openPlaylistDrawer();
    const youtubeItem = await findYoutubePlaylistItem(page);
    // mememori-yt.json guarantees YouTube items; skip only if somehow absent
    test.skip(!youtubeItem, 'No YouTube media item found in current playlist.');

    // Act
    const seqBeforeSelect = await ambientPage.getYouTubeSignalSeq();
    await youtubeItem!.click();
    await ambientPage.closePlaylistDrawer();
    await ambientPage.waitForYouTubePhase(['player_created', 'player_ready', 'playing'], seqBeforeSelect + 1);

    // Assert – #ytplayer div/iframe is created in DOM using DOM signal-driven wait
    const embedWrapper = page.locator('#embed-wrapper');
    await expect(embedWrapper).toBeVisible();
    await expect(page.locator('#ytplayer, #embed-wrapper iframe')).toBeAttached({ timeout: 10_000 });
  });
});
