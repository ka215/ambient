import { expect } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';

test.describe('SC-012 Local media playback', () => {
  test('creates a playable video source for local MP4 playlist items', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist('example.json');

    await ambientPage.openSettingsDrawer();
    await page.locator('#target-category').selectOption({ label: 'Local PC media' });
    await page.locator('#target-category').dispatchEvent('change');
    await ambientPage.closeSettingsDrawer();

    await ambientPage.openPlaylistDrawer();
    await page.locator('#playlist-list-group a[data-playlist-item]').filter({ hasText: 'テスト動画(mp4)' }).click();

    const player = page.locator('#html-player');
    await expect(player).toHaveJSProperty('tagName', 'VIDEO');
    await expect(page.locator('#html-player source')).toHaveAttribute('type', 'video/mp4');
    await expect(page.locator('#html-player source')).toHaveAttribute('src', /assets\/media\/test3\.mp4$/);
    await expect.poll(async () => {
      return player.evaluate((el) => (el as HTMLVideoElement).canPlayType('video/mp4'));
    }).not.toBe('');
  });

  test('creates a playable audio source for local MP3 playlist items', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist('example.json');

    await ambientPage.openSettingsDrawer();
    await page.locator('#target-category').selectOption({ label: 'Local PC media' });
    await page.locator('#target-category').dispatchEvent('change');
    await ambientPage.closeSettingsDrawer();

    await ambientPage.openPlaylistDrawer();
    await page.locator('#playlist-list-group a[data-playlist-item]').filter({ hasText: 'グランディアのテーマ(mp3)' }).click();

    const player = page.locator('#html-player');
    await expect(player).toHaveJSProperty('tagName', 'AUDIO');
    await expect(page.locator('#html-player source')).toHaveAttribute('type', 'audio/mpeg');
    await expect(page.locator('#html-player source')).toHaveAttribute('src', /assets\/media\/test\.mp3$/);
    await expect.poll(async () => {
      return player.evaluate((el) => (el as HTMLAudioElement).canPlayType('audio/mpeg'));
    }).not.toBe('');
  });
});
