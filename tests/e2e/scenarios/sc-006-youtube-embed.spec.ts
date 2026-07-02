import { expect } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';
import { findYoutubePlaylistItem } from '../utils/data-helpers';

test.describe('SC-006 YouTube IFrame embed on track selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('AmbientMyPlaylist', JSON.stringify({
        E2E: [
          {
            title: 'e2e-youtube-item',
            videoid: 'dQw4w9WgXcQ',
            artist: 'E2E Artist',
            desc: '',
            start: '',
            end: '',
          },
        ],
        options: {
          dark: false,
          seek: false,
          shuffle: false,
          fader: false,
          volume: 50,
        },
      }));
    });
  });

  test('renders YouTube player area when selecting a YouTube item', async ({ ambientPage, page }) => {
    // Arrange
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist('MyPlaylist.json');
    await ambientPage.waitForYouTubeApi();
    await ambientPage.openPlaylistDrawer();
    const youtubeItem = await findYoutubePlaylistItem(page);
    expect(youtubeItem).not.toBeNull();
    if (!youtubeItem) {
      return;
    }

    // Act
    const seqBeforeSelect = await ambientPage.getYouTubeSignalSeq();
    await youtubeItem.click();
    await ambientPage.closePlaylistDrawer();
    await ambientPage.waitForYouTubePhase(['player_created', 'player_ready', 'playing'], seqBeforeSelect + 1);

    // Assert – #ytplayer div/iframe is created in DOM using DOM signal-driven wait
    const embedWrapper = page.locator('#embed-wrapper');
    await expect(embedWrapper).toBeVisible();
    await expect(page.locator('#ytplayer, #embed-wrapper iframe')).toBeAttached({ timeout: 10_000 });
  });
});
