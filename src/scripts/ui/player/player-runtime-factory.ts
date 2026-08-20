import type { MediaItem } from '../../types/ambient';
import type { YTPlayer } from '../../types/youtube';
import { createHtmlPlayerInstance, createYouTubePlayerInstance } from './player-instantiation';
import type { PlayableSetupKind } from './player-setup';
import { runPlaybackTransition } from './player-runtime';

export function createManagedYouTubeRuntimePlayer(options: {
  mediaData: MediaItem;
  embedWrapper: HTMLElement;
  watchButton: HTMLAnchorElement;
  optionalContainer: HTMLElement;
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
  playlistName: () => string | null;
  updatePlayStatus: (nextId: number) => void;
  getExtension: (src: string) => string;
  setupPlayer: (setupKind: PlayableSetupKind, src: string | null, mediaData: MediaItem, extension?: string | null) => void;
  abortPlaybackTimers: () => void;
  resolveSeekRange: (mediaData: MediaItem, fallbackEnd: number) => { seekStart: number; seekEnd: number };
  fadeIn: (eventTarget: unknown, period: number, start: number) => void;
  fadeOut: (eventTarget: unknown, period: number, end: number) => void;
  syncPlaybackButtonState: (state: 'playing' | 'paused') => void;
  showYouTubePlayerWrapper: () => void;
  setWatchOriginState: (watchUrl: string) => void;
  cleanupTransition: (eventTarget: unknown, playbackTarget: unknown) => void;
  resetPlayerView: () => void;
  onAutoplayTimeout: () => void;
  playingState: number;
}): YTPlayer {
  return createYouTubePlayerInstance({
    mediaData: options.mediaData,
    embedWrapper: options.embedWrapper,
    playerId: 'ytplayer',
    size: options.getPlayerSizeForCurrentMode(),
    getOption: options.getOption,
    status: options.status,
    getDefaultVolume: options.getDefaultVolume,
    getPlaybackVolume: options.getPlaybackVolume,
    normalizeVolume: options.normalizeVolume,
    inRange: options.inRange,
    emitYouTubeSignal: options.emitYouTubeSignal,
    showPlayerWrapper: options.showYouTubePlayerWrapper,
    findMediaById: options.findMediaById,
    logger: options.logger,
    onAutoplayTimeout: options.onAutoplayTimeout,
    setWatchOrigin: options.setWatchOriginState,
    showPausedState: () => options.syncPlaybackButtonState('paused'),
    showPlayingState: () => options.syncPlaybackButtonState('playing'),
    cleanupTransition: options.cleanupTransition,
    transitionToTarget: (playbackTarget) => {
      runPlaybackTransition({
        playbackTarget,
        playlistName: options.playlistName(),
        getExtension: options.getExtension,
        updatePlayStatus: options.updatePlayStatus,
        setupPlayer: options.setupPlayer,
      });
    },
    abortPlaybackTimers: options.abortPlaybackTimers,
    resetPlayerView: options.resetPlayerView,
    resolveSeekRange: options.resolveSeekRange,
    fadeIn: options.fadeIn,
    fadeOut: options.fadeOut,
    playingState: options.playingState,
  });
}

export function createManagedHtmlRuntimePlayer(options: {
  tagName: 'audio' | 'video';
  mediaData: MediaItem;
  embedWrapper: HTMLElement;
  watchButton: HTMLAnchorElement;
  optionalContainer: HTMLElement;
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
  reportMediaPlaybackIssue: (
    mediaItem: MediaItem,
    reason: string,
    details: {
      src: string;
      networkState: number;
      readyState: number;
      errorCode: number | null;
      errorMessage: string;
      eventType: string;
    }
  ) => void;
  isSeekActive: () => boolean;
  startSeek: (callback: () => void, intervalMs: number) => void;
  abortSeeking: () => void;
  abortFadeOut: () => void;
  logger: (...args: unknown[]) => void;
  playlistName: () => string | null;
  resolveSeekRange: (mediaData: MediaItem, fallbackEnd: number) => { seekStart: number; seekEnd: number };
  fadeOut: (media: HTMLMediaElement, period: number, start: number) => void;
  fadeIn: (media: HTMLMediaElement, period: number, start: number) => void;
  onBeforeTransition: () => void;
  getExtension: (src: string) => string;
  updatePlayStatus: (nextId: number) => void;
  setupPlayer: (setupKind: PlayableSetupKind, mediaSrc: string | null, mediaData: MediaItem) => void;
  syncPlaybackButtonState: (state: 'playing' | 'paused') => void;
}): void {
  createHtmlPlayerInstance({
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
    showPlayingState: () => options.syncPlaybackButtonState('playing'),
    showPausedState: () => options.syncPlaybackButtonState('paused'),
    logger: options.logger,
    playlistName: options.playlistName,
    resolveSeekRange: options.resolveSeekRange,
    fadeOut: options.fadeOut,
    fadeIn: options.fadeIn,
    onBeforeTransition: options.onBeforeTransition,
    getExtension: options.getExtension,
    updatePlayStatus: options.updatePlayStatus,
    setupPlayer: options.setupPlayer,
  });
}
