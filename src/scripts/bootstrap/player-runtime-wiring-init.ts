import type { MediaItem } from '../types/ambient';
import type { YTPlayer } from '../types/youtube';
import { escapeHTML as sharedEscapeHTML, getExt as sharedGetExt } from '../shared/string';
import { inRange as sharedInRange } from '../shared/validation';
import {
  getAmbientPlaybackVolume,
  normalizeAmbientVolume,
  resolveAmbientDefaultVolume,
} from '../ui/forms/category-volume-bindings';
import { findMediaById, resolveSeekRange } from '../ui/player/player-runtime';
import { initializeAmbientPlayer } from './player-init';

export interface InitializeAmbientPlayerRuntimeWiringOptions {
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
  logger(...args: unknown[]): void;
  getLocalizedMessage(key: string, fallback?: string): string;
  updateNotice(notification: NotificationPayload): void;
  closeResponsiveDrawers(
    buttons: {
      playlistCloseButton: HTMLButtonElement | null;
      settingsCloseButton: HTMLButtonElement | null;
    },
    width: number,
    minFullUIWidth: number
  ): void;
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

export function initializeAmbientPlayerRuntimeWiring(options: InitializeAmbientPlayerRuntimeWiringOptions) {
  return initializeAmbientPlayer({
    status: options.status,
    body: options.body,
    menu: options.menu,
    embedWrapper: options.embedWrapper,
    watchButton: options.watchButton,
    optionalContainer: options.optionalContainer,
    playButton: options.playButton,
    pauseButton: options.pauseButton,
    carouselWrapper: options.carouselWrapper,
    carouselPrevButton: options.carouselPrevButton,
    carouselNextButton: options.carouselNextButton,
    mediaCaption: options.mediaCaption,
    currentWindowSize: options.currentWindowSize,
    defaultVolume: resolveAmbientDefaultVolume(options.getOption('volume'), options.defaultVolume),
    imageDir: options.imageDir,
    getOption: options.getOption,
    getExtension: sharedGetExt,
    getPlaybackVolume: (mediaData: MediaItem | null = null) => getAmbientPlaybackVolume({
      mediaData,
      defaultVolume: resolveAmbientDefaultVolume(options.getOption('volume'), options.defaultVolume),
    }),
    normalizeVolume: (value, fallback = options.defaultVolume) => normalizeAmbientVolume(value, fallback),
    inRange: sharedInRange,
    findMediaById,
    resolveSeekRange,
    logger: options.logger,
    getLocalizedMessage: options.getLocalizedMessage,
    escapeHtml: sharedEscapeHTML,
    updateNotice: options.updateNotice,
    closeResponsiveDrawers: options.closeResponsiveDrawers,
    syncPlaybackButtonState: options.syncPlaybackButtonState,
    abortPlaybackTimers: options.abortPlaybackTimers,
    abortSeeking: options.abortSeeking,
    abortFader: options.abortFader,
    isSeekActive: options.isSeekActive,
    startSeek: options.startSeek,
    startFader: options.startFader,
    emitYouTubeSignal: options.emitYouTubeSignal,
    sanitizeTitle: options.sanitizeTitle,
    sanitizeArtist: options.sanitizeArtist,
    resolvePlayingState: options.resolvePlayingState,
    setPlayer: options.setPlayer,
  });
}
