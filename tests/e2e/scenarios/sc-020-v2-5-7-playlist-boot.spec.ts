import fs from 'fs';
import path from 'path';

import { request as playwrightRequest } from '@playwright/test';

import { expect, test } from '../fixtures/ambient-page.fixture';

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, 'assets');
const PLAYLIST = path.join(ASSETS_DIR, 'PlayList.json');
const BACKUP_DIR = path.join(ASSETS_DIR, '.sc020-playlist-backup');
const LOCAL_BASE_URL_PATTERN = /(?:localhost|127\.0\.0\.1|dev2\.ka2\.org|dev-amp\.ka2\.org)/i;

function baseURL(): string {
  return process.env.E2E_BASE_URL || 'https://dev-amp.ka2.org/amp/';
}

function skipUnlessLocalBaseURL(): void {
  test.skip(
    !LOCAL_BASE_URL_PATTERN.test(baseURL()),
    'SC-020 manipulates local workspace assets and requires a local E2E_BASE_URL.'
  );
}

function isPlaylistJson(filename: string): boolean {
  return /\.json$/i.test(filename) && !/^lang(?:-.*)?\.json$/i.test(filename);
}

function playlistURL(filename: string): string {
  return new URL(`playlist/${filename}`, baseURL()).toString();
}

function backupPlaylistFixtures(): void {
  if (fs.existsSync(BACKUP_DIR)) {
    throw new Error('SC-020 backup directory already exists.');
  }
  fs.mkdirSync(BACKUP_DIR);
  for (const filename of fs.readdirSync(ASSETS_DIR)) {
    if (isPlaylistJson(filename)) {
      fs.renameSync(path.join(ASSETS_DIR, filename), path.join(BACKUP_DIR, filename));
    }
  }
}

function restorePlaylistFixtures(): void {
  for (const filename of fs.readdirSync(ASSETS_DIR)) {
    if (isPlaylistJson(filename)) {
      fs.unlinkSync(path.join(ASSETS_DIR, filename));
    }
  }
  if (!fs.existsSync(BACKUP_DIR)) {
    return;
  }
  for (const filename of fs.readdirSync(BACKUP_DIR)) {
    fs.renameSync(path.join(BACKUP_DIR, filename), path.join(ASSETS_DIR, filename));
  }
  fs.rmdirSync(BACKUP_DIR);
}

test.describe('SC-020 v2.5.7 playlist boot regressions', () => {
  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== 'chromium', 'Playlist boot regressions are validated on chromium only.');
    skipUnlessLocalBaseURL();
    backupPlaylistFixtures();
  });

  test.afterEach(() => {
    restorePlaylistFixtures();
  });

  test('local mode creates PlayList.json and publishes it when no playlist JSON exists', async () => {
    const requestContext = await playwrightRequest.newContext({ ignoreHTTPSErrors: true });
    const response = await requestContext.get(baseURL());
    expect(response.ok()).toBeTruthy();
    const html = await response.text();

    expect(fs.existsSync(PLAYLIST)).toBeTruthy();
    expect(html).toContain('"playlists":{"PlayList.json"');
    expect(html).toContain('"currentPlaylist":"PlayList.json"');
    await requestContext.dispose();
  });

  test('returns a safe empty playlist response for a single empty JSON file', async () => {
    fs.writeFileSync(PLAYLIST, '');

    const requestContext = await playwrightRequest.newContext({ ignoreHTTPSErrors: true });
    const response = await requestContext.get(baseURL());
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toContain('"playlists":{"PlayList.json"');
    expect(html).toContain('"currentPlaylist":"PlayList.json"');

    const playlistResponse = await requestContext.get(playlistURL('PlayList.json'));
    expect(playlistResponse.ok()).toBeTruthy();
    expect(playlistResponse.headers()['content-type']).toContain('application/json');
    const playlistPayload = await playlistResponse.json();
    expect(playlistPayload.state).toBe('ok');
    expect(playlistPayload.data.media).toEqual([]);
    await requestContext.dispose();
  });

  test('returns media for a single valid playlist JSON file', async () => {
    fs.writeFileSync(PLAYLIST, JSON.stringify({
      Demo: [
        {
          title: 'SC-020 Demo',
          videoid: 'dQw4w9WgXcQ',
        },
      ],
      options: {},
    }, null, 2));

    const requestContext = await playwrightRequest.newContext({ ignoreHTTPSErrors: true });
    const response = await requestContext.get(baseURL());
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toContain('"playlists":{"PlayList.json"');
    expect(html).toContain('"currentPlaylist":"PlayList.json"');

    const playlistResponse = await requestContext.get(playlistURL('PlayList.json'));
    expect(playlistResponse.ok()).toBeTruthy();
    expect(playlistResponse.headers()['content-type']).toContain('application/json');
    const playlistPayload = await playlistResponse.json();
    expect(playlistPayload.state).toBe('ok');
    expect(playlistPayload.data.media.Demo).toHaveLength(1);
    expect(playlistPayload.data.media.Demo[0].title).toBe('SC-020 Demo');
    await requestContext.dispose();
  });
});
