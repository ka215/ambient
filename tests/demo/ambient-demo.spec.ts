import { expect } from '@playwright/test';

import { test } from '../e2e/fixtures/ambient-page.fixture';
import {
  buildDemoPlaylist,
  closeDemoDrawers,
  closeOptionsModalIfOpen,
  DEMO_PLAYLIST_NAME,
  installDemoPlaylistAsset,
  installDemoStartupGate,
  openManagementSection,
  pace,
  preloadDemoVisualAssets,
  revealAboutQrContent,
  releaseDemoStartupGate,
  removeDemoPlaylistAsset,
  resolveDemoAssets,
  resolveDemoMediaTargets,
  scrollMediaEditModalTopToBottom,
  waitForDemoInitialUiStable,
  waitForFullWindow,
  waitForMenuMinimized,
  waitForMediaEditPreview,
} from './utils/demo-actions';
import {
  clearHighlight,
  highlight,
  humanClick,
  humanFill,
  installDemoOverlays,
  moveCursorToSelector,
} from './utils/demo-overlays';

test.describe('Ambient demo video', () => {
  test.afterEach(() => {
    removeDemoPlaylistAsset();
  });

  test('records the introduction demo flow', async ({ ambientPage, page }) => {
    const assets = resolveDemoAssets();
    const demoPlaylist = buildDemoPlaylist(assets);
    const mediaTargets = resolveDemoMediaTargets(demoPlaylist);
    installDemoPlaylistAsset(demoPlaylist);

    await installDemoStartupGate(page);
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.waitForPlaylistReady();
    await ambientPage.selectPlaylist(DEMO_PLAYLIST_NAME);
    await preloadDemoVisualAssets(page);
    await ambientPage.openPlaylistDrawer();
    await ambientPage.openSettingsDrawer();
    await waitForDemoInitialUiStable(page);
    await installDemoOverlays(page);
    await releaseDemoStartupGate(page);

    await moveCursorToSelector(page, '#playlist-list-group', 900);
    await highlight(page, '#playlist-list-group', 2500);
    await pace(page, 20_000);

    await openManagementSection(page, '#collapse-item-heading-media button', 'collapse-item-body-media');
    await highlight(page, '#collapse-item-body-media', 1500);
    await humanFill(page, page.locator('#youtube-url'), `https://www.youtube.com/watch?v=${assets.extraYouTubeVideoId}`);
    await expect(page.locator('#youtube-videoid')).toHaveValue(assets.extraYouTubeVideoId);
    await highlight(page, '#youtube-url', 1500);
    await moveCursorToSelector(page, '#media-category', 650);
    await page.locator('#media-category').selectOption({ label: mediaTargets.categoryName });
    await page.locator('#media-category').dispatchEvent('change');
    await highlight(page, '#media-category', 1000);
    await humanFill(page, page.locator('#media-title'), assets.extraYouTubeTitle);
    await humanFill(page, page.locator('#media-artist'), 'Ambient Demo');
    await humanFill(page, page.locator('#media-desc'), 'New YouTube scene for full-window playback');
    await humanFill(page, page.locator('#seek-start'), '5');
    await humanFill(page, page.locator('#seek-end'), '45');
    await expect(page.locator('#btn-add-media')).toBeEnabled();
    await humanClick(page, page.locator('#btn-add-media'));
    await expect(page.locator('#playlist-list-group')).toContainText(assets.extraYouTubeTitle, { timeout: 10_000 });
    await highlight(page, '#playlist-list-group', 1800);
    await pace(page, 18_000);

    await closeOptionsModalIfOpen(page);
    await expect(page.locator('#modal-options')).toBeHidden();
    await ambientPage.openPlaylistDrawer();
    await ambientPage.waitForYouTubeApi();

    const youtubeItem = page.locator('#playlist-list-group a[data-playlist-item]').filter({ hasText: mediaTargets.initialYouTubeTitle }).first();
    await expect(youtubeItem).toBeVisible();
    await highlight(page, '#playlist-list-group', 1000);
    await humanClick(page, youtubeItem);
    await pace(page, 9_000);

    const localVideoItem = page.locator('#playlist-list-group a[data-playlist-item]').filter({ hasText: mediaTargets.localVideoTitle }).first();
    await expect(localVideoItem).toBeVisible();
    await humanClick(page, localVideoItem);
    if (process.env.AMP_DEMO_FAST !== '1') {
      await expect(page.locator('#html-player')).toBeVisible();
    }
    await pace(page, 13_000);

    const addedYoutubeItem = page.locator('#playlist-list-group a[data-playlist-item]').filter({ hasText: assets.extraYouTubeTitle }).first();
    await expect(addedYoutubeItem).toBeVisible();
    const seqBeforeAddedYoutube = await ambientPage.getYouTubeSignalSeq();
    await humanClick(page, addedYoutubeItem);
    await ambientPage.waitForYouTubePhase(['player_ready', 'playing', 'paused'], seqBeforeAddedYoutube + 1);
    await closeDemoDrawers(page);
    await humanClick(page, page.locator('#btn-window-full'));
    await waitForFullWindow(page, true);
    await highlight(page, '#embed-wrapper', 1400);
    await pace(page, 8_000);
    await humanClick(page, page.locator('#btn-menu-collapse'));
    await waitForMenuMinimized(page, true);
    await pace(page, 8_000);
    await humanClick(page, page.locator('#btn-menu-collapse'));
    await waitForMenuMinimized(page, false);
    await pace(page, 4_000);
    await ambientPage.openPlaylistDrawer();

    await humanClick(page, page.locator('#btn-playlist-mode'));
    await humanClick(page, page.locator('#playlist-mode-menu .playlist-mode-option[data-mode="edit"]'));
    await expect(page.locator('#playlist-mode-button-label')).toContainText(/Edit|編集/);
    await humanClick(page, addedYoutubeItem);
    await expect(page.locator('#modal-media-edit')).toBeVisible();
    await waitForMediaEditPreview(page);
    await highlight(page, '#modal-media-edit-preview', 1800);
    await scrollMediaEditModalTopToBottom(page);
    await humanFill(page, page.locator('#modal-media-edit-seek-start'), '5');
    await humanFill(page, page.locator('#modal-media-edit-seek-end'), '45');
    await humanFill(page, page.locator('#modal-media-edit-fadein-end'), '8');
    await humanFill(page, page.locator('#modal-media-edit-fadeout-start'), '41');
    await highlight(page, '#modal-media-edit', 2000);
    await pace(page, 23_000);
    await humanClick(page, page.locator('#btn-close-media-edit'));
    await expect(page.locator('#modal-media-edit')).toBeHidden();
    await humanClick(page, page.locator('#btn-window-full'));
    await waitForFullWindow(page, false);

    await ambientPage.openSettingsDrawer();
    await moveCursorToSelector(page, '#toggle-seekplay', 650);
    await highlight(page, '#toggle-seekplay', 1200);
    await moveCursorToSelector(page, '#toggle-fader', 650);
    await highlight(page, '#toggle-fader', 1200);
    await pace(page, 12_000);

    await openManagementSection(page, '#collapse-item-heading-playlist button', 'collapse-item-body-playlist');
    await highlight(page, '#collapse-item-body-playlist', 1500);
    await pace(page, 17_000);

    const exportButton = page.locator('#btn-export-playlist, #btn-export-json, [id*="export"]').first();
    if (await exportButton.count() > 0) {
      await moveCursorToSelector(page, '[id*="export"]', 650);
      await highlight(page, '[id*="export"]', 1500);
    }
    await pace(page, 8_000);

    await openManagementSection(page, '#collapse-item-heading-about button', 'collapse-item-body-about');
    await revealAboutQrContent(page);
    await highlight(page, '#collapse-item-body-about', 1500);
    await pace(page, 9_000);

    await clearHighlight(page);
    await pace(page, 4_000);
  });
});
