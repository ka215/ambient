import type { MediaItem } from '../types/ambient';

export interface CreateAppSettingsHelpersOptions {
  shufflePlaylist(): MediaItem[];
  persistCurrentPlaylistSettings(): void;
  normalizeVolume(value: unknown): number;
  syncRangeProgress(range: HTMLInputElement | null): void;
  isDarkModeEnabled(): boolean;
}

export interface AppSettingsHelpers {
  shufflePlaylist(): MediaItem[];
  persistCurrentPlaylistSettings(): void;
  normalizeVolume(value: unknown): number;
  syncRangeProgress(range: HTMLInputElement | null): void;
  isDarkModeEnabled(): boolean;
}

export function createAppSettingsHelpers(
  options: CreateAppSettingsHelpersOptions
): AppSettingsHelpers {
  return {
    shufflePlaylist: options.shufflePlaylist,
    persistCurrentPlaylistSettings: options.persistCurrentPlaylistSettings,
    normalizeVolume: options.normalizeVolume,
    syncRangeProgress: options.syncRangeProgress,
    isDarkModeEnabled: options.isDarkModeEnabled,
  };
}
