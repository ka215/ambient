import type { MediaItem } from '../../types/ambient';

export interface CreateHtmlPlayerViewOptions {
  tagName: 'audio' | 'video';
  mediaData: MediaItem;
  controls: string;
  autoplay: string;
  sourcePath: string;
  sourceType: string;
}

export function createHtmlPlayerView(options: CreateHtmlPlayerViewOptions): {
  playerElement: HTMLMediaElement;
  sourceElement: HTMLSourceElement;
} {
  const playerElement = document.createElement(options.tagName) as HTMLMediaElement;
  const sourceElement = document.createElement('source');

  playerElement.id = 'html-player';
  if (options.tagName === 'audio') {
    playerElement.className = 'ambient-audio-player';
  }
  playerElement.setAttribute('controls', options.controls);
  playerElement.setAttribute('controlslist', 'nodownload');
  playerElement.setAttribute('autoplay', options.autoplay);

  sourceElement.src = options.sourcePath;
  sourceElement.setAttribute('type', options.sourceType);
  playerElement.appendChild(sourceElement);

  return { playerElement, sourceElement };
}

export function mountPlayerElement(embedWrapper: HTMLElement, playerElement: HTMLElement): void {
  while (embedWrapper.firstChild) {
    embedWrapper.removeChild(embedWrapper.firstChild);
  }
  embedWrapper.appendChild(playerElement);
}

export function showHtmlPlayerWrapper(embedWrapper: HTMLElement): void {
  embedWrapper.classList.add('max-w-2xl', 'w-max', 'h-max', 'border-0');
  embedWrapper.classList.remove('border', 'w-full', 'h-0', 'opacity-0');
}

export function resetWatchOriginState(
  watchButton: HTMLAnchorElement,
  optionalContainer: HTMLElement
): void {
  watchButton.href = '#';
  watchButton.setAttribute('disabled', '');
  optionalContainer.classList.add('hidden', 'opacity-0');
}
