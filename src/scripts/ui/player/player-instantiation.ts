import type { MediaItem } from '../../types/ambient';
import type { YTPlayer } from '../../types/youtube';
import { createManagedHtmlPlayback, createManagedYouTubePlayback } from './managed-player-factory';
import { bindManagedHtmlPlaybackOrchestration, createManagedYouTubePlaybackOrchestration } from './player-orchestration';
import type { PlayableSetupKind } from './player-setup';
import type { PlaybackTarget } from './player-runtime';

export function createYouTubePlayerInstance(options: {
  mediaData: MediaItem;
  embedWrapper: HTMLElement;
  playerId: string;
  size: { width: number; height: number };
  getOption: (key: any) => unknown;
  status: { media: MediaItem[] | null; current: number | null; next: number | null; loop?: boolean | null; fader?: boolean; volume: number | null; yt_error?: string };
  getDefaultVolume: () => number;
  getPlaybackVolume: (mediaData?: MediaItem | null) => number;
  normalizeVolume: (value: number | null, fallback?: number) => number;
  inRange: (value: number, min: number, max: number) => boolean;
  emitYouTubeSignal: (phase: string, error?: string) => void;
  showPlayerWrapper: () => void;
  findMediaById: (mediaItems: MediaItem[], targetId: number | null) => MediaItem | null;
  logger: (...args: unknown[]) => void;
  onAutoplayTimeout: () => void;
  setWatchOrigin: (watchUrl: string) => void;
  showPausedState: () => void;
  showPlayingState: () => void;
  cleanupTransition: (eventTarget: unknown, playbackTarget: PlaybackTarget | null) => void;
  transitionToTarget: (playbackTarget: PlaybackTarget | null) => void;
  abortPlaybackTimers: () => void;
  resetPlayerView: () => void;
  resolveSeekRange: (mediaData: MediaItem, fallbackEnd: number) => { seekStart: number; seekEnd: number };
  fadeIn: (eventTarget: unknown, period: number, start: number) => void;
  fadeOut: (eventTarget: unknown, period: number, end: number) => void;
  playingState: number;
}): YTPlayer {
  options.emitYouTubeSignal('player_creating');

  const player = createManagedYouTubePlayback({
    mediaData: options.mediaData,
    embedWrapper: options.embedWrapper,
    playerId: options.playerId,
    size: options.size,
    getOption: options.getOption,
    status: options.status,
    resolvers: {
      fallbackVolume: options.getDefaultVolume(),
      volumeInRange: (value: number) => options.inRange(value, 0, 100),
      getPlaybackVolume: options.getPlaybackVolume,
      normalizeVolume: options.normalizeVolume,
    },
    events: createManagedYouTubePlaybackOrchestration({
      emitSignal: options.emitYouTubeSignal,
      showPlayerWrapper: options.showPlayerWrapper,
      mediaItems: () => options.status.media || [],
      currentId: () => options.status.current,
      nextId: () => options.status.next,
      loopEnabled: () => Boolean(options.status.loop),
      autoplayEnabled: () => Boolean(options.getOption('autoplay')),
      faderEnabled: () => Boolean(options.status.fader),
      playbackVolume: () => options.status.volume ?? options.getDefaultVolume(),
      normalizedVolume: () => options.normalizeVolume(options.status.volume, options.getDefaultVolume()),
      findMediaById: options.findMediaById,
      onAutoplayConfirmed: (elapsedMs: number) => {
        options.logger(`onPlayerReady::elapsed ${elapsedMs}ms:`, 'Playback has started!');
      },
      onAutoplayTimeout: options.onAutoplayTimeout,
      setWatchOrigin: options.setWatchOrigin,
      showPausedState: options.showPausedState,
      showPlayingState: options.showPlayingState,
      logger: options.logger,
      cleanupTransition: options.cleanupTransition,
      transitionToTarget: options.transitionToTarget,
      onYouTubeFallbackTarget: (playbackTarget, event) => {
        if (playbackTarget.playerType === 'youtube') {
          options.logger('error', 'onYTPlayerError:', event, 'force');
        }
      },
      abortPlaybackTimers: options.abortPlaybackTimers,
      resetPlayerView: options.resetPlayerView,
      normalizeVolumeForPlayback: (value) => options.normalizeVolume(value ?? null, options.getDefaultVolume()),
      resolveSeekRange: options.resolveSeekRange,
      fadeIn: options.fadeIn,
      fadeOut: options.fadeOut,
      playingState: options.playingState,
    }),
  });

  options.emitYouTubeSignal('player_created');
  return player;
}

