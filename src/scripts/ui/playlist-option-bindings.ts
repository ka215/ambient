import type { MediaItem } from '../types/ambient';
import { resolvePlaylistOptionState } from '../state/playlist-options';
import {
  applyResolvedPlaylistOptions,
  syncToggleRoot,
  syncVolumeSlider,
  updateNoMediaImagesForTheme,
} from './settings-view';

export function applyAmbientPlaylistOptions(options: {
  status: {
    order: 'random' | 'normal';
    shuffle?: MediaItem[] | null;
    volume: number | null;
    options: Record<string, unknown> | null;
  };
  getOption<TKey extends string>(key: TKey): unknown;
  defaultVolume: number;
  body: HTMLElement;
  menu: HTMLElement | null;
  imageDir: string | null | undefined;
  shuffleToggleRoot: ParentNode | null;
  seekToggleRoot: ParentNode | null;
  faderToggleRoot: ParentNode | null;
  darkModeToggleInput: HTMLInputElement | null;
  volumeRange: HTMLInputElement | null;
  defaultVolumeDisplay: HTMLElement | null;
  normalizeVolume(value: unknown, fallback?: number): number;
  syncRangeProgress(range: HTMLInputElement | null): void;
  syncMediaVolumeField(): void;
  shufflePlaylist(): MediaItem[];
  isDarkModeEnabled(): boolean;
  setStyles(targetElements: HTMLElement | HTMLElement[], styles?: string | Record<string, string>): void;
  setFullWindowMode(enabled: boolean, syncOption?: boolean, closeDrawers?: boolean): void;
}): void {
  const optionState = resolvePlaylistOptionState({
    getOption: options.getOption,
    defaultVolume: options.defaultVolume,
  });

  applyResolvedPlaylistOptions({
    optionState,
    body: options.body,
    menu: options.menu,
    imageDir: options.imageDir,
    syncRandomOrder: (enabled) => {
      options.status.order = enabled ? 'random' : 'normal';
    },
    syncShuffle: () => {
      options.status.shuffle = [];
      syncToggleRoot(options.shuffleToggleRoot, !!(options.status.options && options.status.options.shuffle));
      options.status.shuffle = options.shufflePlaylist();
    },
    syncSeek: (enabled) => {
      syncToggleRoot(options.seekToggleRoot, enabled);
    },
    syncFader: (enabled) => {
      syncToggleRoot(options.faderToggleRoot, enabled);
    },
    applyVolume: (volume) => {
      options.status.volume = volume;
      if (options.volumeRange) {
        syncVolumeSlider({
          input: options.volumeRange,
          volume: options.normalizeVolume(options.status.volume, options.defaultVolume),
          syncRangeProgress: (range) => {
            if (range) {
              options.syncRangeProgress(range);
            }
          },
          display: options.defaultVolumeDisplay,
        });
      }
      options.syncMediaVolumeField();
    },
    applyDarkModeFlag: (enabled) => {
      if (options.status.options) {
        options.status.options.dark = enabled;
      }
    },
    darkModeEnabled: () => options.isDarkModeEnabled(),
    toggleInput: options.darkModeToggleInput,
    updateNoMediaImagesForTheme: () => updateNoMediaImagesForTheme(options.isDarkModeEnabled()),
    setStyles: options.setStyles,
    applyFullWindowMode: (enabled) => {
      options.setFullWindowMode(enabled, false);
    },
  });
}
