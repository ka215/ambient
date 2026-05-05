import { expect } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';
import { expectCurrentPlaylistItem } from '../utils/assertions';

test.describe('SC-003 Playlist navigation (next/prev)', () => {
  test('moves focus across items via next and previous controls', async ({ ambientPage, page }) => {
    // Arrange
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist('mememori-youtube.json');
    await ambientPage.waitForYouTubeApi();
    // Open playlist drawer, click first item to start playback, then close drawer
    const seqBeforePlay = await ambientPage.getYouTubeSignalSeq();
    await ambientPage.openPlaylistDrawer();
    await page.locator('#playlist-list-group a[data-playlist-item]').first().click();
    await ambientPage.closePlaylistDrawer();
    await ambientPage.waitForYouTubePhase(['player_ready', 'playing'], seqBeforePlay + 1);
    // Re-open to read aria-current
    await ambientPage.openPlaylistDrawer();
    const initialCurrentId = await page
      .locator('#playlist-list-group a[aria-current="true"]')
      .first()
      .getAttribute('data-playlist-item');
    await ambientPage.closePlaylistDrawer();

    // Act
    await page.locator('#data-carousel-next').click();
    await ambientPage.openPlaylistDrawer();
    const currentAfterNext = page.locator('#playlist-list-group a[aria-current="true"]');
    const nextCurrentId = await currentAfterNext.first().getAttribute('data-playlist-item');
    await ambientPage.closePlaylistDrawer();

    await page.locator('#data-carousel-prev').click();
    await ambientPage.openPlaylistDrawer();
    const currentAfterPrev = page.locator('#playlist-list-group a[aria-current="true"]');
    const prevCurrentId = await currentAfterPrev.first().getAttribute('data-playlist-item');

    // Assert
    await expectCurrentPlaylistItem(currentAfterNext);
    expect(nextCurrentId).not.toBeNull();
    if (initialCurrentId !== null && nextCurrentId !== null) {
      expect(nextCurrentId).not.toBe(initialCurrentId);
    }
    await expectCurrentPlaylistItem(currentAfterPrev);
    expect(prevCurrentId).not.toBeNull();
  });
});
