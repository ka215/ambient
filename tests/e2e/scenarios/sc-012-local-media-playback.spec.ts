import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';

const EXAMPLE_PLAYLIST_CONTENT = {
  'Local PC media': [
    {
      title: 'テスト動画(mp4)',
      artist: 'E2E',
      desc: 'Local video fixture',
      file: 'test3.mp4',
    },
    {
      title: 'グランディアのテーマ(mp3)',
      artist: 'E2E',
      desc: 'Local audio fixture',
      file: 'test.mp3',
    },
  ],
  options: {
    volume: 50,
  },
};

function getExamplePlaylistName(projectName: string): string {
  return `example-${projectName.replace(/[^A-Za-z0-9_-]+/g, '-')}.json`;
}

function getExamplePlaylistPath(projectName: string): string {
  return path.join(process.cwd(), 'assets', getExamplePlaylistName(projectName));
}

async function selectPlaylist(page: Page, value: string): Promise<void> {
  await page.waitForFunction((playlistValue) => {
    const select = document.getElementById('current-playlist') as HTMLSelectElement | null;
    return !!select && Array.from(select.options).some((option) => option.value === playlistValue);
  }, value);

  await page.evaluate((playlistValue) => {
    const select = document.getElementById('current-playlist') as HTMLSelectElement | null;
    if (!select) {
      throw new Error('current-playlist not found');
    }
    select.value = playlistValue;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);

  await page.waitForFunction(() => {
    const body = document.body;
    const itemCount = document.querySelectorAll('#playlist-list-group a[data-playlist-item]').length;
    const noMedia = document.querySelector<HTMLElement>('#no-media');
    const isNoMediaVisible = !!(noMedia && !noMedia.classList.contains('hidden'));
    return body?.getAttribute('data-playlist-ready') === 'true' && (itemCount > 0 || isNoMediaVisible);
  }, { timeout: 30_000 });
}

async function selectCategory(page: Page, label: string): Promise<void> {
  await page.evaluate((targetLabel) => {
    const select = document.getElementById('target-category') as HTMLSelectElement | null;
    if (!select) {
      throw new Error('target-category not found');
    }
    const option = Array.from(select.options).find((item) => item.text.trim() === targetLabel);
    if (!option) {
      throw new Error(`target-category option not found: ${targetLabel}`);
    }
    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, label);
}

async function enableDarkMode(page: Page): Promise<void> {
  await page.evaluate(() => {
    const toggle = document.querySelector<HTMLInputElement>('#toggle-darkmode input[type="checkbox"]');
    if (!toggle) {
      throw new Error('darkmode toggle not found');
    }
    if (!toggle.checked) {
      toggle.checked = true;
      toggle.dispatchEvent(new Event('input', { bubbles: true }));
      toggle.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}

async function clickPlaylistItem(page: Page, text: string): Promise<void> {
  await page.waitForFunction((targetText) => {
    const items = Array.from(document.querySelectorAll<HTMLElement>('#playlist-list-group a[data-playlist-item]'));
    return items.some((item) => (item.textContent || '').includes(targetText));
  }, text);

  await page.evaluate((targetText) => {
    const items = Array.from(document.querySelectorAll<HTMLElement>('#playlist-list-group a[data-playlist-item]'));
    const target = items.find((item) => (item.textContent || '').includes(targetText));
    if (!target) {
      throw new Error(`playlist item not found: ${targetText}`);
    }
    target.click();
  }, text);
}

test.describe('SC-012 Local media playback', () => {
  test.beforeEach(async ({}, testInfo) => {
    fs.writeFileSync(
      getExamplePlaylistPath(testInfo.project.name),
      `${JSON.stringify(EXAMPLE_PLAYLIST_CONTENT, null, 2)}\n`,
      'utf8'
    );
  });

  test.afterEach(async ({}, testInfo) => {
    const playlistPath = getExamplePlaylistPath(testInfo.project.name);
    if (fs.existsSync(playlistPath)) {
      fs.unlinkSync(playlistPath);
    }
  });

  test('keeps custom HTML playlist labels constrained inside list items', async ({ ambientPage, page }, testInfo) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await selectPlaylist(page, getExamplePlaylistName(testInfo.project.name));
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

  test('creates a playable video source for local MP4 playlist items', async ({ ambientPage, page }, testInfo) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await selectPlaylist(page, getExamplePlaylistName(testInfo.project.name));
    await selectCategory(page, 'Local PC media');
    await clickPlaylistItem(page, 'テスト動画(mp4)');

    const player = page.locator('#html-player');
    await expect(player).toHaveJSProperty('tagName', 'VIDEO');
    await expect(page.locator('#html-player source')).toHaveAttribute('type', 'video/mp4');
    await expect(page.locator('#html-player source')).toHaveAttribute('src', /assets\/media\/test3\.mp4$/);
    await expect.poll(async () => {
      return player.evaluate((el) => (el as HTMLVideoElement).canPlayType('video/mp4'));
    }).not.toBe('');
  });

  test('fits local MP4 full-window video above the bottom menu band', async ({ ambientPage, page }, testInfo) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await selectPlaylist(page, getExamplePlaylistName(testInfo.project.name));
    await selectCategory(page, 'Local PC media');
    await clickPlaylistItem(page, 'テスト動画(mp4)');
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
    }, { timeout: 15_000 }).toBe(true);
  });

  test('creates a playable audio source for local MP3 playlist items', async ({ ambientPage, page }, testInfo) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await selectPlaylist(page, getExamplePlaylistName(testInfo.project.name));
    await selectCategory(page, 'Local PC media');
    await clickPlaylistItem(page, 'グランディアのテーマ(mp3)');

    const player = page.locator('#html-player');
    await expect(player).toHaveJSProperty('tagName', 'AUDIO');
    await expect(page.locator('#html-player source')).toHaveAttribute('type', 'audio/mpeg');
    await expect(page.locator('#html-player source')).toHaveAttribute('src', /assets\/media\/test\.mp3$/);
    await expect(player).toBeVisible();
    await expect.poll(async () => {
      return player.evaluate((el) => {
        const rect = (el as HTMLAudioElement).getBoundingClientRect();
        return rect.width >= 240 && rect.height >= 24;
      });
    }).toBe(true);
    await expect.poll(async () => {
      return player.evaluate((el) => (el as HTMLAudioElement).canPlayType('audio/mpeg'));
    }).not.toBe('');
  });

  test('keeps local MP3 audio controls visible in dark mode', async ({ ambientPage, page }, testInfo) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await selectPlaylist(page, getExamplePlaylistName(testInfo.project.name));
    await selectCategory(page, 'Local PC media');
    await enableDarkMode(page);
    await clickPlaylistItem(page, 'グランディアのテーマ(mp3)');

    const player = page.locator('#html-player');
    await expect(player).toHaveJSProperty('tagName', 'AUDIO');
    await expect(player).toHaveClass(/ambient-audio-player/);
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(player).toBeVisible();
    await expect.poll(async () => {
      return player.evaluate((el) => {
        const rect = (el as HTMLAudioElement).getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return rect.width >= 240 &&
          rect.height >= 24 &&
          style.colorScheme.includes('dark');
      });
    }).toBe(true);
  });
});
