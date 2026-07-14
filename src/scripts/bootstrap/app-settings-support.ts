import { createShuffledPlaylistItems } from '../state/playlist-mode-state';
import { isAmbientDarkModeEnabled } from './display-runtime';

export interface CreateAppSettingsSupportOptions {
  status: AMP_STATUS;
  defaultVolume: number;
  persistMyPlaylistIfNeeded(): void;
  normalizeVolume(value: unknown, fallback?: number): number;
  syncRangeProgress(range: HTMLInputElement | null, defaultVolume: number): void;
}

export interface AppSettingsSupport {
  shufflePlaylist(): MediaItem[];
  persistMyPlaylistIfNeeded(): void;
  normalizeVolume(value: unknown): number;
  syncRangeProgress(range: HTMLInputElement | null): void;
  isDarkModeEnabled(): boolean;
}

export function createAppSettingsSupport(
  options: CreateAppSettingsSupportOptions
): AppSettingsSupport {
  return {
    shufflePlaylist: () => createShuffledPlaylistItems({
      mediaItems: options.status.media,
      categoryId: options.status.ctg,
      shuffleEnabled: true,
    }),
    persistMyPlaylistIfNeeded: options.persistMyPlaylistIfNeeded,
    normalizeVolume: (value) => options.normalizeVolume(value, options.defaultVolume),
    syncRangeProgress: (range) => options.syncRangeProgress(range, options.defaultVolume),
    isDarkModeEnabled: () => isAmbientDarkModeEnabled({ playlistOptions: options.status.options }),
  };
}
