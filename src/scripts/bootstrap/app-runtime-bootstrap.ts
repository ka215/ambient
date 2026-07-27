export function initializeAmbientStatus(baseAmbient: unknown): AMP_STATUS {
  const baseObj = (baseAmbient && typeof baseAmbient === 'object') ? baseAmbient : {};
  return Object.assign(baseObj, {
    prev: null,
    current: null,
    next: null,
    ctg: -1,
    category: null,
    playlist: null,
    media: null,
    order: 'normal' as const,
    playertype: null,
    volume: null,
    options: null,
    addtype: null,
    notice: null,
    loop: null,
    yt_phase: 'idle',
    yt_seq: 0,
    yt_error: '',
  } as AMP_STATUS);
}

export function mountYouTubePlayerApi(options: {
  emitYouTubeSignal(phase: string, error?: string): void;
}): void {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/player_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];

  options.emitYouTubeSignal('api_loading');
  tag.addEventListener('load', () => {
    options.emitYouTubeSignal('api_loaded');
  });
  tag.addEventListener('error', () => {
    options.emitYouTubeSignal('api_error', 'player_api_load_failed');
  });
  if (firstScriptTag?.parentNode) {
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }
}
