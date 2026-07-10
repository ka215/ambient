import { test } from '../fixtures/ambient-page.fixture';
import { expectPausePlaySwapped, expectPlayPauseSwapped } from '../utils/assertions';

test.describe('SC-002 Play/pause state toggle', () => {
  test('toggles controls between play and pause', async ({ ambientPage, page }) => {
    // Arrange
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist('mememori-yt.json');
    await ambientPage.waitForYouTubeApi();

    // Open playlist drawer to access items, click first item, then close drawer
    const seqBeforePlay = await ambientPage.getYouTubeSignalSeq();
    await ambientPage.openPlaylistDrawer();
    await page.locator('#playlist-list-group a[data-playlist-item]').first().click();
    await ambientPage.closePlaylistDrawer();

    // Act – click first item; playlist item click handler immediately shows #btn-pause
    await page.locator('#btn-pause').waitFor({ state: 'visible' });
    await ambientPage.waitForYouTubePlayerReady(seqBeforePlay + 1);
    await ambientPage.waitForYouTubePhase('playing', seqBeforePlay + 1);

    // Assert – play→pause
    await expectPlayPauseSwapped(page);

    // Act – pause
    const seqBeforePause = await ambientPage.getYouTubeSignalSeq();
    await page.locator('#btn-pause').click({ force: true });

    // Assert – pause→play
    await expectPausePlaySwapped(page);

    // The UI pause transition is immediate, while the YouTube paused callback can lag or be skipped
    // depending on the iframe/player timing. For this scenario, the control-state swap is the contract.
    const seqAfterPause = await ambientPage.getYouTubeSignalSeq();
    if (seqAfterPause > seqBeforePause) {
      await ambientPage.waitForYouTubePlayerReady(seqBeforePause + 1);
    }
  });
});
