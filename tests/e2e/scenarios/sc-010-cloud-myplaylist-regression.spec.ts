import { Page, expect } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';

const MYPLAYLIST_NAME = 'MyPlaylist.json';

function buildMyPlaylist(categories: Record<string, Array<{ title: string; videoid: string; artist?: string; desc?: string }>>) {
  const playlist: Record<string, unknown> = {};
  Object.entries(categories).forEach(([category, items]) => {
    playlist[category] = items.map((item) => ({
      title: item.title,
      videoid: item.videoid,
      artist: item.artist || 'E2E Artist',
      desc: item.desc || '',
      start: '',
      end: '',
    }));
  });
  playlist.options = {
    dark: false,
    seek: false,
    shuffle: false,
    fader: false,
    volume: 50,
  };
  return playlist;
}

async function seedMyPlaylist(page: Page, playlist: Record<string, unknown> | null): Promise<void> {
  const payload = playlist ? JSON.stringify(playlist) : null;
  await page.addInitScript((playlistJson) => {
    localStorage.clear();
    if (playlistJson) {
      localStorage.setItem('AmbientMyPlaylist', playlistJson);
    }
  }, payload);
}

async function openManagementSection(
  page: Page,
  headingBtnSel: string,
  bodyId: string
): Promise<void> {
  const modalOpen = await page.evaluate(() => {
    const el = document.getElementById('modal-options');
    return el ? !el.classList.contains('hidden') : false;
  });
  if (!modalOpen) {
    await page.evaluate(() => {
      const btn = document.querySelector<HTMLElement>('#btn-options');
      if (btn) btn.click();
    });
    await page.waitForFunction(() => {
      const el = document.getElementById('modal-options');
      return el ? !el.classList.contains('hidden') : false;
    }, { timeout: 8_000 });
  }

  const alreadyOpen = await page.evaluate((bId: string) => {
    const el = document.getElementById(bId);
    return el ? !el.classList.contains('hidden') : false;
  }, bodyId);

  if (!alreadyOpen) {
    await page.evaluate((sel: string) => {
      const btn = document.querySelector<HTMLElement>(sel);
      if (btn) btn.click();
    }, headingBtnSel);

    await page.waitForFunction((bId: string) => {
      const el = document.getElementById(bId);
      return el ? !el.classList.contains('hidden') : false;
    }, bodyId, { timeout: 8_000 });
  }
}

