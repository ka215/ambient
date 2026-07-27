import type { YTPlayer, YTPlayerConfig, YTPlayerEvent } from '../../types/youtube';

export interface YouTubePlayerHostOptions {
  embedWrapper: HTMLElement;
  playerId?: string;
}

export interface CreateYouTubePlayerOptions {
  playerId: string;
  size: { width: number; height: number };
  videoId: string;
  playerVars: YTPlayerConfig['playerVars'];
  events: {
    onReady: (event: YTPlayerEvent) => void;
    onStateChange: (event: YTPlayerEvent) => void;
    onError: (event: YTPlayerEvent) => void;
  };
}

export function createYouTubePlayerHost(options: YouTubePlayerHostOptions): HTMLDivElement {
  const playerElement = document.createElement('div');
  playerElement.id = options.playerId || 'ytplayer';

  while (options.embedWrapper.firstChild) {
    options.embedWrapper.removeChild(options.embedWrapper.firstChild);
  }
  options.embedWrapper.appendChild(playerElement);

  return playerElement;
}

export function createYouTubePreviewHost(options: YouTubePlayerHostOptions): HTMLDivElement {
  const playerElement = createYouTubePlayerHost(options);
  playerElement.className = 'media-edit-preview-embed mx-auto aspect-video w-full max-w-3xl';
  return playerElement;
}

export function createYouTubePlayer(options: CreateYouTubePlayerOptions): YTPlayer {
  return new (window as any).YT.Player(options.playerId, {
    height: options.size.height,
    width: options.size.width,
    videoId: options.videoId,
    playerVars: options.playerVars,
    events: options.events,
  });
}

export function createMountedYouTubePlayer(options: CreateYouTubePlayerOptions & {
  embedWrapper: HTMLElement;
}): YTPlayer {
  createYouTubePlayerHost({
    embedWrapper: options.embedWrapper,
    playerId: options.playerId,
  });

  return createYouTubePlayer({
    playerId: options.playerId,
    size: options.size,
    videoId: options.videoId,
    playerVars: options.playerVars,
    events: options.events,
  });
}

export function buildYouTubePreviewPlayerConfig(videoId: string): {
  height: number;
  width: number;
  videoId: string;
  playerVars: {
    autoplay: number;
    controls: number;
    rel: number;
    fs: number;
  };
} {
  return {
    height: 270,
    width: 480,
    videoId,
    playerVars: {
      autoplay: 0,
      controls: 1,
      rel: 0,
      fs: 0,
    },
  };
}

export function showYouTubePlayerWrapper(embedWrapper: HTMLElement): void {
  embedWrapper.classList.add('w-max', 'h-max');
  embedWrapper.classList.remove('w-full', 'h-0', 'opacity-0');
}

export function hideYouTubePlayerWrapper(embedWrapper: HTMLElement): void {
  embedWrapper.classList.add('w-full', 'h-0', 'opacity-0');
  embedWrapper.classList.remove('w-max', 'h-max');
}

export function setWatchOriginState(
  watchButton: HTMLAnchorElement,
  optionalContainer: HTMLElement,
  href: string | null
): void {
  if (!href) {
    watchButton.href = '#';
    watchButton.setAttribute('disabled', '');
    optionalContainer.classList.add('hidden', 'opacity-0');
    return;
  }

  watchButton.href = href;
  watchButton.removeAttribute('disabled');
  optionalContainer.classList.remove('hidden', 'opacity-0');
}

export function resetYouTubePlayerView(options: {
  embedWrapper: HTMLElement;
  watchButton: HTMLAnchorElement;
  optionalContainer: HTMLElement;
}): void {
  hideYouTubePlayerWrapper(options.embedWrapper);
  setWatchOriginState(options.watchButton, options.optionalContainer, null);
}

export function destroyYouTubePreviewPlayer(player: { destroy?: () => void } | null): void {
  if (!player) {
    return;
  }

  try {
    player.destroy?.();
  } catch (_error) {
    // Ignore destroy failures when preview iframe is already gone.
  }
}
