export interface YouTubePlayerHostOptions {
  embedWrapper: HTMLElement;
  playerId?: string;
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
