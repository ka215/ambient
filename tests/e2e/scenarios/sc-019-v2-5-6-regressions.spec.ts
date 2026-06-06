import fs from 'fs';
import path from 'path';

import { request as playwrightRequest } from '@playwright/test';

import { expect, test } from '../fixtures/ambient-page.fixture';

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, 'assets');
const PLAYLIST = path.join(ROOT, 'assets', 'PlayList.json');
const EXAMPLE_PLAYLIST = path.join(ROOT, 'assets', 'Example-Playlist.json');
const BACKUP_DIR = path.join(ROOT, 'assets', '.sc019-playlist-backup');
const LOCAL_BASE_URL_PATTERN = /(?:localhost|127\.0\.0\.1|dev2\.ka2\.org|dev-amp\.ka2\.org)/i;

function baseURL(): string {
  return process.env.E2E_BASE_URL || 'https://dev-amp.ka2.org/';
}

function skipUnlessLocalBaseURL(): void {
  test.skip(
    !LOCAL_BASE_URL_PATTERN.test(baseURL()),
    'SC-019 manipulates local workspace assets and requires a local E2E_BASE_URL.'
  );
}

function isPlaylistJson(filename: string): boolean {
  return /\.json$/i.test(filename) && !/^lang(?:-.*)?\.json$/i.test(filename);
}

function restorePlaylistFixtures(): void {
  if (fs.existsSync(EXAMPLE_PLAYLIST)) {
    fs.unlinkSync(EXAMPLE_PLAYLIST);
  }
  if (!fs.existsSync(BACKUP_DIR)) {
    return;
  }
  for (const filename of fs.readdirSync(BACKUP_DIR)) {
    fs.renameSync(path.join(BACKUP_DIR, filename), path.join(ASSETS_DIR, filename));
  }
  fs.rmdirSync(BACKUP_DIR);
}

test.describe('SC-019 v2.5.6 release regressions', () => {
  test('publishes Example-Playlist.json as the boot playlist when PlayList.json is absent', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chrome', 'Workspace asset regression is validated on chromium only.');
    skipUnlessLocalBaseURL();
    test.skip(!fs.existsSync(PLAYLIST), 'PlayList.json fixture is required to build the Example-Playlist fixture.');
    test.skip(fs.existsSync(BACKUP_DIR), 'SC-019 backup directory already exists.');

    try {
      fs.mkdirSync(BACKUP_DIR);
      for (const filename of fs.readdirSync(ASSETS_DIR)) {
        if (isPlaylistJson(filename)) {
          fs.renameSync(path.join(ASSETS_DIR, filename), path.join(BACKUP_DIR, filename));
        }
      }
      fs.copyFileSync(path.join(BACKUP_DIR, 'PlayList.json'), EXAMPLE_PLAYLIST);

      const requestContext = await playwrightRequest.newContext({ ignoreHTTPSErrors: true });
      const response = await requestContext.get(baseURL());
      expect(response.ok()).toBeTruthy();
      const html = await response.text();
      await requestContext.dispose();

      expect(html).toContain('"playlists":{"Example-Playlist.json"');
      expect(html).toContain('"currentPlaylist":"Example-Playlist.json"');
      expect(html).not.toContain('value="PlayList.json"');
    } finally {
      restorePlaylistFixtures();
    }
  });

  test('renders media management cloud helper in Japanese', async ({ ambientPage, page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chrome', 'Japanese UI smoke is validated on chromium only.');

    await page.context().addCookies([
      {
        name: 'lang',
        value: 'ja',
        url: baseURL(),
      },
    ]);

    await page.addInitScript(() => {
      localStorage.clear();
    });

    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.waitForPlaylistReady();

    const isCloud = await page.evaluate(() => Boolean((window as any).AmbientData?.isCloud));
    test.skip(!isCloud, 'Japanese cloud helper copy is only rendered in cloud mode.');

    await page.locator('#btn-options').click();
    await page.locator('#collapse-item-heading-media button').click();
    await expect(page.locator('#collapse-item-body-media')).not.toHaveClass(/hidden/);
    await expect(page.locator('#collapse-item-body-media')).toContainText(
      '追加したメディアは、ブラウザのローカルストレージに保存される MyPlaylist に保存され、Ambient にアクセスすると自動的に読み込まれます。'
    );
    await expect(page.locator('#collapse-item-body-media')).not.toContainText('Added media is saved to MyPlaylist');
  });
});
