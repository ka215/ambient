import type { InitializeStatusWatcherRuntimeOptions } from './status-watcher-runtime-init';

export interface CreateStatusWatcherFacadeOptions {
  document: Document;
  windowObject: Window & typeof globalThis;
  status: InitializeStatusWatcherRuntimeOptions['status'];
  runtimeLogger: InitializeStatusWatcherRuntimeOptions['runtimeLogger'];
  saveStorageAdapter: InitializeStatusWatcherRuntimeOptions['saveStorageAdapter'];
  savePlaylistContext: InitializeStatusWatcherRuntimeOptions['savePlaylistContext'];
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
  getOption: InitializeStatusWatcherRuntimeOptions['getOption'];
  updatePlaylistCategory(): void;
  updateNotice(notification: unknown): void;
  syncPlaylistCurrentFocus(): void;
  scrollPlaylistToCurrentFocus(): void;
  syncPlaybackButtons(): void;
  syncYouTubeSignalAttrs(): void;
  setStyles(...args: unknown[]): void;
  setFullWindowMode(enabled: boolean, syncOption?: boolean, closeDrawers?: boolean): void;
}

export function createStatusWatcherFacade(
  options: CreateStatusWatcherFacadeOptions
): InitializeStatusWatcherRuntimeOptions {
  return {
    document: options.document,
    windowObject: options.windowObject,
    status: options.status,
    runtimeLogger: options.runtimeLogger,
    saveStorageAdapter: options.saveStorageAdapter,
    savePlaylistContext: options.savePlaylistContext,
    listElement: options.listElement,
    randomToggleRoot: options.randomToggleRoot,
    shuffleToggleRoot: options.shuffleToggleRoot,
    seekToggleRoot: options.seekToggleRoot,
    faderToggleRoot: options.faderToggleRoot,
    darkModeToggleRoot: options.darkModeToggleRoot,
    playButton: options.playButton,
    pauseButton: options.pauseButton,
    body: options.body,
    menu: options.menu,
    volumeRange: options.volumeRange,
    mediaVolumeInput: options.mediaVolumeInput,
    defaultVolume: options.defaultVolume,
    getOption: options.getOption,
    updatePlaylistCategory: options.updatePlaylistCategory,
    updateNotice: options.updateNotice,
    syncPlaylistCurrentFocus: options.syncPlaylistCurrentFocus,
    scrollPlaylistToCurrentFocus: options.scrollPlaylistToCurrentFocus,
    syncPlaybackButtons: options.syncPlaybackButtons,
    syncYouTubeSignalAttrs: options.syncYouTubeSignalAttrs,
    setStyles: options.setStyles,
    setFullWindowMode: options.setFullWindowMode,
  };
}
