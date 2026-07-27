import type { MediaItem } from '../../types/ambient';
import { runPlaybackFadeIn, runPlaybackFadeOut } from './player-fader';

type FadeTarget = HTMLMediaElement | {
  getDuration(): number;
  getVolume(): number;
  getCurrentTime(): number;
  setVolume(level: number): void;
};
type RemoteFadeTarget = Exclude<FadeTarget, HTMLMediaElement>;

function isHtmlMediaElement(value: FadeTarget): value is HTMLMediaElement {
  return value instanceof HTMLElement;
}

function isRemoteFadeTarget(value: FadeTarget): value is RemoteFadeTarget {
  return !isHtmlMediaElement(value);
}

export function reportPlaybackIssue(options: {
  mediaItem: MediaItem;
  reason: string;
  details?: Record<string, unknown>;
  logger: (...args: unknown[]) => void;
  getLocalizedMessage: (key: string, fallback: string) => string;
  escapeHtml: (value: string) => string;
  updateNotice: (options: { type: 'error'; message: string; delay: number }) => void;
}): void {
  const title = options.mediaItem.title || options.mediaItem.file || options.mediaItem.videoid || 'Unknown media';
  options.logger('error', 'Media playback issue:', {
    reason: options.reason,
    title,
    file: options.mediaItem.file || '',
    videoid: options.mediaItem.videoid || '',
    media: options.mediaItem,
    ...(options.details || {}),
  }, 'force');

  const messagePrefix = options.getLocalizedMessage(
    'mediaLoadFailedPrefix',
    'Media could not be loaded: '
  );
  options.updateNotice({
    type: 'error',
    message: `${options.escapeHtml(messagePrefix)}${options.escapeHtml(title)}`,
    delay: 6000,
  });
}

export function fadePlaybackIn(options: {
  media: FadeTarget;
  period: number;
  start: number;
  readTargetVolume: () => number;
  startFader: (callback: () => void, intervalMs: number) => void;
  abortFader: () => void;
  inRange: (value: number, min: number, max: number) => boolean;
  logger: (...args: unknown[]) => void;
}): void {
  const localMedia = isHtmlMediaElement(options.media) ? options.media : null;
  const remoteMedia = isRemoteFadeTarget(options.media) ? options.media : null;
  runPlaybackFadeIn({
    adapter: {
      kind: localMedia ? 'local' : 'youtube',
      readDuration: () => localMedia ? localMedia.duration : remoteMedia!.getDuration(),
      readLevel: () => localMedia ? localMedia.volume * 100 : remoteMedia!.getVolume(),
      readCurrentTimeMs: () => (localMedia ? localMedia.currentTime : remoteMedia!.getCurrentTime()) * 1000,
      writeLevel: (level) => {
        if (localMedia) {
          localMedia.volume = level / 100;
          return;
        }
        remoteMedia!.setVolume(level);
      },
    },
    period: options.period,
    point: options.start,
    readTargetVolume: options.readTargetVolume,
    startFader: options.startFader,
    abortFader: options.abortFader,
    inRange: options.inRange,
    logger: options.logger,
  });
}

export function fadePlaybackOut(options: {
  media: FadeTarget;
  period: number;
  end: number;
  readTargetVolume: () => number;
  startFader: (callback: () => void, intervalMs: number) => void;
  abortFader: () => void;
  inRange: (value: number, min: number, max: number) => boolean;
  logger: (...args: unknown[]) => void;
}): void {
  const localMedia = isHtmlMediaElement(options.media) ? options.media : null;
  const remoteMedia = isRemoteFadeTarget(options.media) ? options.media : null;
  runPlaybackFadeOut({
    adapter: {
      kind: localMedia ? 'local' : 'youtube',
      readDuration: () => localMedia ? localMedia.duration : remoteMedia!.getDuration(),
      readLevel: () => localMedia ? localMedia.volume * 100 : remoteMedia!.getVolume(),
      readCurrentTimeMs: () => (localMedia ? localMedia.currentTime : remoteMedia!.getCurrentTime()) * 1000,
      writeLevel: (level) => {
        if (localMedia) {
          localMedia.volume = level / 100;
          return;
        }
        remoteMedia!.setVolume(level);
      },
      onFadeOutCompleted: () => {
        if (localMedia) {
          localMedia.dispatchEvent(new Event('ended'));
          return;
        }
        options.logger([remoteMedia]);
      },
    },
    period: options.period,
    point: options.end,
    readTargetVolume: options.readTargetVolume,
    startFader: options.startFader,
    abortFader: options.abortFader,
    inRange: options.inRange,
    logger: options.logger,
  });
}
