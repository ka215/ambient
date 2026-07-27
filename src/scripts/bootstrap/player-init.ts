import type { MediaItem } from '../types/ambient';
import type { YTPlayer } from '../types/youtube';
import { createAmbientPlayerBindings } from '../ui/player/player-runtime-bindings';
import { syncPlaybackStatusAndCarousel } from '../ui/player/player-actions';
import {
  getBottomMenuHeight as getBottomMenuHeightView,
  getFullWindowPlayerSize as getFullWindowPlayerSizeView,
  getPlayerSizeForCurrentMode as getPlayerSizeForCurrentModeView,
} from '../ui/player/player-layout';
import { isFullWindowMode as isFullWindowModeView } from '../ui/viewport';
import {
  getAmbientNoMediaImagePath,
  updateAmbientCaptionBindings,
  updateAmbientCarouselDisplayBindings,
} from './display-runtime';

export interface InitializeAmbientPlayerOptions {
  status: any;
  body: HTMLElement;
  menu: HTMLElement;
  embedWrapper: HTMLElement;
  watchButton: HTMLAnchorElement;
  optionalContainer: HTMLElement;
  playButton: HTMLButtonElement;
  pauseButton: HTMLButtonElement;
  carouselWrapper: HTMLElement;
  carouselPrevButton: HTMLButtonElement;
  carouselNextButton: HTMLButtonElement;
  mediaCaption: HTMLElement;
  currentWindowSize: { width: number; height: number; minFullUIWidth: number };
  defaultVolume: number;
  imageDir: string | null | undefined;
  getOption(key: any): unknown;
  getExtension(src: string): string;
  getPlaybackVolume(mediaData?: MediaItem | null): number;
  normalizeVolume(value: number | null, fallback?: number): number;
  inRange(value: number, min: number, max: number): boolean;
  findMediaById(mediaItems: MediaItem[], targetId: number | null): MediaItem | null;
  resolveSeekRange(mediaData: MediaItem, fallbackEnd: number): { seekStart: number; seekEnd: number };
  logger(...args: unknown[]): void;
  getLocalizedMessage(key: string, fallback?: string): string;
  escapeHtml(value: string): string;
  updateNotice(notification: NotificationPayload): void;
  closeResponsiveDrawers(buttons: {
    playlistCloseButton: HTMLButtonElement | null;
    settingsCloseButton: HTMLButtonElement | null;
  }, width: number, minFullUIWidth: number): void;
  syncPlaybackButtonState(
    playButton: HTMLButtonElement,
    pauseButton: HTMLButtonElement,
    state: 'playing' | 'paused'
  ): void;
  abortPlaybackTimers(): void;
  abortSeeking(): void;
  abortFader(type: 'fadein' | 'fadeout'): void;
  isSeekActive(): boolean;
  startSeek(callback: () => void, intervalMs: number): void;
  startFader(type: 'fadein' | 'fadeout', callback: () => void, intervalMs: number): void;
  emitYouTubeSignal(phase: string, error?: string): void;
  sanitizeTitle(value: string): string;
  sanitizeArtist(value: string): string;
  resolvePlayingState(): number;
  setPlayer(player: YTPlayer): void;
}

