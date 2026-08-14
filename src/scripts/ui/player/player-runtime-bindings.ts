import type { MediaItem } from '../../types/ambient';
import type { YTPlayer } from '../../types/youtube';
import {
  createAmbientHtmlRuntimePlayer,
  createAmbientYouTubeRuntimePlayer,
} from './player-runtime-composition';
import {
  playManagedMediaSelection,
  reportManagedPlaybackIssue,
  runManagedFadeIn,
  runManagedFadeOut,
  setupManagedPlayer,
} from './player-runtime-actions';
import type { PlayableSetupKind } from './player-setup';

export function createAmbientPlayerBindings(options: {
  status: any;
  embedWrapper: HTMLElement;
  watchButton: HTMLAnchorElement;
  optionalContainer: HTMLElement;
  playButton: HTMLButtonElement;
  pauseButton: HTMLButtonElement;
  currentWindowSize: { width: number; minFullUIWidth: number };
  isElement: (value: unknown) => boolean;
  getOption: (key: any) => unknown;
  getExtension: (src: string) => string;
  getDefaultVolume: () => number;
  getPlaybackVolume: (mediaData?: MediaItem | null) => number;
  getPlayerSizeForCurrentMode: () => { width: number; height: number };
  getFullWindowPlayerSize: () => { width: number; height: number };
  getViewportWidth: () => number;
  getPlaceholderPath: () => string;
  isFullWindowMode: () => boolean;
  normalizeVolume: (value: number | null, fallback?: number) => number;
  inRange: (value: number, min: number, max: number) => boolean;
  findMediaById: (mediaItems: MediaItem[], targetId: number | null) => MediaItem | null;
  resolveSeekRange: (mediaData: MediaItem, fallbackEnd: number) => { seekStart: number; seekEnd: number };
  logger: (...args: unknown[]) => void;
  getLocalizedMessage: (key: string, fallback?: string) => string;
  escapeHtml: (value: string) => string;
  updateNotice: (notification: NotificationPayload) => void;
  closeResponsiveDrawers: (buttons: {
    playlistCloseButton: HTMLButtonElement | null;
    settingsCloseButton: HTMLButtonElement | null;
  }, width: number, minFullUIWidth: number) => void;
  updatePlayStatus: (currentAmId: number) => void;
  updateMediaCaption: (mediaData: MediaItem) => void;
  emitYouTubeSignal: (phase: string, error?: string) => void;
  syncPlaybackButtonState: (
    playButton: HTMLButtonElement,
    pauseButton: HTMLButtonElement,
    state: 'playing' | 'paused'
  ) => void;
  abortPlaybackTimers: () => void;
  abortSeeking: () => void;
  abortFader: (type: 'fadein' | 'fadeout') => void;
  setPlayer: (player: YTPlayer) => void;
  isSeekActive: () => boolean;
  startSeek: (callback: () => void, intervalMs: number) => void;
  startFader: (type: 'fadein' | 'fadeout', callback: () => void, intervalMs: number) => void;
  reportPlaybackAutoplayTimeout: () => void;
  reportMissingSourceContext: () => { currentPlaylist: string; currentCategory: number | null | undefined };
  resolvePlayingState: () => number;
}): {
  playItem: (object?: HTMLElement | null, id?: number | null) => void;
} {
  function reportMediaPlaybackIssue(
    mediaItem: MediaItem,
    reason: string,
    details: Record<string, unknown> = {}
  ): void {
    reportManagedPlaybackIssue({
      mediaItem,
      reason,
      details,
      logger: options.logger,
      getLocalizedMessage: options.getLocalizedMessage,
      escapeHtml: options.escapeHtml,
      updateNotice: options.updateNotice,
    });
  }

  function fadeIn(media: any, period: number, start: number): void {
    runManagedFadeIn({
      media,
      period,
      start,
      readTargetVolume: () => options.normalizeVolume(options.status.volume, options.getDefaultVolume()),
      startFader: (callback, intervalMs) => options.startFader('fadein', callback, intervalMs),
      abortFader: () => options.abortFader('fadein'),
      inRange: options.inRange,
      logger: options.logger,
    });
  }

  function fadeOut(media: any, period: number, end: number): void {
    runManagedFadeOut({
      media,
      period,
      end,
      readTargetVolume: () => options.normalizeVolume(options.status.volume, options.getDefaultVolume()),
      startFader: (callback, intervalMs) => options.startFader('fadeout', callback, intervalMs),
      abortFader: () => options.abortFader('fadeout'),
      inRange: options.inRange,
      logger: options.logger,
    });
  }

  function createYTPlayer(mediaData: MediaItem): void {
    options.setPlayer(
      createAmbientYouTubeRuntimePlayer({
        mediaData,
        embedWrapper: options.embedWrapper,
        watchButton: options.watchButton,
        optionalContainer: options.optionalContainer,
        playButton: options.playButton,
        pauseButton: options.pauseButton,
        getPlayerSizeForCurrentMode: options.getPlayerSizeForCurrentMode,
        getOption: options.getOption,
        status: options.status,
        getDefaultVolume: options.getDefaultVolume,
        getPlaybackVolume: options.getPlaybackVolume,
        normalizeVolume: options.normalizeVolume,
        inRange: options.inRange,
        emitYouTubeSignal: options.emitYouTubeSignal,
        findMediaById: options.findMediaById,
        logger: options.logger,
        onAutoplayTimeout: options.reportPlaybackAutoplayTimeout,
        syncPlaybackButtonState: options.syncPlaybackButtonState,
        updatePlayStatus: options.updatePlayStatus,
        getExtension: options.getExtension,
        setupPlayer,
        abortPlaybackTimers: options.abortPlaybackTimers,
        resolveSeekRange: options.resolveSeekRange,
        fadeIn: (eventTarget, period, start) => fadeIn(eventTarget, period, start),
        fadeOut: (eventTarget, period, end) => fadeOut(eventTarget, period, end),
        playingState: options.resolvePlayingState(),
      })
    );
  }

  function createPlayerTag(tagName: 'audio' | 'video', mediaData: MediaItem): void {
    createAmbientHtmlRuntimePlayer({
      tagName,
      mediaData,
      embedWrapper: options.embedWrapper,
      watchButton: options.watchButton,
      optionalContainer: options.optionalContainer,
      playButton: options.playButton,
      pauseButton: options.pauseButton,
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
      reportMediaPlaybackIssue,
      isSeekActive: options.isSeekActive,
      startSeek: options.startSeek,
      abortSeeking: options.abortSeeking,
      abortFadeOut: () => options.abortFader('fadeout'),
      syncPlaybackButtonState: options.syncPlaybackButtonState,
      logger: options.logger,
      resolveSeekRange: options.resolveSeekRange,
      fadeOut,
      fadeIn,
      abortPlaybackTimers: options.abortPlaybackTimers,
      getExtension: options.getExtension,
      updatePlayStatus: options.updatePlayStatus,
      setupPlayer,
    });
  }

  function setupPlayer(
    setupKind: PlayableSetupKind,
    src: string | null,
    mediaData: MediaItem,
    extension: string | null = null
  ): void {
    setupManagedPlayer({
      setupKind,
      src,
      extension,
      mediaData,
      abortPlaybackTimers: options.abortPlaybackTimers,
      updateMediaCaption: options.updateMediaCaption,
      getExtension: options.getExtension,
      onPlayerTypeResolved: (playerType) => {
        options.status.playertype = playerType;
      },
      onYouTubeSignal: (phase, error) => {
        options.emitYouTubeSignal(phase, error || '');
      },
      onIssue: (reason, details) => {
        reportMediaPlaybackIssue(mediaData, reason, details);
      },
      onCreateYouTubePlayer: () => {
        options.status.yt_error = '';
        createYTPlayer(mediaData);
      },
      onCreateHtmlPlayer: (kind) => {
        createPlayerTag(kind, mediaData);
      },
    });
  }

  function playItem(object: HTMLElement | null = null, id: number | null = null): void {
    void playManagedMediaSelection({
      mediaItems: options.status.media || [],
      triggerElement: options.isElement(object) ? (object as HTMLElement) : null,
      targetId: id,
      playlistName: options.status.playlist || '',
      getExtension: options.getExtension,
      logger: options.logger,
      updatePlayStatus: options.updatePlayStatus,
      closeResponsiveDrawers: () => {
        options.closeResponsiveDrawers({
          playlistCloseButton: document.getElementById('btn-close-playlist') as HTMLButtonElement | null,
          settingsCloseButton: document.getElementById('btn-close-settings') as HTMLButtonElement | null,
        }, options.currentWindowSize.width, options.currentWindowSize.minFullUIWidth);
      },
      reportMissingSource: (mediaData) => {
        reportMediaPlaybackIssue(mediaData, 'media_source_missing', options.reportMissingSourceContext());
      },
      setupPlayer,
    });
  }

  return {
    playItem,
  };
}
