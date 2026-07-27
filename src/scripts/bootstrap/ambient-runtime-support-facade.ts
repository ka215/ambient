import { createPlaybackTimerHelpers, emitAmbientYouTubeSignal, syncAmbientYouTubeSignalAttrs } from './playback-runtime-init';

export interface CreateAmbientRuntimeSupportFacadeOptions {
  status: {
    yt_phase?: string | null;
    yt_seq?: number | string | null;
    yt_error?: string | null;
  };
  playbackTimers: {
    abortSeek(): void;
    abortFader(type: 'fadein' | 'fadeout'): void;
    abortAll(): void;
  };
  updateNotice(notification: NotificationPayload): void;
}

export interface AmbientRuntimeSupportFacade {
  syncYouTubeSignalAttrs(): void;
  emitYouTubeSignal(phase: string, error?: string): void;
  updateNotice(notification: NotificationPayload): void;
  abortSeeking(): void;
  abortFader(type: 'fadein' | 'fadeout'): void;
  abortPlaybackTimers(): void;
}

export function createAmbientRuntimeSupportFacade(
  options: CreateAmbientRuntimeSupportFacadeOptions
): AmbientRuntimeSupportFacade {
  const playbackTimerHelpers = createPlaybackTimerHelpers(options.playbackTimers);

  return {
    syncYouTubeSignalAttrs: () => syncAmbientYouTubeSignalAttrs(options.status),
    emitYouTubeSignal: (phase, error = '') => emitAmbientYouTubeSignal(options.status, phase, error),
    updateNotice: options.updateNotice,
    abortSeeking: playbackTimerHelpers.abortSeeking,
    abortFader: playbackTimerHelpers.abortFader,
    abortPlaybackTimers: playbackTimerHelpers.abortPlaybackTimers,
  };
}