export function createHtmlPlayerInstance(options: {
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
  status: { media: MediaItem[] | null; current: number | null; next: number | null; loop?: boolean | null; fader?: boolean; volume: number | null };
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
  showPlayingState: () => void;
  showPausedState: () => void;
  logger: (...args: unknown[]) => void;
  playlistName: () => string | null;
  resolveSeekRange: (mediaData: MediaItem, fallbackEnd: number) => { seekStart: number; seekEnd: number };
  fadeOut: (media: HTMLMediaElement, period: number, start: number) => void;
  fadeIn: (media: HTMLMediaElement, period: number, start: number) => void;
  onBeforeTransition: () => void;
  getExtension: (src: string) => string;
  updatePlayStatus: (nextId: number) => void;
  setupPlayer: (setupKind: PlayableSetupKind, mediaSrc: string | null, mediaData: MediaItem) => void;
}): void {
  const { playerElement: playerElm, sourceElement: sourceElm, playbackConfig } = createManagedHtmlPlayback({
    mediaData: options.mediaData,
    embedWrapper: options.embedWrapper,
    watchButton: options.watchButton,
    optionalContainer: options.optionalContainer,
    tagName: options.tagName,
    getPlaceholderPath: options.getPlaceholderPath,
    isFullWindowMode: options.isFullWindowMode,
    getFullWindowPlayerSize: options.getFullWindowPlayerSize,
    getViewportWidth: options.getViewportWidth,
    getOption: options.getOption,
    status: options.status,
    resolvers: {
      fallbackVolume: options.getDefaultVolume(),
      volumeInRange: (value: number) => options.inRange(value, 0, 100),
      getPlaybackVolume: options.getPlaybackVolume,
      normalizeVolume: options.normalizeVolume,
    },
  });

  bindManagedHtmlPlaybackOrchestration({
    playerElement: playerElm,
    sourceElement: sourceElm,
    mediaData: options.mediaData,
    reportMediaPlaybackIssue: options.reportMediaPlaybackIssue,
    seekEnabled: playbackConfig.seekEnabled,
    isSeekActive: options.isSeekActive,
    startSeek: options.startSeek,
    abortSeeking: options.abortSeeking,
    abortFadeOut: options.abortFadeOut,
    showPlayingState: options.showPlayingState,
    showPausedState: options.showPausedState,
    onVolumeChange: () => {
      options.logger('playerVolumeChange:', playerElm.volume, options.status.volume);
    },
    faderEnabled: Boolean(options.status.fader),
    playbackVolume: options.status.volume,
    fallbackVolume: options.getDefaultVolume(),
    normalizeVolume: options.normalizeVolume,
    resolveSeekRange: options.resolveSeekRange,
    fadeOut: options.fadeOut,
    fadeIn: options.fadeIn,
    onBeforeTransition: options.onBeforeTransition,
    mediaItems: () => options.status.media || [],
    currentId: () => options.status.current,
    nextId: () => options.status.next,
    loopEnabled: () => Boolean(options.status.loop),
    logger: options.logger,
    playlistName: options.playlistName,
    getExtension: options.getExtension,
    updatePlayStatus: options.updatePlayStatus,
    setupPlayer: options.setupPlayer,
  });
}
