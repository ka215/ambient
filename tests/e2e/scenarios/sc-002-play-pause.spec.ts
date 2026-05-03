import { test } from '../fixtures/ambient-page.fixture';
import { expectPausePlaySwapped, expectPlayPauseSwapped } from '../utils/assertions';

test.describe('SC-002 Play/pause state toggle', () => {
  test('toggles controls between play and pause', async ({ ambientPage, page }) => {
    // Arrange
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist('mememori-youtube.json');
    await ambientPage.waitForYouTubeApi();

    // Open playlist drawer to access items, click first item, then close drawer
    await ambientPage.openPlaylistDrawer();
    await page.locator('#playlist-list-group a[data-playlist-item]').first().click();
    await ambientPage.closePlaylistDrawer();

    // Act – click first item; playlist item click handler immediately shows #btn-pause
    await page.locator('#btn-pause').waitFor({ state: 'visible' });
    // Wait for the YT player iframe to be fully initialised before calling getPlayerState
    await ambientPage.waitForYouTubePlayerReady();

    // Assert – play→pause
    await expectPlayPauseSwapped(page);

    // Act – pause (dispatch click via JS to bypass z-index overlay in full-UI mode)
    await page.evaluate(() => {
      const btn = document.getElementById('btn-pause') as HTMLElement | null;
      if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });

    // Assert – pause→play
    await expectPausePlaySwapped(page);
  });
});
