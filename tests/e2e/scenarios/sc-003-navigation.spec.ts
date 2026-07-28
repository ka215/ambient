import { expect } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';
import { expectCurrentPlaylistItem } from '../utils/assertions';
import { E2E_PLAYLIST_NAME, installE2ePlaylistFixture, removeE2ePlaylistFixture } from '../utils/playlist-fixtures';

test.describe('SC-003 Playlist navigation (next/prev)', () => {
  test.beforeEach(() => {
    installE2ePlaylistFixture();
  });

  test.afterEach(() => {
    removeE2ePlaylistFixture();
  });

  test('moves focus across items via next and previous controls', async ({ ambientPage, page }) => {
    // Arrange
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();

    // Ensure carousel controls are visible for this scenario.
    const fullPressed = await page.locator('#btn-window-full').getAttribute('aria-pressed');
    if (fullPressed === 'true') {
      await page.locator('#btn-window-full').click();
      await expect(page.locator('body')).not.toHaveClass(/amp-full-window/);
    }

    await ambientPage.selectPlaylist(E2E_PLAYLIST_NAME);
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
    await page.evaluate(() => {
      const btn = document.getElementById('data-carousel-next') as HTMLElement | null;
      if (btn) btn.click();
    });
    await ambientPage.openPlaylistDrawer();
    const currentAfterNext = page.locator('#playlist-list-group a[aria-current="true"]');
    const nextCurrentId = await currentAfterNext.first().getAttribute('data-playlist-item');
    await ambientPage.closePlaylistDrawer();

    await page.evaluate(() => {
      const btn = document.getElementById('data-carousel-prev') as HTMLElement | null;
      if (btn) btn.click();
    });
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
