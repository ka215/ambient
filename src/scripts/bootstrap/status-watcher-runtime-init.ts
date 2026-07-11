import type { PlaylistOptions } from '../types/ambient';
import {
  syncVolumeSlider,
  syncToggleRoot,
} from '../ui/settings-view';
import {
  resolveAmbientDefaultVolume,
  normalizeAmbientVolume,
  syncAmbientRangeProgress,
  syncAmbientResolvedMediaVolumeField,
} from '../ui/forms/category-volume-bindings';
import { createShuffledPlaylistItems } from '../state/playlist-mode-state';
import { applyAmbientDisplayOptions } from './display-runtime';
import { initializeStatusWatcher } from './status-watcher-init';

export interface InitializeStatusWatcherRuntimeOptions {
  document: Document;
  windowObject: Window & typeof globalThis;
  status: Record<string, unknown> & {
    current?: number | null;
    order?: string | null;
    media?: unknown[] | null;
    category?: string[] | null;
    ctg?: number | null;
    volume?: number | null;
    options?: Record<string, unknown>;
    shuffle?: unknown[] | null;
  };
  runtimeLogger(...args: unknown[]): void;
  saveStorageAdapter(prop: string, value: unknown, logger: (...args: unknown[]) => void): void;
  savePlaylistContext(): void;
  listElement: HTMLElement;
  randomToggleRoot: HTMLElement | null;
  shuffleToggleRoot: HTMLElement | null;
  seekToggleRoot: HTMLElement | null;
  faderToggleRoot: HTMLElement | null;
  darkModeToggleRoot: HTMLElement | null;
  playButton: HTMLButtonElement | null;
  pauseButton: HTMLButtonElement | null;
  body: HTMLElement;
  menu: HTMLElement;
  volumeRange: HTMLInputElement | null;
  mediaVolumeInput: HTMLInputElement | null;
  defaultVolume: number;
  getOption(key: Extract<keyof PlaylistOptions, string>): Exclude<PlaylistOptions[keyof PlaylistOptions], undefined> | null;
  updatePlaylistCategory(): void;
  updateNotice(notification: unknown): void;
  syncPlaylistCurrentFocus(): void;
  scrollPlaylistToCurrentFocus(): void;
  syncPlaybackButtons(): void;
  syncYouTubeSignalAttrs(): void;
  setStyles(...args: unknown[]): void;
  setFullWindowMode(enabled: boolean, syncOption?: boolean, closeDrawers?: boolean): void;
}

export function initializeStatusWatcherRuntime(options: InitializeStatusWatcherRuntimeOptions): void {
  initializeStatusWatcher({
    status: options.status,
    runtimeLogger: options.runtimeLogger,
    saveStorageAdapter: options.saveStorageAdapter,
    savePlaylistContext: options.savePlaylistContext,
    syncPlaylistCurrentFocus: options.syncPlaylistCurrentFocus,
    scrollPlaylistToCurrentFocus: options.scrollPlaylistToCurrentFocus,
    syncRandomOrderToggle: () => {
      syncToggleRoot(options.randomToggleRoot, options.status.order === 'random');
    },
    syncPlaybackButtons: () => {
      options.syncPlaybackButtons();
    },
    updatePlaylistCategory: () => {
      options.updatePlaylistCategory();
    },
    syncShuffleState: () => {
      syncToggleRoot(options.shuffleToggleRoot, !!(options.status.options && options.status.options.shuffle));
      options.status.shuffle = createShuffledPlaylistItems({
        mediaItems: options.status.media as any,
        categoryId: options.status.ctg ?? null,
        shuffleEnabled: !!(options.status.options && options.status.options.shuffle),
      });
    },
    syncVolumeState: () => {
      if (!options.volumeRange) {
        return;
      }
      syncVolumeSlider({
        input: options.volumeRange,
        volume: normalizeAmbientVolume(
          options.status.volume,
          resolveAmbientDefaultVolume(options.getOption('volume'), options.defaultVolume)
        ),
        syncRangeProgress: (range) => syncAmbientRangeProgress(range, options.defaultVolume),
        display: options.document.getElementById('default-volume-value') as HTMLElement | null,
      });
    },
    updateNotice: options.updateNotice,
    applyDisplayOptions: () => {
      const ambientData = (options.windowObject as any).AmbientData as AmbientData;
      applyAmbientDisplayOptions({
        status: options.status as any,
        getOption: (key) => options.getOption(key as Extract<keyof PlaylistOptions, string>),
        defaultVolume: resolveAmbientDefaultVolume(options.getOption('volume'), options.defaultVolume),
        body: options.body,
        menu: options.menu,
        imageDir: ambientData?.imageDir,
        shuffleToggleRoot: options.shuffleToggleRoot,
        seekToggleRoot: options.seekToggleRoot,
        faderToggleRoot: options.faderToggleRoot,
        darkModeToggleRoot: options.darkModeToggleRoot,
        volumeRange: options.volumeRange,
        defaultVolumeDisplay: options.document.getElementById('default-volume-value') as HTMLElement | null,
        normalizeVolume: (value, fallback = options.defaultVolume) => normalizeAmbientVolume(value, fallback),
        syncRangeProgress: (range) => syncAmbientRangeProgress(range, options.defaultVolume),
        syncMediaVolumeField: () => {
          syncAmbientResolvedMediaVolumeField({
            input: options.mediaVolumeInput,
            display: options.document.getElementById('default-media-volume'),
            volume: options.getOption('volume'),
            defaultVolume: options.getOption('volume'),
            fallbackVolume: options.defaultVolume,
          });
        },
        shufflePlaylist: () => createShuffledPlaylistItems({
          mediaItems: options.status.media as any,
          categoryId: options.status.ctg ?? null,
          shuffleEnabled: true,
        }),
        setStyles: options.setStyles as any,
        setFullWindowMode: options.setFullWindowMode,
      });
    },
    syncYouTubeSignalAttrs: options.syncYouTubeSignalAttrs,
  });
}
