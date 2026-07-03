import { getAmbientData } from '../platform/ambient-data';
import { getLocalItem, MYPLAYLIST_KEY, setLocalItem } from '../platform/storage';
import { isObject } from '../shared/validation';
import type { MediaItem } from '../types/ambient';

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
  options: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!isObject(options)) {
    return null;
  }
  const nextOptions = { ...options } as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(nextOptions, 'playlist')) {
    delete nextOptions.playlist;
  }
  return nextOptions;
}

function convertPlaylistTimeValue(value: string | number | undefined): string | number | undefined {
  if (value === '' || value === undefined || Number(value) === 0) {
    return '';
  }

  const totalSeconds = Number(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }
  if (minutes > 0) {
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  }
  if (remainingSeconds > 0) {
    return String(remainingSeconds);
  }
  return '';
}

export function buildPlaylistJson(options: {
  mediaItems: MediaItem[];
  categories: string[];
  playlistOptions: Record<string, unknown> | null | undefined;
  seekFormat: boolean;
}): string {
  const playlistData: Record<string, unknown> = {};

  options.mediaItems.forEach((item) => {
    const categoryName = options.categories[item.catId] || '';
    const serializedItem = {
      file: (item.file || '').replace('./assets/media/', ''),
      title: item.title,
      desc: item.desc,
      artist: item.artist,
      videoid: item.videoid,
      image: item.image,
      start: options.seekFormat ? convertPlaylistTimeValue(item.start) : item.start,
      end: options.seekFormat ? convertPlaylistTimeValue(item.end) : item.end,
    };

    if (!Object.prototype.hasOwnProperty.call(playlistData, categoryName)) {
      playlistData[categoryName] = [];
    }
    (playlistData[categoryName] as unknown[]).push(serializedItem);
  });

  playlistData.options = sanitizeMyPlaylistOptions(options.playlistOptions);
  return JSON.stringify(playlistData, null, 2);
}
