import type { MediaItem } from '../types/ambient';
import { applyAmbientPlaylistOptions } from '../ui/playlist-option-bindings';
import {
  toggleAmbientCaptionMarquee,
  updateAmbientCarousel,
  updateAmbientMediaCaption,
} from '../ui/playlist-display-bindings';
import { getToggleInput, resolveNoMediaImagePath } from '../ui/settings-view';
import { isObject } from '../shared/validation';

export function isAmbientDarkModeEnabled(options: { playlistOptions: Record<string, unknown> | null | undefined }): boolean {
  return isObject(options.playlistOptions) && options.playlistOptions?.dark ? !!options.playlistOptions.dark : false;
}

export function getAmbientNoMediaImagePath(
  playlistOptions: Record<string, unknown> | null | undefined,
  kind: 'placeholder' | 'thumb' = 'placeholder'
): string {
  return resolveNoMediaImagePath(isAmbientDarkModeEnabled({ playlistOptions }), kind);
}

export function applyAmbientDisplayOptions(options: {
  status: {
    options?: Record<string, unknown> | null;
  };
  getOption(key: string): unknown;
  defaultVolume: number;
  body: HTMLElement;
  menu: HTMLElement;
  imageDir: string | null | undefined;
  shuffleToggleRoot: HTMLElement | null;
  seekToggleRoot: HTMLElement | null;
  faderToggleRoot: HTMLElement | null;
  darkModeToggleRoot: HTMLElement | null;
  volumeRange: HTMLInputElement | null;
  defaultVolumeDisplay: HTMLElement | null;
  normalizeVolume(value: unknown, fallback?: number): number;
  syncRangeProgress(range: HTMLInputElement | null): void;
  syncMediaVolumeField(): void;
  shufflePlaylist(): MediaItem[];
  setStyles(
    element: HTMLElement | HTMLElement[],
    styles?: string | Record<string, string>
  ): void;
  setFullWindowMode(enabled: boolean, syncOption?: boolean, closeDrawers?: boolean): void;
}): void {
  applyAmbientPlaylistOptions({
    status: options.status as any,
    getOption: options.getOption as any,
    defaultVolume: options.defaultVolume,
    body: options.body,
    menu: options.menu,
    imageDir: options.imageDir,
    shuffleToggleRoot: options.shuffleToggleRoot,
    seekToggleRoot: options.seekToggleRoot,
    faderToggleRoot: options.faderToggleRoot,
    darkModeToggleInput: getToggleInput(options.darkModeToggleRoot),
    volumeRange: options.volumeRange,
    defaultVolumeDisplay: options.defaultVolumeDisplay,
    normalizeVolume: options.normalizeVolume,
    syncRangeProgress: options.syncRangeProgress,
    syncMediaVolumeField: options.syncMediaVolumeField,
    shufflePlaylist: options.shufflePlaylist,
    isDarkModeEnabled: () => isAmbientDarkModeEnabled({ playlistOptions: options.status.options as Record<string, unknown> | null | undefined }),
    setStyles: options.setStyles,
    setFullWindowMode: options.setFullWindowMode,
  });
}

export function updateAmbientCarouselDisplayBindings(options: {
  prevId: number | null;
  currentId: number | null;
  nextId: number | null;
  wrapper: HTMLElement;
  prevButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  mediaItems: MediaItem[];
  playlistOptions: Record<string, unknown> | null | undefined;
  imageDir: string | null | undefined;
}): void {
  updateAmbientCarousel({
    prevId: options.prevId,
    currentId: options.currentId,
    nextId: options.nextId,
    wrapper: options.wrapper,
    prevButton: options.prevButton,
    nextButton: options.nextButton,
    mediaItems: options.mediaItems,
    placeholderImage: getAmbientNoMediaImagePath(options.playlistOptions, 'placeholder'),
    imageDir: options.imageDir || null,
  });
}

export function updateAmbientCaptionBindings(options: {
  mediaData: MediaItem;
  bodyElement: HTMLElement;
  captionElement: HTMLElement;
  fallbackWidth: number;
  sanitizeTitle(value: string): string;
  sanitizeArtist(value: string): string;
}): void {
  updateAmbientMediaCaption(options);
}

export function toggleAmbientCaptionBindings(options: {
  bodyElement: HTMLElement;
  captionElement: HTMLElement;
  fallbackWidth: number;
}): void {
  toggleAmbientCaptionMarquee(options);
}