export function initializeAmbientPlayer(options: InitializeAmbientPlayerOptions): {
  updatePlayStatus(currentAmId: number): void;
  playItem(object?: HTMLElement | null, id?: number | null): void;
} {
  const updatePlayStatus = (currentAmId: number): void => {
    syncPlaybackStatusAndCarousel({
      mediaItems: options.status.media || [],
      categoryId: options.status.ctg,
      shuffleEnabled: Boolean(options.getOption('shuffle')),
      shuffleItems: options.status.shuffle || [],
      currentId: currentAmId,
      order: options.status.order,
      applyPlaybackStatus: (playbackStatus) => {
        options.status.current = playbackStatus.currentId;
        options.status.prev = playbackStatus.prevId;
        options.status.next = playbackStatus.nextId;
      },
      refreshCarousel: () => {
        updateAmbientCarouselDisplayBindings({
          prevId: Object.prototype.hasOwnProperty.call(options.status, 'prev') ? options.status.prev : null,
          currentId: Object.prototype.hasOwnProperty.call(options.status, 'current') ? options.status.current : null,
          nextId: Object.prototype.hasOwnProperty.call(options.status, 'next') ? options.status.next : null,
          wrapper: options.carouselWrapper,
          prevButton: options.carouselPrevButton,
          nextButton: options.carouselNextButton,
          mediaItems: options.status.media || [],
          playlistOptions: options.status.options,
          imageDir: options.imageDir || null,
        });
      },
    });
  };

  const { playItem } = createAmbientPlayerBindings({
    status: options.status,
    embedWrapper: options.embedWrapper,
    watchButton: options.watchButton,
    optionalContainer: options.optionalContainer,
    playButton: options.playButton,
    pauseButton: options.pauseButton,
    currentWindowSize: options.currentWindowSize,
    isElement: (value: unknown) => value instanceof HTMLElement,
    getOption: options.getOption,
    getExtension: options.getExtension,
    getDefaultVolume: () => options.defaultVolume,
    getPlaybackVolume: options.getPlaybackVolume,
    getPlayerSizeForCurrentMode: () => getPlayerSizeForCurrentModeView({
      fullWindow: isFullWindowModeView(options.body),
      viewportWidth: options.currentWindowSize.width,
      viewportHeight: options.currentWindowSize.height,
      bottomMenuHeight: getBottomMenuHeightView(
        options.menu,
        () => Math.round(window.visualViewport?.height || window.innerHeight)
      ),
    }),
    getFullWindowPlayerSize: () => getFullWindowPlayerSizeView({
      viewportWidth: options.currentWindowSize.width,
      viewportHeight: options.currentWindowSize.height,
      bottomMenuHeight: getBottomMenuHeightView(
        options.menu,
        () => Math.round(window.visualViewport?.height || window.innerHeight)
      ),
    }),
    getViewportWidth: () => options.currentWindowSize.width,
    getPlaceholderPath: () => getAmbientNoMediaImagePath(options.status.options, 'placeholder'),
    isFullWindowMode: () => isFullWindowModeView(options.body),
    normalizeVolume: options.normalizeVolume,
    inRange: options.inRange,
    findMediaById: options.findMediaById,
    resolveSeekRange: options.resolveSeekRange,
    logger: options.logger,
    getLocalizedMessage: options.getLocalizedMessage,
    escapeHtml: options.escapeHtml,
    updateNotice: options.updateNotice,
    closeResponsiveDrawers: options.closeResponsiveDrawers,
    updatePlayStatus,
    updateMediaCaption: (mediaData) => {
      updateAmbientCaptionBindings({
        mediaData,
        bodyElement: options.body,
        captionElement: options.mediaCaption,
        fallbackWidth: options.currentWindowSize.width,
        sanitizeTitle: options.sanitizeTitle,
        sanitizeArtist: options.sanitizeArtist,
      });
    },
    emitYouTubeSignal: options.emitYouTubeSignal,
    syncPlaybackButtonState: options.syncPlaybackButtonState,
    abortPlaybackTimers: options.abortPlaybackTimers,
    abortSeeking: options.abortSeeking,
    abortFader: options.abortFader,
    setPlayer: options.setPlayer,
    isSeekActive: options.isSeekActive,
    startSeek: options.startSeek,
    startFader: options.startFader,
    reportPlaybackAutoplayTimeout: () => {
      options.playButton.dispatchEvent(new Event('click'));
    },
    reportMissingSourceContext: () => ({
      currentPlaylist: options.status.playlist || '',
      currentCategory: options.status.ctg,
    }),
    resolvePlayingState: options.resolvePlayingState,
  });

  return {
    updatePlayStatus,
    playItem,
  };
}
