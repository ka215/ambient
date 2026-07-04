import type { MediaItem } from '../../types/ambient';

export function resolveYouTubeWatchUrl(mediaData: MediaItem, runtimeUrl: string | null | undefined): string {
  return runtimeUrl || `https://www.youtube.com/watch?v=${mediaData.videoid}`;
}

export function syncYouTubeWatchOrigin(options: {
  mediaData: MediaItem;
  runtimeUrl: string | null | undefined;
  delayMs?: number;
  setWatchOrigin: (watchUrl: string) => void;
}): void {
  const watchUrl = resolveYouTubeWatchUrl(options.mediaData, options.runtimeUrl);
  window.setTimeout(() => {
    options.setWatchOrigin(watchUrl);
  }, options.delayMs ?? 500);
}

export function runYouTubeAutoplayAssist(options: {
  enabled: boolean;
  getPlayerState: () => number;
  playingState: number;
  onPlaying: (elapsedMs: number) => void;
  onTimeout: () => void;
  waitTicks?: number;
  intervalMs?: number;
}): void {
  if (!options.enabled) {
    return;
  }

  const waitTicks = options.waitTicks ?? 15;
  const intervalMs = options.intervalMs ?? 100;
  let elapsed = 0;
  const intervalId = window.setInterval(() => {
    elapsed += 1;
    if (options.getPlayerState() === options.playingState) {
      window.clearInterval(intervalId);
      options.onPlaying(elapsed * intervalMs);
      return;
    }
    if (elapsed > waitTicks) {
      options.onTimeout();
      window.clearInterval(intervalId);
    }
  }, intervalMs);
}

export function resolveYouTubeInitialVolume(options: {
  faderEnabled: boolean;
  mediaData: MediaItem;
  normalizedVolume: number;
}): number {
  if (options.faderEnabled && options.mediaData.hasOwnProperty('fadein') && options.mediaData.fadein !== '') {
    return 0;
  }
  return options.normalizedVolume;
}

export function applyYouTubeReadyPlayback(options: {
  enabledAutoplayAssist: boolean;
  mediaData: MediaItem;
  runtimeUrl: string | null | undefined;
  playerStateGetter: () => number;
  playingState: number;
  onAutoplayConfirmed: (elapsedMs: number) => void;
  onAutoplayTimeout: () => void;
  setWatchOrigin: (watchUrl: string) => void;
  setVolume: (value: number) => void;
  playVideo: () => void;
  faderEnabled: boolean;
  normalizedVolume: number;
}): void {
  syncYouTubeWatchOrigin({
    mediaData: options.mediaData,
    runtimeUrl: options.runtimeUrl,
    setWatchOrigin: options.setWatchOrigin,
  });

  runYouTubeAutoplayAssist({
    enabled: options.enabledAutoplayAssist,
    getPlayerState: options.playerStateGetter,
    playingState: options.playingState,
    onPlaying: options.onAutoplayConfirmed,
    onTimeout: options.onAutoplayTimeout,
  });

  options.setVolume(resolveYouTubeInitialVolume({
    faderEnabled: options.faderEnabled,
    mediaData: options.mediaData,
    normalizedVolume: options.normalizedVolume,
  }));
  options.playVideo();
}

export function handleYouTubeReadyEvent(options: {
  mediaItems: MediaItem[];
  currentId: number | null;
  findMediaById: (mediaItems: MediaItem[], targetId: number | null) => MediaItem | null;
  enabledAutoplayAssist: boolean;
  runtimeUrl: string | null | undefined;
  playerStateGetter: () => number;
  playingState: number;
  onAutoplayConfirmed: (elapsedMs: number) => void;
  onAutoplayTimeout: () => void;
  setWatchOrigin: (watchUrl: string) => void;
  setVolume: (value: number) => void;
  playVideo: () => void;
  faderEnabled: boolean;
  normalizedVolume: number;
}): void {
  const mediaData = options.findMediaById(options.mediaItems, options.currentId);
  if (!mediaData) {
    return;
  }

  applyYouTubeReadyPlayback({
    enabledAutoplayAssist: options.enabledAutoplayAssist,
    mediaData,
    runtimeUrl: options.runtimeUrl,
    playerStateGetter: options.playerStateGetter,
    playingState: options.playingState,
    onAutoplayConfirmed: options.onAutoplayConfirmed,
    onAutoplayTimeout: options.onAutoplayTimeout,
    setWatchOrigin: options.setWatchOrigin,
    setVolume: options.setVolume,
    playVideo: options.playVideo,
    faderEnabled: options.faderEnabled,
    normalizedVolume: options.normalizedVolume,
  });
}

