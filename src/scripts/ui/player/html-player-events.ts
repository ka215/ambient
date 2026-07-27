import type { MediaItem } from '../../types/ambient';
import type { PlaybackTarget } from './player-runtime';

export function createHtmlMediaIssueReporter(options: {
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
}): (mediaElement: HTMLMediaElement, event: Event, reason: string) => void {
  let hasReportedLoadIssue = false;

  return (mediaElement: HTMLMediaElement, event: Event, reason: string): void => {
    if (hasReportedLoadIssue) {
      return;
    }

    hasReportedLoadIssue = true;
    options.reportMediaPlaybackIssue(options.mediaData, reason, {
      src: mediaElement.currentSrc || options.mediaData.file || '',
      networkState: mediaElement.networkState,
      readyState: mediaElement.readyState,
      errorCode: mediaElement.error?.code ?? null,
      errorMessage: mediaElement.error?.message ?? '',
      eventType: event.type,
    });
  };
}

export function bindHtmlSeekOnPlay(options: {
  playerElement: HTMLMediaElement;
  mediaData: MediaItem;
  seekEnabled: boolean;
  isSeekActive: () => boolean;
  startSeek: (callback: () => void, intervalMs: number) => void;
  abortSeeking: () => void;
  abortFadeOut: () => void;
}): void {
  options.playerElement.addEventListener('play', () => {
    if (!(options.seekEnabled && options.mediaData.hasOwnProperty('end') && options.mediaData.end !== '')) {
      return;
    }

    if (!options.isSeekActive()) {
      options.startSeek(() => {
        if (options.playerElement.currentTime >= Number(options.mediaData.end)) {
          options.playerElement.currentTime = options.playerElement.duration;
          options.abortSeeking();
          options.abortFadeOut();
        }
      }, 500);
    }
  });
}

export function bindHtmlPlaybackStateEvents(options: {
  playerElement: HTMLMediaElement;
  onPlaying: () => void;
  onPause: () => void;
  onVolumeChange: () => void;
}): void {
  options.playerElement.addEventListener('playing', options.onPlaying);
  options.playerElement.addEventListener('pause', options.onPause);
  options.playerElement.addEventListener('volumechange', options.onVolumeChange);
}

export function handleHtmlPlayingState(options: {
  playerElement: HTMLMediaElement;
  mediaData: MediaItem;
  faderEnabled: boolean;
  playbackVolume: number | null;
  fallbackVolume: number;
  normalizeVolume: (value: number | null, fallback?: number) => number;
  resolveSeekRange: (mediaData: MediaItem, duration: number) => { seekStart: number; seekEnd: number };
  fadeOut: (media: HTMLMediaElement, period: number, start: number) => void;
  fadeIn: (media: HTMLMediaElement, period: number, start: number) => void;
}): void {
  if (!options.faderEnabled) {
    return;
  }

  if (options.mediaData.hasOwnProperty('fadeout') && options.mediaData.fadeout !== '') {
    const { seekEnd } = options.resolveSeekRange(options.mediaData, options.playerElement.duration);
    options.playerElement.volume = options.normalizeVolume(
      options.playbackVolume,
      options.fallbackVolume
    ) / 100;
    options.fadeOut(options.playerElement, parseFloat(String(options.mediaData.fadeout)), seekEnd);
  }

  if (options.mediaData.hasOwnProperty('fadein') && options.mediaData.fadein !== '') {
    const { seekStart } = options.resolveSeekRange(options.mediaData, options.playerElement.duration);
    options.playerElement.volume = 0;
    options.fadeIn(options.playerElement, parseFloat(String(options.mediaData.fadein)), seekStart);
  }
}

export function handleHtmlPlayingEvent(options: {
  showPlayingState: () => void;
  playerElement: HTMLMediaElement;
  mediaData: MediaItem;
  faderEnabled: boolean;
  playbackVolume: number | null;
  fallbackVolume: number;
  normalizeVolume: (value: number | null, fallback?: number) => number;
  resolveSeekRange: (mediaData: MediaItem, duration: number) => { seekStart: number; seekEnd: number };
  fadeOut: (media: HTMLMediaElement, period: number, start: number) => void;
  fadeIn: (media: HTMLMediaElement, period: number, start: number) => void;
}): void {
  options.showPlayingState();
  handleHtmlPlayingState({
    playerElement: options.playerElement,
    mediaData: options.mediaData,
    faderEnabled: options.faderEnabled,
    playbackVolume: options.playbackVolume,
    fallbackVolume: options.fallbackVolume,
    normalizeVolume: options.normalizeVolume,
    resolveSeekRange: options.resolveSeekRange,
    fadeOut: options.fadeOut,
    fadeIn: options.fadeIn,
  });
}

export function bindHtmlEndedEvent(options: {
  playerElement: HTMLMediaElement;
  onBeforeTransition: () => void;
  resolvePlaybackTarget: () => PlaybackTarget | null;
  onTransition: (target: PlaybackTarget) => void;
}): void {
  options.playerElement.addEventListener('ended', () => {
    options.onBeforeTransition();
    const target = options.resolvePlaybackTarget();
    if (!target) {
      return;
    }
    options.onTransition(target);
  });
}

