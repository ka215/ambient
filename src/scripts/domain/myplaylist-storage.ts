import { getAmbientData } from '../platform/ambient-data';
import { getLocalItem, MYPLAYLIST_KEY, setLocalItem } from '../platform/storage';
import { isObject } from '../shared/validation';

export const MYPLAYLIST_NAME = 'MyPlaylist.json';

export type DomainLogger = (...args: unknown[]) => void;

export function buildEmptyMyPlaylistSeed(): string {
  const payload: Record<string, unknown> = {
    options: {},
  };
  return JSON.stringify(payload, null, 2);
}

export function hasStoredMyPlaylist(): boolean {
  return getLocalItem(MYPLAYLIST_KEY) !== null;
}

export function readMyPlaylistJson(): string | null {
  return getLocalItem(MYPLAYLIST_KEY);
}

export function writeMyPlaylistJson(json: string): void {
  setLocalItem(MYPLAYLIST_KEY, json);
}

export function ensureCloudMyPlaylistSeed(logger: DomainLogger): boolean {
  const ambientData = getAmbientData();
  if (!ambientData?.isCloud) {
    return false;
  }
  if (hasStoredMyPlaylist()) {
    return false;
  }
  try {
    writeMyPlaylistJson(buildEmptyMyPlaylistSeed());
    logger('ensureCloudMyPlaylistSeed: initialized empty MyPlaylist');
    return true;
  } catch (error) {
    logger('ensureCloudMyPlaylistSeed: failed to initialize', error);
    return false;
  }
}

export function sanitizeMyPlaylistOptions(
  options: PlaylistOptions | null | undefined
): PlaylistOptions | null {
  if (!isObject(options)) {
    return null;
  }
  const nextOptions = { ...options } as PlaylistOptions;
  if (Object.prototype.hasOwnProperty.call(nextOptions, 'playlist')) {
    delete nextOptions.playlist;
  }
  return nextOptions;
}