export function handleYouTubePausedState(options: {
  emitPaused: () => void;
  showPlayState: () => void;
}): void {
  options.emitPaused();
  options.showPlayState();
}

export function handleYouTubePlayingState(options: {
  emitPlaying: () => void;
  showPauseState: () => void;
  faderEnabled: boolean;
  mediaData: MediaItem | null;
  duration: number;
  playbackVolume: number;
  normalizeVolume: (value: number) => number;
  resolveSeekRange: (mediaData: MediaItem, fallbackEnd: number) => { seekStart: number; seekEnd: number };
  setVolume: (value: number) => void;
  fadeIn: (period: number, start: number) => void;
  fadeOut: (period: number, end: number) => void;
}): void {
  options.emitPlaying();
  options.showPauseState();

  applyYouTubePlaybackFader({
    enabled: options.faderEnabled,
    mediaData: options.mediaData,
    duration: options.duration,
    playbackVolume: options.playbackVolume,
    normalizeVolume: options.normalizeVolume,
    resolveSeekRange: options.resolveSeekRange,
    setVolume: options.setVolume,
    fadeIn: options.fadeIn,
    fadeOut: options.fadeOut,
  });
}

export function handleYouTubeUnstartedState(options: {
  autoplayEnabled: boolean;
  emitUnstarted: () => void;
  logger: (...args: unknown[]) => void;
}): void {
  if (!options.autoplayEnabled) {
    return;
  }
  options.emitUnstarted();
  options.logger('onPlayerStateChange::unstarted.');
}

export function handleYouTubeStateChangeEvent(options: {
  state: number;
  autoplayEnabled: boolean;
  logger: (...args: unknown[]) => void;
  onEnded: () => void;
  onPaused: () => void;
  onPlaying: () => void;
  onUnstarted: () => void;
}): void {
  if (options.state === 0) {
    options.onEnded();
  }

  if (options.state === 2) {
    options.onPaused();
  }

  if (options.state === 1) {
    options.onPlaying();
  }

  handleYouTubeUnstartedState({
    autoplayEnabled: options.autoplayEnabled && options.state === -1,
    emitUnstarted: options.onUnstarted,
    logger: options.logger,
  });
}

export function applyYouTubePlaybackFader(options: {
  enabled: boolean;
  mediaData: MediaItem | null;
  duration: number;
  playbackVolume: number;
  normalizeVolume: (value: number) => number;
  resolveSeekRange: (mediaData: MediaItem, fallbackEnd: number) => { seekStart: number; seekEnd: number };
  setVolume: (value: number) => void;
  fadeIn: (period: number, start: number) => void;
  fadeOut: (period: number, end: number) => void;
}): void {
  if (!options.enabled || !options.mediaData) {
    return;
  }

  const currentMedia = options.mediaData;

  if (currentMedia.hasOwnProperty('fadeout') && currentMedia.fadeout !== '') {
    const { seekEnd } = options.resolveSeekRange(currentMedia, options.duration);
    options.setVolume(options.normalizeVolume(options.playbackVolume));
    options.fadeOut(parseFloat(String(currentMedia.fadeout)), seekEnd);
  }

  if (currentMedia.hasOwnProperty('fadein') && currentMedia.fadein !== '') {
    const { seekStart } = options.resolveSeekRange(currentMedia, options.duration);
    options.setVolume(0);
    options.fadeIn(parseFloat(String(currentMedia.fadein)), seekStart);
  }
}

export function syncYouTubePreviewDuration(options: {
  readDuration: () => number | null;
  onDurationResolved: (duration: number | null) => void;
  onDurationAvailable?: () => void;
  hidePreviewError: () => void;
}): void {
  const duration = options.readDuration();
  options.onDurationResolved(duration);
  if (duration !== null) {
    options.onDurationAvailable?.();
  }
  options.hidePreviewError();
}
