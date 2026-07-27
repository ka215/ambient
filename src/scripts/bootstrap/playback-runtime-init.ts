export function syncAmbientYouTubeSignalAttrs(status: {
  yt_phase?: string | null;
  yt_seq?: number | string | null;
  yt_error?: string | null;
}): void {
  const body = document.body;
  if (!body) {
    return;
  }
  body.setAttribute('data-yt-phase', String(status.yt_phase || 'idle'));
  body.setAttribute('data-yt-seq', String(status.yt_seq || 0));
  body.setAttribute('data-yt-error', String(status.yt_error || ''));
}

export function emitAmbientYouTubeSignal(
  status: {
    yt_phase?: string | null;
    yt_seq?: number | string | null;
    yt_error?: string | null;
  },
  phase: string,
  error = ''
): void {
  status.yt_phase = phase;
  status.yt_error = error;
  status.yt_seq = Number(status.yt_seq || 0) + 1;
  syncAmbientYouTubeSignalAttrs(status);
}

export function createPlaybackTimerHelpers(playbackTimers: {
  abortSeek(): void;
  abortFader(type: 'fadein' | 'fadeout'): void;
  abortAll(): void;
}): {
  abortSeeking(): void;
  abortFader(type: 'fadein' | 'fadeout'): void;
  abortPlaybackTimers(): void;
} {
  return {
    abortSeeking: () => {
      playbackTimers.abortSeek();
    },
    abortFader: (type: 'fadein' | 'fadeout') => {
      playbackTimers.abortFader(type);
    },
    abortPlaybackTimers: () => {
      playbackTimers.abortAll();
    },
  };
}
