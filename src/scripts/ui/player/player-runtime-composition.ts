import type { MediaItem } from '../../types/ambient';
import type { YTPlayer } from '../../types/youtube';
import { cleanupHtmlPlayerWrapper } from './html-player-view';
import { cleanupManagedYouTubeTransition } from './player-orchestration';
import { createManagedHtmlRuntimePlayer, createManagedYouTubeRuntimePlayer } from './player-runtime-factory';
import type { PlayableSetupKind } from './player-setup';
import { resetYouTubePlayerView, setWatchOriginState, showYouTubePlayerWrapper } from './youtube-player-view';

export function createAmbientYouTubeRuntimePlayer(options: {
  mediaData: MediaItem;
  embedWrapper: HTMLElement;
  watchButton: HTMLAnchorElement;
  optionalContainer: HTMLElement;
  playButton: HTMLButtonElement;
  pauseButton: HTMLButtonElement;
  getPlayerSizeForCurrentMode: () => { width: number; height: number };
  getOption: (key: any) => unknown;
  status: any;
  getDefaultVolume: () => number;
  getPlaybackVolume: (mediaData?: MediaItem | null) => number;
  normalizeVolume: (value: number | null, fallback?: number) => number;
  inRange: (value: number, min: number, max: number) => boolean;
  emitYouTubeSignal: (phase: string, error?: string) => void;
  findMediaById: (mediaItems: MediaItem[], targetId: number | null) => MediaItem | null;
  logger: (...args: unknown[]) => void;
  onAutoplayTimeout: () => void;
  syncPlaybackButtonState: (
    playButton: HTMLButtonElement,
    pauseButton: HTMLButtonElement,
    state: 'playing' | 'paused'
  ) => void;
  updatePlayStatus: (nextId: number) => void;
  getExtension: (src: string) => string;
  setupPlayer: (setupKind: PlayableSetupKind, src: string | null, mediaData: MediaItem, extension?: string | null) => void;
  abortPlaybackTimers: () => void;
  resolveSeekRange: (mediaData: MediaItem, fallbackEnd: number) => { seekStart: number; seekEnd: number };
  fadeIn: (eventTarget: unknown, period: number, start: number) => void;
  fadeOut: (eventTarget: unknown, period: number, end: number) => void;
  playingState: number;
}): YTPlayer {
  return createManagedYouTubeRuntimePlayer({
    mediaData: options.mediaData,
    embedWrapper: options.embedWrapper,
    watchButton: options.watchButton,
    optionalContainer: options.optionalContainer,
    getPlayerSizeForCurrentMode: options.getPlayerSizeForCurrentMode,
    getOption: options.getOption,
    status: options.status,
    getDefaultVolume: options.getDefaultVolume,
    getPlaybackVolume: options.getPlaybackVolume,
    normalizeVolume: options.normalizeVolume,
    inRange: options.inRange,
    emitYouTubeSignal: options.emitYouTubeSignal,
    showYouTubePlayerWrapper: () => showYouTubePlayerWrapper(options.embedWrapper),
    findMediaById: options.findMediaById,
    logger: options.logger,
    onAutoplayTimeout: options.onAutoplayTimeout,
    setWatchOriginState: (watchUrl: string) => {
      setWatchOriginState(options.watchButton, options.optionalContainer, watchUrl);
    },
    syncPlaybackButtonState: (state) => {
      options.syncPlaybackButtonState(options.playButton, options.pauseButton, state);
    },
    cleanupTransition: (eventTarget, playbackTarget) => {
      cleanupManagedYouTubeTransition(
        eventTarget as { destroy?: () => void; g?: { remove?: () => void } },
        playbackTarget as any
      );
    },
    updatePlayStatus: options.updatePlayStatus,
    getExtension: options.getExtension,
    setupPlayer: options.setupPlayer,
    abortPlaybackTimers: options.abortPlaybackTimers,
    resetPlayerView: () => {
      resetYouTubePlayerView({
        embedWrapper: options.embedWrapper,
        watchButton: options.watchButton,
        optionalContainer: options.optionalContainer,
      });
    },
    resolveSeekRange: options.resolveSeekRange,
    fadeIn: options.fadeIn,
    fadeOut: options.fadeOut,
    playingState: options.playingState,
  });
}

