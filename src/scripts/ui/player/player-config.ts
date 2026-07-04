import type { MediaItem } from '../../types/ambient';
import type { YTPlayerOptions } from '../../types/youtube';

export interface PlayerOptionSource {
  autoplay: unknown;
  controls: unknown;
  fs: unknown;
  ccLoadPolicy: unknown;
  rel: unknown;
  seekEnabled: boolean;
  faderEnabled: boolean;
}

export interface PlaybackConfigSource {
  autoplay: unknown;
  controls: unknown;
  fs: unknown;
  ccLoadPolicy: unknown;
  rel: unknown;
  seekEnabled: boolean;
  faderEnabled: boolean;
}

export interface InitialPlaybackState {
  faderEnabled: boolean;
  volume: number;
  elementVolume: number;
  startTime: number | null;
}

export interface InitialPlaybackStateResolvers {
  fallbackVolume: number;
  volumeInRange: (value: number) => boolean;
  getPlaybackVolume: (item: MediaItem) => number;
  normalizeVolume: (value: number, fallback?: number) => number;
}

export function resolveMediaFullscreenEnabled(
  mediaData: MediaItem,
  fullscreenOption: unknown
): boolean {
  if (mediaData.hasOwnProperty('fs') && mediaData.fs !== '') {
    return Boolean(mediaData.fs);
  }

  return Boolean(fullscreenOption);
}

export function applyInitialPlaybackStateToStatus(
  status: { fader?: boolean; volume: number | null },
  initialPlaybackState: InitialPlaybackState
): void {
  status.fader = initialPlaybackState.faderEnabled;
  status.volume = initialPlaybackState.volume;
}

export function applyInitialPlaybackStateToElement(
  playerElement: HTMLMediaElement,
  initialPlaybackState: InitialPlaybackState
): void {
  playerElement.volume = initialPlaybackState.elementVolume;
  if (initialPlaybackState.startTime !== null) {
    playerElement.currentTime = initialPlaybackState.startTime;
  }
}

export function resolvePlaybackConfigSource(
  getOption: (key: 'autoplay' | 'controls' | 'fs' | 'cc_load_policy' | 'rel' | 'seek' | 'fader') => unknown
): PlaybackConfigSource {
  return {
    autoplay: getOption('autoplay'),
    controls: getOption('controls'),
    fs: getOption('fs'),
    ccLoadPolicy: getOption('cc_load_policy'),
    rel: getOption('rel'),
    seekEnabled: Boolean(getOption('seek')),
    faderEnabled: Boolean(getOption('fader')),
  };
}

export function buildYouTubePlayerOptions(
  mediaData: MediaItem,
  options: PlayerOptionSource
): YTPlayerOptions {
  const playerOptions: YTPlayerOptions = {
    autoplay: 1,
    controls: 1,
    fs: 0,
    cc_load_policy: 0,
    rel: 0,
  };

  if (options.autoplay) {
    playerOptions.autoplay = Number(options.autoplay);
  }
  if (options.controls) {
    playerOptions.controls = Number(options.controls);
  }
  if (mediaData.hasOwnProperty('controls') && mediaData.controls !== '') {
    playerOptions.controls = Number(Boolean(mediaData.controls));
  }
  if (options.fs) {
    playerOptions.fs = Number(options.fs);
  }
  playerOptions.fs = Number(resolveMediaFullscreenEnabled(mediaData, playerOptions.fs));
  if (options.ccLoadPolicy) {
    playerOptions.cc_load_policy = Number(options.ccLoadPolicy);
  }
  if (mediaData.hasOwnProperty('cc') && mediaData.cc !== '') {
    playerOptions.cc_load_policy = Number(Boolean(mediaData.cc));
  }
  if (options.rel) {
    playerOptions.rel = Number(options.rel);
  }
  if (options.seekEnabled && mediaData.hasOwnProperty('start') && mediaData.start !== '') {
    playerOptions.start = Number(mediaData.start);
  }
  if (options.seekEnabled && mediaData.hasOwnProperty('end') && mediaData.end !== '') {
    playerOptions.end = Number(mediaData.end);
  }

  return playerOptions;
}

export function resolveInitialPlaybackState(
  mediaData: MediaItem,
  options: {
    faderEnabled: boolean;
    fallbackVolume: number;
    volumeInRange: (value: number) => boolean;
    getPlaybackVolume: (item: MediaItem) => number;
    normalizeVolume: (value: number, fallback?: number) => number;
    seekEnabled: boolean;
  }
): InitialPlaybackState {
  const faderEnabled = Boolean(options.faderEnabled);
  const volume = mediaData.hasOwnProperty('volume')
    && mediaData.volume !== undefined
    && options.volumeInRange(Number(mediaData.volume))
    ? options.getPlaybackVolume(mediaData)
    : options.fallbackVolume;
  const elementVolume = faderEnabled && mediaData.hasOwnProperty('fadein') && mediaData.fadein !== ''
    ? 0
    : options.normalizeVolume(volume, options.fallbackVolume) / 100;
  const startTime = options.seekEnabled && mediaData.hasOwnProperty('start') && mediaData.start !== ''
    ? Number(mediaData.start)
    : null;

  return {
    faderEnabled,
    volume,
    elementVolume,
    startTime,
  };
}

export function resolveConfiguredInitialPlaybackState(
  mediaData: MediaItem,
  playbackConfig: Pick<PlaybackConfigSource, 'faderEnabled' | 'seekEnabled'>,
  resolvers: InitialPlaybackStateResolvers
): InitialPlaybackState {
  return resolveInitialPlaybackState(mediaData, {
    faderEnabled: playbackConfig.faderEnabled,
    fallbackVolume: resolvers.fallbackVolume,
    volumeInRange: resolvers.volumeInRange,
    getPlaybackVolume: resolvers.getPlaybackVolume,
    normalizeVolume: resolvers.normalizeVolume,
    seekEnabled: playbackConfig.seekEnabled,
  });
}

export function applyConfiguredInitialPlaybackState(options: {
  mediaData: MediaItem;
  playbackConfig: Pick<PlaybackConfigSource, 'faderEnabled' | 'seekEnabled'>;
  resolvers: InitialPlaybackStateResolvers;
  status: { fader?: boolean; volume: number | null };
  playerElement?: HTMLMediaElement | null;
}): InitialPlaybackState {
  const initialPlaybackState = resolveConfiguredInitialPlaybackState(
    options.mediaData,
    options.playbackConfig,
    options.resolvers
  );
  applyInitialPlaybackStateToStatus(options.status, initialPlaybackState);
  if (options.playerElement) {
    applyInitialPlaybackStateToElement(options.playerElement, initialPlaybackState);
  }
  return initialPlaybackState;
}