test.describe('SC-010 Cloud MyPlaylist regressions', () => {
  test.beforeEach(async ({ browserName, page }) => {
    test.skip(browserName !== 'chromium', 'Cloud MyPlaylist regressions are validated on chromium only.');
    await seedMyPlaylist(page, null);
  });

  test('creates MyPlaylist from drawer entry point and persists immediately', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.waitForPlaylistReady();

    await expect.poll(async () => page.evaluate(() => !!(window as any).AmbientData?.isCloud)).toBe(true);

    await ambientPage.openPlaylistDrawer();
    await expect(page.locator('#no-media')).toBeVisible();
    await expect(page.locator('#btn-add-media-from-drawer')).toBeVisible();

    await page.locator('#btn-add-media-from-drawer').click();

    const isNarrowViewport = (page.viewportSize()?.width ?? 1400) < 1282;
    if (isNarrowViewport) {
      await expect(page.locator('#drawer-playlist')).toHaveClass(/-translate-x-full/);
    } else {
      await expect(page.locator('#drawer-playlist')).not.toHaveClass(/-translate-x-full/);
    }
    await expect(page.locator('#modal-options')).toBeVisible();
    await expect(page.locator('#media-category-new')).toBeVisible();
    await expect(page.locator('#media-category')).toBeHidden();
    await expect(page.locator('#media-category-new')).toHaveValue(/新しいカテゴリー|New Category/);

    await openManagementSection(page, '#collapse-item-heading-media button', 'collapse-item-body-media');

    await page.evaluate(() => {
      const url = document.getElementById('youtube-url') as HTMLInputElement | null;
      const category = document.getElementById('media-category-new') as HTMLInputElement | null;
      const title = document.getElementById('media-title') as HTMLInputElement | null;
      if (url) {
        url.value = 'https://music.youtube.com/watch?v=dQw4w9WgXcQ';
        url.dispatchEvent(new Event('input', { bubbles: true }));
        url.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (category) {
        category.dispatchEvent(new Event('input', { bubbles: true }));
        category.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (title) {
        title.value = 'e2e-myplaylist-first-item';
        title.dispatchEvent(new Event('input', { bubbles: true }));
        title.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await expect(page.locator('#youtube-videoid')).toHaveValue('dQw4w9WgXcQ');
    await expect(page.locator('#btn-add-media')).toBeEnabled();
    await page.locator('#btn-add-media').click();

    await expect(page.locator('#modal-options')).toBeHidden();
    await expect(page.locator('div[modal-backdrop]')).toHaveCount(0);
    await expect(page.locator('#alert-notification')).toContainClass('bg-green-50');
    await expect(page.locator('#alert-message')).not.toBeEmpty();

    await ambientPage.openSettingsDrawer();
    await expect(page.locator('#current-playlist')).toHaveValue(MYPLAYLIST_NAME);
    await ambientPage.closeSettingsDrawer();

    await ambientPage.openPlaylistDrawer();
    await expect(page.locator('#playlist-list-group a[data-playlist-item]')).toHaveCount(1);

    await expect.poll(async () => page.evaluate(() => {
      const raw = localStorage.getItem('AmbientMyPlaylist');
      return raw ? raw.includes('e2e-myplaylist-first-item') : false;
    })).toBe(true);
  });

  test('restores MyPlaylist from localStorage without duplicate target categories after reload', async ({ ambientPage, page }) => {
    await seedMyPlaylist(page, buildMyPlaylist({
      Alpha: [
        { title: 'alpha-1', videoid: 'dQw4w9WgXcQ' },
        { title: 'alpha-2', videoid: 'gu7T0D50wFk' },
      ],
      Beta: [
        { title: 'beta-1', videoid: '3JZ_D3ELwOQ' },
      ],
    }));

    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.waitForPlaylistReady();

    await ambientPage.openSettingsDrawer();
    await expect(page.locator('#current-playlist')).toHaveValue(MYPLAYLIST_NAME);
    const optionTextsBefore = await page.locator('#target-category option').allTextContents();
    expect(optionTextsBefore.map((v) => v.trim())).toEqual(['All categories', 'Alpha', 'Beta']);
    await ambientPage.closeSettingsDrawer();

    await page.reload();
    await ambientPage.waitForBaseUi();
    await ambientPage.waitForPlaylistReady();

    await ambientPage.openSettingsDrawer();
    const optionTextsAfter = await page.locator('#target-category option').allTextContents();
    expect(optionTextsAfter.map((v) => v.trim())).toEqual(['All categories', 'Alpha', 'Beta']);
  });

  test('uses playlist option volume for settings and media management defaults', async ({ ambientPage, page }) => {
    const playlist = buildMyPlaylist({
      E2E: [{ title: 'volume-default', videoid: 'dQw4w9WgXcQ' }],
    });
    (playlist.options as Record<string, unknown>).volume = 35;
    await seedMyPlaylist(page, playlist);

    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.openSettingsDrawer();

    await expect(page.locator('#default-volume')).toHaveValue('35');
    await expect(page.locator('#default-volume-value')).toHaveText('35');

    await ambientPage.closeSettingsDrawer();
    await openManagementSection(page, '#collapse-item-heading-media button', 'collapse-item-body-media');

    await expect(page.locator('#media-volume')).toHaveValue('35');
    await expect(page.locator('#default-media-volume')).toHaveText('35');
  });

  test('falls back to volume 50 when playlist option volume is undefined', async ({ ambientPage, page }) => {
    const playlist = buildMyPlaylist({
      E2E: [{ title: 'volume-fallback', videoid: 'dQw4w9WgXcQ' }],
    });
    delete (playlist.options as Record<string, unknown>).volume;
    await seedMyPlaylist(page, playlist);

    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.openSettingsDrawer();

    await expect(page.locator('#default-volume')).toHaveValue('50');
    await expect(page.locator('#default-volume-value')).toHaveText('50');

    await ambientPage.closeSettingsDrawer();
    await openManagementSection(page, '#collapse-item-heading-media button', 'collapse-item-body-media');

    await expect(page.locator('#media-volume')).toHaveValue('50');
    await expect(page.locator('#default-media-volume')).toHaveText('50');
  });

  test('switches away from MyPlaylist and back without losing items or disabling target category', async ({ ambientPage, page }) => {
    await seedMyPlaylist(page, buildMyPlaylist({
      Replay: [
        { title: 'replay-1', videoid: 'dQw4w9WgXcQ' },
        { title: 'replay-2', videoid: 'gu7T0D50wFk' },
      ],
    }));

    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.waitForPlaylistReady();

    await ambientPage.openSettingsDrawer();
    await expect(page.locator('#current-playlist')).toHaveValue(MYPLAYLIST_NAME);
    await page.locator('#current-playlist').selectOption('mememori-youtube.json');
    await page.waitForFunction(() => document.querySelectorAll('#playlist-list-group a[data-playlist-item]').length > 0);
    await ambientPage.closeSettingsDrawer();

    await ambientPage.openSettingsDrawer();
    await page.locator('#current-playlist').selectOption(MYPLAYLIST_NAME);
    await page.waitForFunction(() => document.querySelectorAll('#playlist-list-group a[data-playlist-item]').length === 2);
    await expect(page.locator('#target-category')).toBeEnabled();
    await expect(page.locator('#target-category option')).toHaveCount(2);
    await expect(page.locator('#target-category option').nth(1)).toHaveText('Replay');
    await ambientPage.closeSettingsDrawer();

    await ambientPage.openPlaylistDrawer();
    await expect(page.locator('#playlist-list-group a[data-playlist-item]')).toHaveCount(2);
  });

  test('wraps carousel navigation from last item to first and remains responsive on subsequent next clicks', async ({ ambientPage, page }) => {
    await seedMyPlaylist(page, buildMyPlaylist({
      Looping: [
        { title: 'loop-1', videoid: 'dQw4w9WgXcQ' },
        { title: 'loop-2', videoid: 'gu7T0D50wFk' },
        { title: 'loop-3', videoid: '3JZ_D3ELwOQ' },
      ],
    }));

    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.waitForPlaylistReady();

    await ambientPage.openPlaylistDrawer();
    await page.locator('#playlist-list-group a[data-playlist-item]').nth(2).click();
    await expect(page.locator('#playlist-list-group a[aria-current="true"]')).toHaveAttribute('data-playlist-item', '2');

    await page.locator('#data-carousel-next').click();
    await expect(page.locator('#playlist-list-group a[aria-current="true"]')).toHaveAttribute('data-playlist-item', '0');

    await page.locator('#data-carousel-next').click();
    await expect(page.locator('#playlist-list-group a[aria-current="true"]')).toHaveAttribute('data-playlist-item', '1');
  });
});