export function createAmbientHtmlRuntimePlayer(options: {
  tagName: 'audio' | 'video';
  mediaData: MediaItem;
  embedWrapper: HTMLElement;
  watchButton: HTMLAnchorElement;
  optionalContainer: HTMLElement;
  playButton: HTMLButtonElement;
  pauseButton: HTMLButtonElement;
  getPlaceholderPath: () => string;
  isFullWindowMode: () => boolean;
  getFullWindowPlayerSize: () => { width: number; height: number };
  getViewportWidth: () => number;
  getOption: (key: any) => unknown;
  status: any;
  getDefaultVolume: () => number;
  getPlaybackVolume: (mediaData?: MediaItem | null) => number;
  normalizeVolume: (value: number | null, fallback?: number) => number;
  inRange: (value: number, min: number, max: number) => boolean;
  reportMediaPlaybackIssue: (mediaItem: MediaItem, reason: string, details: Record<string, unknown>) => void;
  isSeekActive: () => boolean;
  startSeek: (callback: () => void, intervalMs: number) => void;
  abortSeeking: () => void;
  abortFadeOut: () => void;
  syncPlaybackButtonState: (
    playButton: HTMLButtonElement,
    pauseButton: HTMLButtonElement,
    state: 'playing' | 'paused'
  ) => void;
  logger: (...args: unknown[]) => void;
  resolveSeekRange: (mediaData: MediaItem, fallbackEnd: number) => { seekStart: number; seekEnd: number };
  fadeOut: (media: HTMLMediaElement, period: number, start: number) => void;
  fadeIn: (media: HTMLMediaElement, period: number, start: number) => void;
  abortPlaybackTimers: () => void;
  getExtension: (src: string) => string;
  updatePlayStatus: (nextId: number) => void;
  setupPlayer: (setupKind: PlayableSetupKind, mediaSrc: string | null, mediaData: MediaItem) => void;
}): void {
  createManagedHtmlRuntimePlayer({
    tagName: options.tagName,
    mediaData: options.mediaData,
    embedWrapper: options.embedWrapper,
    watchButton: options.watchButton,
    optionalContainer: options.optionalContainer,
    getPlaceholderPath: options.getPlaceholderPath,
    isFullWindowMode: options.isFullWindowMode,
    getFullWindowPlayerSize: options.getFullWindowPlayerSize,
    getViewportWidth: options.getViewportWidth,
    getOption: options.getOption,
    status: options.status,
    getDefaultVolume: options.getDefaultVolume,
    getPlaybackVolume: options.getPlaybackVolume,
    normalizeVolume: options.normalizeVolume,
    inRange: options.inRange,
    reportMediaPlaybackIssue: options.reportMediaPlaybackIssue,
    isSeekActive: options.isSeekActive,
    startSeek: options.startSeek,
    abortSeeking: options.abortSeeking,
    abortFadeOut: options.abortFadeOut,
    syncPlaybackButtonState: (state) => {
      options.syncPlaybackButtonState(options.playButton, options.pauseButton, state);
    },
    logger: options.logger,
    resolveSeekRange: options.resolveSeekRange,
    fadeOut: options.fadeOut,
    fadeIn: options.fadeIn,
    onBeforeTransition: () => {
      options.abortPlaybackTimers();
      cleanupHtmlPlayerWrapper(options.embedWrapper);
    },
    getExtension: options.getExtension,
    updatePlayStatus: options.updatePlayStatus,
    setupPlayer: options.setupPlayer,
  });
}
