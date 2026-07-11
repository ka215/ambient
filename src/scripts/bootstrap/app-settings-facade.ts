import type { InitializeAppControlsRuntimeOptions } from './app-controls-runtime-init';

export interface CreateAmbientAppSettingsFacadeOptions {
  status: {
    ctg: number | null;
    playlist?: string | null;
    options: Record<string, unknown>;
  };
  loopToggleRoot: HTMLElement | null;
  randomlyToggleRoot: HTMLElement | null;
  shuffleToggleRoot: HTMLElement | null;
  seekToggleRoot: HTMLElement | null;
  faderToggleRoot: HTMLElement | null;
  darkModeToggleRoot: HTMLElement | null;
  volumeRange: HTMLInputElement | null;
  shufflePlaylist(): InitializeAppControlsRuntimeOptions['settings']['shufflePlaylist'] extends () => infer TResult ? TResult : never;
  persistMyPlaylistIfNeeded(): void;
  normalizeVolume(value: unknown): number;
  syncRangeProgress(range: HTMLInputElement | null): void;
  isDarkModeEnabled(): boolean;
  setStyles(targetElements: HTMLElement | HTMLElement[], styles?: string | Record<string, string>): void;
}

export function createAmbientAppSettingsFacade(
  options: CreateAmbientAppSettingsFacadeOptions
): Pick<InitializeAppControlsRuntimeOptions, 'settingsControlRoots' | 'settings' | 'getCurrentPlaylist' | 'getCurrentCategoryId'> {
  return {
    settingsControlRoots: {
      loop: options.loopToggleRoot,
      randomly: options.randomlyToggleRoot,
      shuffle: options.shuffleToggleRoot,
      seekplay: options.seekToggleRoot,
      fader: options.faderToggleRoot,
      darkmode: options.darkModeToggleRoot,
    },
    settings: {
      volumeRange: options.volumeRange,
      shufflePlaylist: options.shufflePlaylist,
      persistMyPlaylistIfNeeded: options.persistMyPlaylistIfNeeded,
      normalizeVolume: options.normalizeVolume,
      syncRangeProgress: options.syncRangeProgress,
      isDarkModeEnabled: options.isDarkModeEnabled,
      setStyles: options.setStyles,
    },
    getCurrentPlaylist: () => (
      Object.prototype.hasOwnProperty.call(options.status, 'playlist') ? options.status.playlist ?? null : null
    ),
    getCurrentCategoryId: () => (
      Object.prototype.hasOwnProperty.call(options.status, 'ctg') && options.status.ctg !== null ? options.status.ctg : null
    ),
  };
}
