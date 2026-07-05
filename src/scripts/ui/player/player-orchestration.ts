import type { MediaItem } from '../../types/ambient';
import { bindManagedHtmlPlaybackEvents } from './html-player-events';
import { createManagedYouTubePlayerEventHandlers } from './youtube-player-events';
import {
  type PlaybackTarget,
  applyYouTubeTransitionCleanup,
  resolveEndedPlaybackTarget,
  resolveNextPlaybackTarget,
  resolveYouTubeTransitionCleanupMode,
  runPlaybackTransition,
} from './player-runtime';
import type { PlayableSetupKind } from './player-setup';

export function createManagedYouTubePlaybackOrchestration(options: {
  mediaItems: () => MediaItem[];
  currentId: () => number | null;
  nextId: () => number | null;
  loopEnabled: () => boolean;
  autoplayEnabled: () => boolean;
  faderEnabled: () => boolean;
  playbackVolume: () => number;
  normalizedVolume: () => number;
  emitSignal: (phase: string, error?: string) => void;
  showPlayerWrapper: () => void;
  findMediaById: (mediaItems: MediaItem[], targetId: number | null) => MediaItem | null;
  onAutoplayConfirmed: (elapsedMs: number) => void;
  onAutoplayTimeout: () => void;
  setWatchOrigin: (watchUrl: string) => void;
  showPausedState: () => void;
  showPlayingState: () => void;
  logger: (...args: unknown[]) => void;
  cleanupTransition: (eventTarget: unknown, playbackTarget: PlaybackTarget | null) => void;
  transitionToTarget: (playbackTarget: PlaybackTarget | null) => void;
  onYouTubeFallbackTarget: (playbackTarget: PlaybackTarget, event: unknown) => void;
  abortPlaybackTimers: () => void;
  resetPlayerView: () => void;
  normalizeVolumeForPlayback: (value: number | null | undefined) => number;
  resolveSeekRange: (mediaData: MediaItem, fallbackEnd: number) => { seekStart: number; seekEnd: number };
  fadeIn: (eventTarget: unknown, period: number, start: number) => void;
  fadeOut: (eventTarget: unknown, period: number, end: number) => void;
  playingState: number;
}) {
  return createManagedYouTubePlayerEventHandlers({
    emitSignal: options.emitSignal,
    showPlayerWrapper: options.showPlayerWrapper,
    mediaItems: options.mediaItems,
    currentId: options.currentId,
    nextId: options.nextId,
    loopEnabled: options.loopEnabled,
    autoplayEnabled: options.autoplayEnabled,
    faderEnabled: options.faderEnabled,
    playbackVolume: options.playbackVolume,
    normalizedVolume: options.normalizedVolume,
    findMediaById: options.findMediaById,
    onAutoplayConfirmed: options.onAutoplayConfirmed,
    onAutoplayTimeout: options.onAutoplayTimeout,
    setWatchOrigin: options.setWatchOrigin,
    showPausedState: options.showPausedState,
    showPlayingState: options.showPlayingState,
    logger: options.logger,
    resolveEndedPlaybackTarget: () => resolveEndedPlaybackTarget(
      options.mediaItems(),
      options.currentId(),
      options.nextId(),
      options.loopEnabled()
    ),
    resolveErrorPlaybackTarget: () => resolveNextPlaybackTarget(options.mediaItems(), options.nextId()),
    cleanupTransition: options.cleanupTransition,
    transitionToTarget: options.transitionToTarget,
    onYouTubeFallbackTarget: options.onYouTubeFallbackTarget,
    abortPlaybackTimers: options.abortPlaybackTimers,
    resetPlayerView: options.resetPlayerView,
    normalizeVolumeForPlayback: options.normalizeVolumeForPlayback,
    resolveSeekRange: options.resolveSeekRange,
    fadeIn: options.fadeIn,
    fadeOut: options.fadeOut,
    playingState: options.playingState,
  });
}

export function bindManagedHtmlPlaybackOrchestration(options: {
  playerElement: HTMLMediaElement;
  sourceElement: HTMLSourceElement;
  mediaData: MediaItem;
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
  seekEnabled: boolean;
  isSeekActive: () => boolean;
  startSeek: (callback: () => void, intervalMs: number) => void;
  abortSeeking: () => void;
  abortFadeOut: () => void;
  showPlayingState: () => void;
  showPausedState: () => void;
  onVolumeChange: () => void;
  faderEnabled: boolean;
  playbackVolume: number | null;
  fallbackVolume: number;
  normalizeVolume: (value: number | null, fallback?: number) => number;
  resolveSeekRange: (mediaData: MediaItem, duration: number) => { seekStart: number; seekEnd: number };
  fadeOut: (media: HTMLMediaElement, period: number, start: number) => void;
  fadeIn: (media: HTMLMediaElement, period: number, start: number) => void;
  onBeforeTransition: () => void;
  mediaItems: () => MediaItem[];
  currentId: () => number | null;
  nextId: () => number | null;
  loopEnabled: () => boolean;
  logger: (...args: unknown[]) => void;
  getExtension: (src: string) => string;
  updatePlayStatus: (nextId: number) => void;
  setupPlayer: (setupKind: PlayableSetupKind, mediaSrc: string | null, mediaData: MediaItem) => void;
}): void {
  bindManagedHtmlPlaybackEvents({
    playerElement: options.playerElement,
    sourceElement: options.sourceElement,
    mediaData: options.mediaData,
    reportMediaPlaybackIssue: options.reportMediaPlaybackIssue,
    seekEnabled: options.seekEnabled,
    isSeekActive: options.isSeekActive,
    startSeek: options.startSeek,
    abortSeeking: options.abortSeeking,
    abortFadeOut: options.abortFadeOut,
    showPlayingState: options.showPlayingState,
    showPausedState: options.showPausedState,
    onVolumeChange: options.onVolumeChange,
    faderEnabled: options.faderEnabled,
    playbackVolume: options.playbackVolume,
    fallbackVolume: options.fallbackVolume,
    normalizeVolume: options.normalizeVolume,
    resolveSeekRange: options.resolveSeekRange,
    fadeOut: options.fadeOut,
    fadeIn: options.fadeIn,
    onBeforeTransition: options.onBeforeTransition,
    resolvePlaybackTarget: () => {
      const playbackTarget = resolveEndedPlaybackTarget(
        options.mediaItems(),
        options.currentId(),
        options.nextId(),
        options.loopEnabled()
      );
      options.logger('ended:', { current: options.currentId(), next: options.nextId() }, playbackTarget?.nextId ?? null);
      return playbackTarget;
    },
    onTransition: (playbackTarget) => {
      if (playbackTarget.playerType === 'youtube') {
        options.playerElement.remove();
      }
      runPlaybackTransition({
        playbackTarget,
        getExtension: options.getExtension,
        updatePlayStatus: options.updatePlayStatus,
        setupPlayer: options.setupPlayer,
      });
    },
  });
}

export function cleanupManagedYouTubeTransition(
  eventTarget: { destroy?: () => void; g?: { remove?: () => void } },
  playbackTarget: PlaybackTarget | null
): void {
  applyYouTubeTransitionCleanup(
    eventTarget,
    resolveYouTubeTransitionCleanupMode(playbackTarget)
  );
}
