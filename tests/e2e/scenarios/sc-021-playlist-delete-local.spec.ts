import fs from 'fs';
import path from 'path';

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures/ambient-page.fixture';

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, 'assets');
const PLAYLIST = path.join(ASSETS_DIR, 'PlayList.json');
const BACKUP = path.join(ASSETS_DIR, '.sc021-PlayList.json.bak');

function writeSeedPlaylist(): void {
  fs.writeFileSync(PLAYLIST, JSON.stringify({
    E2E: [
      { title: 'delete-local-1', videoid: 'dQw4w9WgXcQ', artist: 'E2E Artist' },
      { title: 'delete-local-2', videoid: 'gu7T0D50wFk', artist: 'E2E Artist' },
      { title: 'delete-local-3', videoid: '3JZ_D3ELwOQ', artist: 'E2E Artist' },
    ],
    options: {
      dark: false,
      seek: false,
      shuffle: false,
      fader: false,
      volume: 50,
    },
  }, null, 2));
}

function backupPlaylist(): void {
  if (fs.existsSync(BACKUP)) {
    throw new Error('SC-021 backup file already exists.');
  }
  if (fs.existsSync(PLAYLIST)) {
    fs.renameSync(PLAYLIST, BACKUP);
  }
}

function restorePlaylist(): void {
  if (fs.existsSync(PLAYLIST)) {
    fs.unlinkSync(PLAYLIST);
  }
  if (fs.existsSync(BACKUP)) {
    fs.renameSync(BACKUP, PLAYLIST);
  }
}

async function selectDeleteMode(page: Page): Promise<void> {
  await page.locator('#btn-playlist-mode').click();
  await expect(page.locator('#playlist-mode-menu')).toBeVisible();
  await page.locator('#playlist-mode-menu .playlist-mode-option[data-mode="delete"]').click();
}

test.describe('SC-021 playlist delete local persistence', () => {
  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== 'chromium', 'Local playlist delete persistence is validated on chromium only.');
    backupPlaylist();
    writeSeedPlaylist();
  });

  test.afterEach(() => {
    restorePlaylist();
  });

  test('removes selected items from local playlist JSON and shows a success toast', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.waitForPlaylistReady();
    await ambientPage.openPlaylistDrawer();

    await expect(page.locator('#playlist-list-group a[data-playlist-item]')).toHaveCount(3);
    await selectDeleteMode(page);

    const items = page.locator('#playlist-list-group a[data-playlist-item]');
    await items.nth(0).click();
    await items.nth(1).click();

    await page.locator('#btn-playlist-mode').click();
    await expect(page.locator('#modal-playlist-confirm')).toBeVisible();
    await page.locator('#btn-playlist-confirm-apply').click();

    await expect(page.locator('#playlist-list-group a[data-playlist-item]')).toHaveCount(1);
    await expect(page.locator('#alert-notification')).toContainClass('bg-green-50');

    await expect.poll(() => {
      const raw = fs.readFileSync(PLAYLIST, 'utf8');
      return raw.includes('delete-local-3') && !raw.includes('delete-local-1') && !raw.includes('delete-local-2');
    }).toBe(true);
  });
});
