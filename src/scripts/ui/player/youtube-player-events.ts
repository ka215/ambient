import type { MediaItem } from '../../types/ambient';

export function resolveYouTubeWatchUrl(mediaData: MediaItem, runtimeUrl: string | null | undefined): string {
  return runtimeUrl || `https://www.youtube.com/watch?v=${mediaData.videoid}`;
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
