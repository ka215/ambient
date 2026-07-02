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
