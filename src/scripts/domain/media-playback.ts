export type PlaybackKind = 'youtube' | 'video' | 'audio';

export interface PlaybackSource {
  kind: PlaybackKind;
  mediaId: number;
  videoId?: string;
  filePath?: string;
  startSec?: number;
  endSec?: number;
  fadeInSec?: number;
  fadeOutSec?: number;
  volume?: number;
  controls?: boolean;
  fullscreen?: boolean;
  ccLoadPolicy?: number;
  rel?: number;
}

export interface PlaybackStateSnapshot {
  activeMediaId: number | null;
  activeKind: PlaybackKind | null;
  phase: 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';
  seekTimerActive: boolean;
  fadeInTimerActive: boolean;
  fadeOutTimerActive: boolean;
  lastError?: string;
}

export interface PlayerViewEvent {
  type:
    | 'VIEW_READY'
    | 'VIEW_PLAYING'
    | 'VIEW_PAUSED'
    | 'VIEW_ENDED'
    | 'VIEW_ERROR'
    | 'VIEW_TIME_UPDATE'
    | 'VIEW_DURATION'
    | 'VIEW_VOLUME_CHANGE';
  payload?: {
    seconds?: number;
    volume?: number;
    code?: string;
    detail?: string;
  };
}

export interface PlaybackDomainPort {
  play(source: PlaybackSource): Promise<void>;
  pause(): void;
  resume(): void;
  stop(reason?: string): void;
  seekTo(seconds: number): void;
  setVolume(volume: number): void;
  onViewEvent(event: PlayerViewEvent): void;
  getSnapshot(): PlaybackStateSnapshot;
  dispose(): void;
}

export type FaderTimerType = 'fadein' | 'fadeout';

export interface PlaybackTimerSnapshot {
  seekTimerActive: boolean;
  fadeInTimerActive: boolean;
  fadeOutTimerActive: boolean;
}

export interface PlaybackTimerController {
  isSeekActive(): boolean;
  startSeek(callback: () => void, intervalMs?: number): void;
  abortSeek(): void;
  startFader(type: FaderTimerType, callback: () => void, intervalMs?: number): void;
  abortFader(type: FaderTimerType): void;
  abortAll(): void;
  getSnapshot(): PlaybackTimerSnapshot;
}

export function createPlaybackTimerController(): PlaybackTimerController {
  let seekId: ReturnType<typeof setInterval> | null = null;
  let fadeinId: ReturnType<typeof setInterval> | null = null;
  let fadeoutId: ReturnType<typeof setInterval> | null = null;

  const abortSeek = (): void => {
    if (seekId) {
      clearInterval(seekId);
      seekId = null;
    }
  };

  const abortFader = (type: FaderTimerType): void => {
    if (type === 'fadein') {
      if (fadeinId) {
        clearInterval(fadeinId);
        fadeinId = null;
      }
      return;
    }
    if (fadeoutId) {
      clearInterval(fadeoutId);
      fadeoutId = null;
    }
  };

  return {
    isSeekActive(): boolean {
      return seekId !== null;
    },
    startSeek(callback: () => void, intervalMs: number = 500): void {
      abortSeek();
      seekId = setInterval(callback, intervalMs);
    },
    abortSeek,
    startFader(type: FaderTimerType, callback: () => void, intervalMs: number = 100): void {
      abortFader(type);
      const timerId = setInterval(callback, intervalMs);
      if (type === 'fadein') {
        fadeinId = timerId;
      } else {
        fadeoutId = timerId;
      }
    },
    abortFader,
    abortAll(): void {
      abortSeek();
      abortFader('fadein');
      abortFader('fadeout');
    },
    getSnapshot(): PlaybackTimerSnapshot {
      return {
        seekTimerActive: seekId !== null,
        fadeInTimerActive: fadeinId !== null,
        fadeOutTimerActive: fadeoutId !== null,
      };
    },
  };
}
