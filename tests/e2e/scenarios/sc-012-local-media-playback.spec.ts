import { expect } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';

test.describe('SC-012 Local media playback', () => {
  test('keeps custom HTML playlist labels constrained inside list items', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist('example.json');

    await ambientPage.openPlaylistDrawer();
    await expect(page.locator('#playlist-list-group a[data-playlist-item]').first()).toBeVisible();

    await expect.poll(async () => {
      return page.evaluate(() => {
        const label = document.querySelector<HTMLElement>('#playlist-list-group a[data-playlist-item] .playlist-item-label');
        const child = label?.firstElementChild as HTMLElement | null;
        if (!label || !child) return false;
        return child.getBoundingClientRect().width <= label.getBoundingClientRect().width + 1;
      });
    }).toBe(true);
  });

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

  test('fits local MP4 full-window video above the bottom menu band', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist('example.json');

    await ambientPage.openSettingsDrawer();
    await page.locator('#target-category').selectOption({ label: 'Local PC media' });
    await page.locator('#target-category').dispatchEvent('change');
    await ambientPage.closeSettingsDrawer();

    await ambientPage.openPlaylistDrawer();
    await page.locator('#playlist-list-group a[data-playlist-item]').filter({ hasText: 'テスト動画(mp4)' }).click();
    await expect(page.locator('#html-player')).toHaveJSProperty('tagName', 'VIDEO');

    await page.locator('#btn-window-full').click();
    await expect(page.locator('body')).toHaveClass(/amp-full-window/);

    await expect.poll(async () => {
      return page.evaluate(() => {
        const video = document.querySelector<HTMLVideoElement>('#html-player');
        const menu = document.getElementById('menu-container');
        if (!video || !menu) return false;
        const videoRect = video.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        const viewportHeight = Math.round(window.visualViewport?.height || window.innerHeight);
        const aspect = videoRect.width / videoRect.height;
        return videoRect.bottom <= menuRect.top + 1 &&
          Math.abs(menuRect.bottom - viewportHeight) <= 1 &&
          Math.abs(aspect - (16 / 9)) < 0.02;
      });
    }).toBe(true);
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
    await expect(player).toBeVisible();
    await expect.poll(async () => {
      return player.evaluate((el) => {
        const rect = (el as HTMLAudioElement).getBoundingClientRect();
        return rect.width >= 300 && rect.height >= 40;
      });
    }).toBe(true);
    await expect.poll(async () => {
      return player.evaluate((el) => (el as HTMLAudioElement).canPlayType('audio/mpeg'));
    }).not.toBe('');
  });

  test('keeps local MP3 audio controls visible in dark mode', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist('example.json');

    await ambientPage.openSettingsDrawer();
    await page.locator('#target-category').selectOption({ label: 'Local PC media' });
    await page.locator('#target-category').dispatchEvent('change');
    const darkToggle = page.locator('#toggle-darkmode input[type="checkbox"]');
    if (!(await darkToggle.isChecked())) {
      await page.locator('#toggle-darkmode').click();
    }
    await ambientPage.closeSettingsDrawer();

    await ambientPage.openPlaylistDrawer();
    await page.locator('#playlist-list-group a[data-playlist-item]').filter({ hasText: 'グランディアのテーマ(mp3)' }).click();

    const player = page.locator('#html-player');
    await expect(player).toHaveJSProperty('tagName', 'AUDIO');
    await expect(player).toHaveClass(/ambient-audio-player/);
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(player).toBeVisible();
    await expect.poll(async () => {
      return player.evaluate((el) => {
        const rect = (el as HTMLAudioElement).getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return rect.width >= 300 &&
          rect.height >= 40 &&
          style.colorScheme.includes('dark');
      });
    }).toBe(true);
  });
});
