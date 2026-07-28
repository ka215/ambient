import { copyFileSync, existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';

export const E2E_PLAYLIST_NAME = 'playlist-for-e2e.json';

const PLAYLIST_FIXTURE = path.resolve(process.cwd(), `tests/e2e/fixtures/${E2E_PLAYLIST_NAME}`);
const PLAYLIST_ASSET = path.resolve(process.cwd(), `assets/${E2E_PLAYLIST_NAME}`);

export function installE2ePlaylistFixture(): void {
  copyFileSync(PLAYLIST_FIXTURE, PLAYLIST_ASSET);
}

export function removeE2ePlaylistFixture(): void {
  if (existsSync(PLAYLIST_ASSET)) {
    unlinkSync(PLAYLIST_ASSET);
  }
}
