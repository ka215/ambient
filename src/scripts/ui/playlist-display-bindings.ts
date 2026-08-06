import type { MediaItem, PlaylistOptions } from '../types/ambient';
import { resolveMediaImageDisplayUrl } from '../shared/media-image-cache';
import {
  appendPlaylistQuickAddItem,
  createShuffledPlaylist,
  enablePlaylistDownloadButton,
  finalizePlaylistRender,
  filterPlaylistItemsByCategory,
  renderPlaylistItems,
  resolvePlaylistModeForRendering,
  type PlaylistMode,
} from './playlist-view';
import {
  toggleCaptionMarqueeDisplay,
  updateCarouselDisplay,
  updateMediaCaptionDisplay,
} from './player/player-display';

export function createYouTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function updateAmbientPlaylistDisplay(options: {
  mediaItems: MediaItem[];
  categoryId: number | null | undefined;
  currentId: number | null;
  playlistMode: PlaylistMode;
  deleteSelectedIds: Set<number>;
  editSelectedId: number | null;
  playlistFormat: Exclude<PlaylistOptions['playlist'], undefined> | null;
  listElement: HTMLElement;
  noMediaElement: HTMLElement;
  canUseReorderMode: boolean;
  canMutatePlaylist: boolean;
  imageDir: string | null;
  fallbackThumbPath: string;
  getRegisterText(): string;
  onQuickAdd(event: Event): void;
  trimTitle(value: string): string;
  formatLabel(format: string, mediaData: MediaItem): string;
  destroyPlaylistSortable(): void;
  closePlaylistDescModal(): void;
  clearPlaylist(): void;
  syncPlaylistModeAvailability(itemCount: number): void;
  closePlaylistModeMenu(): void;
  setPlaylistReadyState(isReady: boolean): void;
  resetReorderState(): void;
  updatePlaylistModeUi(): void;
  ensurePlaylistSortable(): void;
  execDebug(): void;
  debugEnabled: boolean;
  logger: (...args: unknown[]) => void;
  setPlaylistMode(mode: PlaylistMode): void;
  setShuffleItems(items: MediaItem[]): void;
}): void {
  options.destroyPlaylistSortable();
  options.closePlaylistDescModal();
  options.clearPlaylist();

  const items = filterPlaylistItemsByCategory(options.mediaItems, options.categoryId);
  const isNoMedia = items.length === 0;
  options.syncPlaylistModeAvailability(items.length);

  enablePlaylistDownloadButton(document.getElementById('btn-download-playlist') as HTMLButtonElement | null);

  if (finalizePlaylistRender({
    noMediaElement: options.noMediaElement,
    isEmpty: isNoMedia,
    closePlaylistModeMenu: options.closePlaylistModeMenu,
    setPlaylistReadyState: options.setPlaylistReadyState,
  })) {
    return;
  }

  const playlistModeAdjustment = resolvePlaylistModeForRendering({
    mode: options.playlistMode,
    canUseReorderMode: options.canUseReorderMode,
  });
  if (playlistModeAdjustment.changed) {
    options.resetReorderState();
    options.setPlaylistMode(playlistModeAdjustment.nextMode);
  }
  options.updatePlaylistModeUi();

  renderPlaylistItems({
    listElement: options.listElement,
    items,
    currentId: options.currentId,
    mode: playlistModeAdjustment.nextMode,
    deleteSelectedIds: options.deleteSelectedIds,
    editSelectedId: options.editSelectedId,
    format: options.playlistFormat,
    imageDir: options.imageDir,
    fallbackThumbPath: options.fallbackThumbPath,
    resolveImagePath: (image) => resolveMediaImageDisplayUrl({
      imageDir: options.imageDir,
      imagePath: image,
    }),
    resolveYoutubeThumbnailUrl: createYouTubeThumbnailUrl,
    trimTitle: options.trimTitle,
    formatLabel: options.formatLabel,
  });

  options.ensurePlaylistSortable();

  appendPlaylistQuickAddItem({
    listElement: options.listElement,
    canMutatePlaylist: options.canMutatePlaylist,
    playlistMode: playlistModeAdjustment.nextMode,
    registerText: options.getRegisterText(),
    onClick: options.onQuickAdd,
  });

  if (options.debugEnabled) {
    options.execDebug();
  }
  options.setPlaylistReadyState(true);
}

export function syncAmbientShuffleIfNeeded(options: {
  enabled: boolean;
  mediaItems: MediaItem[];
  categoryId: number | null | undefined;
  logger: (...args: unknown[]) => void;
  setShuffleItems(items: MediaItem[]): void;
}): void {
  if (!options.enabled) {
    return;
  }
  const items = filterPlaylistItemsByCategory(options.mediaItems, options.categoryId);
  const shuffled = createShuffledPlaylist(items);
  options.setShuffleItems(shuffled);
  options.logger('updatePlaylist::createShufflePlaylist:', shuffled);
}

export function updateAmbientCarousel(options: {
  prevId: number | null;
  currentId: number | null;
  nextId: number | null;
  wrapper: HTMLElement;
  prevButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  mediaItems: MediaItem[];
  placeholderImage: string;
  imageDir: string | null;
}): void {
  updateCarouselDisplay({
    prevId: options.prevId,
    currentId: options.currentId,
    nextId: options.nextId,
    wrapper: options.wrapper,
    prevButton: options.prevButton,
    nextButton: options.nextButton,
    mediaItems: options.mediaItems,
    placeholderImage: options.placeholderImage,
    resolveYouTubeThumbnail: createYouTubeThumbnailUrl,
    resolveImagePath: (image) => resolveMediaImageDisplayUrl({
      imageDir: options.imageDir,
      imagePath: image,
    }),
  });
}

export function updateAmbientMediaCaption(options: {
  mediaData: MediaItem;
  bodyElement: HTMLElement;
  captionElement: HTMLElement;
  fallbackWidth: number;
  sanitizeTitle(value: string): string;
  sanitizeArtist(value: string): string;
}): void {
  updateMediaCaptionDisplay(options);
}

export function toggleAmbientCaptionMarquee(options: {
  bodyElement: HTMLElement;
  captionElement: HTMLElement;
  fallbackWidth: number;
}): void {
  toggleCaptionMarqueeDisplay(options.bodyElement, options.captionElement, options.fallbackWidth);
}
