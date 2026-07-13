import type { MediaItem } from '../types/ambient';

export interface CreateAppSettingsHelpersOptions {
  shufflePlaylist(): MediaItem[];
  persistMyPlaylistIfNeeded(): void;
  normalizeVolume(value: unknown): number;
  syncRangeProgress(range: HTMLInputElement | null): void;
  isDarkModeEnabled(): boolean;
}

export interface AppSettingsHelpers {
  shufflePlaylist(): MediaItem[];
  persistMyPlaylistIfNeeded(): void;
  normalizeVolume(value: unknown): number;
  syncRangeProgress(range: HTMLInputElement | null): void;
  isDarkModeEnabled(): boolean;
}

export function createAppSettingsHelpers(
  options: CreateAppSettingsHelpersOptions
): AppSettingsHelpers {
  return {
    shufflePlaylist: options.shufflePlaylist,
    persistMyPlaylistIfNeeded: options.persistMyPlaylistIfNeeded,
    normalizeVolume: options.normalizeVolume,
    syncRangeProgress: options.syncRangeProgress,
    isDarkModeEnabled: options.isDarkModeEnabled,
  };
}
