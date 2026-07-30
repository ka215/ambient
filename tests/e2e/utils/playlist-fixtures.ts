import { copyFileSync, existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';

export const E2E_PLAYLIST_NAME = 'playlist-for-e2e.json';

const PLAYLIST_FIXTURE = path.resolve(process.cwd(), `tests/e2e/fixtures/${E2E_PLAYLIST_NAME}`);
export const E2E_PLAYLIST_ASSET_PATH = path.resolve(process.cwd(), `assets/${E2E_PLAYLIST_NAME}`);

export function installE2ePlaylistFixture(): void {
  copyFileSync(PLAYLIST_FIXTURE, E2E_PLAYLIST_ASSET_PATH);
}

export function removeE2ePlaylistFixture(): void {
  if (existsSync(E2E_PLAYLIST_ASSET_PATH)) {
    unlinkSync(E2E_PLAYLIST_ASSET_PATH);
  }
}
