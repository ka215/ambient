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

export type PlaybackOptionKey = 'autoplay' | 'controls' | 'fs' | 'cc_load_policy' | 'rel' | 'seek' | 'fader';

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

function hasMediaOption(mediaData: MediaItem, key: keyof MediaItem): boolean {
  return Object.prototype.hasOwnProperty.call(mediaData, key) && mediaData[key] !== '';
}

function toPlayerFlag(value: unknown): number {
  return Number(Boolean(value));
}

function resolveCurrentIso6391Language(): string {
  const selectedLanguage = document.getElementById('language') instanceof HTMLSelectElement
    ? (document.getElementById('language') as HTMLSelectElement).value
    : '';
  const normalized = selectedLanguage.trim().toLowerCase();
  if (/^[a-z]{2}(?:[-_][a-z]{2})?$/.test(normalized)) {
    return normalized.slice(0, 2);
  }
  const navigatorLanguage = window.navigator.language || '';
  const fallback = navigatorLanguage.trim().toLowerCase();
  if (/^[a-z]{2}/.test(fallback)) {
    return fallback.slice(0, 2);
  }
  return 'en';
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
  getOption: (key: PlaybackOptionKey) => unknown
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
    playsinline: 1,
    rel: 0,
  };

  if (options.autoplay) {
    playerOptions.autoplay = Number(options.autoplay);
  }
  if (options.controls) {
    playerOptions.controls = Number(options.controls);
  }
  if (hasMediaOption(mediaData, 'controls')) {
    playerOptions.controls = toPlayerFlag(mediaData.controls);
  }
  if (options.fs) {
    playerOptions.fs = Number(options.fs);
  }
  playerOptions.fs = Number(resolveMediaFullscreenEnabled(mediaData, playerOptions.fs));
  if (options.ccLoadPolicy) {
    playerOptions.cc_load_policy = Number(options.ccLoadPolicy);
  }
  if (hasMediaOption(mediaData, 'cc')) {
    playerOptions.cc_load_policy = toPlayerFlag(mediaData.cc);
    if (playerOptions.cc_load_policy === 1) {
      playerOptions.cc_lang_pref = resolveCurrentIso6391Language();
    }
  }
  if (hasMediaOption(mediaData, 'disablekb')) {
    playerOptions.disablekb = toPlayerFlag(mediaData.disablekb);
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

export function prepareConfiguredPlayback(options: {
  mediaData: MediaItem;
  getOption: (key: PlaybackOptionKey) => unknown;
  resolvers: InitialPlaybackStateResolvers;
  status: { fader?: boolean; volume: number | null };
  playerElement?: HTMLMediaElement | null;
}): {
  playbackConfig: PlaybackConfigSource;
  initialPlaybackState: InitialPlaybackState;
} {
  const playbackConfig = resolvePlaybackConfigSource(options.getOption);
  const initialPlaybackState = applyConfiguredInitialPlaybackState({
    mediaData: options.mediaData,
    playbackConfig,
    resolvers: options.resolvers,
    status: options.status,
    playerElement: options.playerElement,
  });

  return {
    playbackConfig,
    initialPlaybackState,
  };
}