export function bindHtmlErrorEvents(options: {
  playerElement: HTMLMediaElement;
  sourceElement: HTMLSourceElement;
  reportIssue: (mediaElement: HTMLMediaElement, event: Event, reason: string) => void;
}): void {
  options.playerElement.addEventListener('error', (event) => {
    options.reportIssue(options.playerElement, event, 'player_error');
  });

  options.playerElement.addEventListener('loadstart', (event) => {
    window.setTimeout(() => {
      const target = event.target as HTMLMediaElement;
      if (target.readyState === 0 && (target.networkState === 3 || target.error)) {
        options.reportIssue(target, event, 'load_timeout');
      }
    }, 5000);
  });

  options.sourceElement.addEventListener('error', (event) => {
    options.reportIssue(options.playerElement, event, 'source_error');
  });
}

export function bindHtmlPlayerPlaybackEvents(options: {
  playerElement: HTMLMediaElement;
  sourceElement: HTMLSourceElement;
  mediaData: MediaItem;
  seekEnabled: boolean;
  isSeekActive: () => boolean;
  startSeek: (callback: () => void, intervalMs: number) => void;
  abortSeeking: () => void;
  abortFadeOut: () => void;
  onPlaying: () => void;
  onPause: () => void;
  onVolumeChange: () => void;
  onBeforeTransition: () => void;
  resolvePlaybackTarget: () => PlaybackTarget | null;
  onTransition: (target: PlaybackTarget) => void;
  reportIssue: (mediaElement: HTMLMediaElement, event: Event, reason: string) => void;
}): void {
  bindHtmlSeekOnPlay({
    playerElement: options.playerElement,
    mediaData: options.mediaData,
    seekEnabled: options.seekEnabled,
    isSeekActive: options.isSeekActive,
    startSeek: options.startSeek,
    abortSeeking: options.abortSeeking,
    abortFadeOut: options.abortFadeOut,
  });

  bindHtmlPlaybackStateEvents({
    playerElement: options.playerElement,
    onPlaying: options.onPlaying,
    onPause: options.onPause,
    onVolumeChange: options.onVolumeChange,
  });

  bindHtmlEndedEvent({
    playerElement: options.playerElement,
    onBeforeTransition: options.onBeforeTransition,
    resolvePlaybackTarget: options.resolvePlaybackTarget,
    onTransition: options.onTransition,
  });

  bindHtmlErrorEvents({
    playerElement: options.playerElement,
    sourceElement: options.sourceElement,
    reportIssue: options.reportIssue,
  });
}

export function bindManagedHtmlPlaybackEvents(options: {
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
  resolvePlaybackTarget: () => PlaybackTarget | null;
  onTransition: (target: PlaybackTarget) => void;
}): void {
  const reportHtmlMediaLoadIssue = createHtmlMediaIssueReporter({
    mediaData: options.mediaData,
    reportMediaPlaybackIssue: options.reportMediaPlaybackIssue,
  });

  bindHtmlPlayerPlaybackEvents({
    playerElement: options.playerElement,
    sourceElement: options.sourceElement,
    mediaData: options.mediaData,
    seekEnabled: options.seekEnabled,
    isSeekActive: options.isSeekActive,
    startSeek: options.startSeek,
    abortSeeking: options.abortSeeking,
    abortFadeOut: options.abortFadeOut,
    onPlaying: () => {
      handleHtmlPlayingEvent({
        showPlayingState: options.showPlayingState,
        playerElement: options.playerElement,
        mediaData: options.mediaData,
        faderEnabled: options.faderEnabled,
        playbackVolume: options.playbackVolume,
        fallbackVolume: options.fallbackVolume,
        normalizeVolume: options.normalizeVolume,
        resolveSeekRange: options.resolveSeekRange,
        fadeOut: options.fadeOut,
        fadeIn: options.fadeIn,
      });
    },
    onPause: options.showPausedState,
    onVolumeChange: options.onVolumeChange,
    onBeforeTransition: options.onBeforeTransition,
    resolvePlaybackTarget: options.resolvePlaybackTarget,
    onTransition: options.onTransition,
    reportIssue: (mediaElement, event, reason) => {
      reportHtmlMediaLoadIssue(mediaElement, event, reason);
    },
  });
}

export function createHtmlLoadErrorReporter(onError: () => void): () => void {
  let hasReportedLoadIssue = false;

  return (): void => {
    if (hasReportedLoadIssue) {
      return;
    }

    hasReportedLoadIssue = true;
    onError();
  };
}

export function bindHtmlPreviewLoadEvents(options: {
  playerElement: HTMLMediaElement;
  sourceElement: HTMLSourceElement;
  onLoadedMetadata: () => void;
  onLoadError: () => void;
}): void {
  const reportLoadErrorOnce = createHtmlLoadErrorReporter(options.onLoadError);

  options.playerElement.addEventListener('loadedmetadata', options.onLoadedMetadata);
  options.playerElement.addEventListener('error', reportLoadErrorOnce);
  options.sourceElement.addEventListener('error', reportLoadErrorOnce);
  options.playerElement.addEventListener('loadstart', () => {
    window.setTimeout(() => {
      if (
        options.playerElement.readyState === 0
        && (options.playerElement.networkState === 3 || options.playerElement.error)
      ) {
        reportLoadErrorOnce();
      }
    }, 5000);
  });
}
