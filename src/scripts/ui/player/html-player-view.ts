import type { MediaItem } from '../../types/ambient';
import {
  resolveHtmlMediaMimeType,
  resolveHtmlMediaSourcePath,
} from './html-player-source';

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

export function createMountedHtmlPlaybackView(options: {
  embedWrapper: HTMLElement;
  watchButton: HTMLAnchorElement;
  optionalContainer: HTMLElement;
  tagName: 'audio' | 'video';
  mediaData: MediaItem;
  controls: string;
  autoplay: string;
  allowFullScreen: boolean;
  getPlaceholderPath: () => string;
  isFullWindowMode: () => boolean;
  getFullWindowPlayerSize: () => { width: number; height: number };
  getViewportWidth: () => number;
}): {
  playerElement: HTMLMediaElement;
  sourceElement: HTMLSourceElement;
  sourcePath: string;
} {
  const sourcePath = resolveHtmlMediaSourcePath(options.mediaData.file || '');
  const { playerElement, sourceElement } = createHtmlPlayerView({
    tagName: options.tagName,
    mediaData: options.mediaData,
    controls: options.controls,
    autoplay: options.autoplay,
    sourcePath,
    sourceType: resolveHtmlMediaMimeType(sourcePath, options.tagName),
  });

  prepareHtmlPlayerWrapper({
    embedWrapper: options.embedWrapper,
    playerElement,
    watchButton: options.watchButton,
    optionalContainer: options.optionalContainer,
  });
  bindHtmlVideoPresentation({
    playerElement,
    allowFullScreen: options.allowFullScreen,
    getPlaceholderPath: options.getPlaceholderPath,
    isFullWindowMode: options.isFullWindowMode,
    getFullWindowPlayerSize: options.getFullWindowPlayerSize,
    getViewportWidth: options.getViewportWidth,
  });

  return { playerElement, sourceElement, sourcePath };
}

export function createHtmlPreviewPlayerView(options: {
  tagName: 'audio' | 'video';
  sourcePath: string;
  sourceType: string;
}): {
  playerElement: HTMLMediaElement;
  sourceElement: HTMLSourceElement;
} {
  const { playerElement, sourceElement } = createHtmlPlayerView({
    tagName: options.tagName,
    mediaData: {} as MediaItem,
    controls: 'true',
    autoplay: 'false',
    sourcePath: options.sourcePath,
    sourceType: options.sourceType,
  });

  playerElement.className = [
    'media-edit-preview-player',
    options.tagName === 'audio' ? 'ambient-audio-player' : '',
    'mx-auto block w-full max-h-[280px] rounded',
  ].filter(Boolean).join(' ');
  playerElement.setAttribute('preload', 'metadata');
  playerElement.setAttribute('playsinline', 'true');

  return { playerElement, sourceElement };
}

export function mountPlayerElement(embedWrapper: HTMLElement, playerElement: HTMLElement): void {
  while (embedWrapper.firstChild) {
    embedWrapper.removeChild(embedWrapper.firstChild);
  }
  embedWrapper.appendChild(playerElement);
}

export function cleanupHtmlPlayerWrapper(embedWrapper: HTMLElement): void {
  embedWrapper.classList.remove('max-w-2xl', 'w-max', 'h-max', 'border-0');
}

export function applyHtmlPlayerSize(
  playerElement: HTMLVideoElement,
  size: { width: number; height: number },
  fullWindow: boolean
): void {
  playerElement.width = size.width;
  playerElement.height = size.height;
  playerElement.style.width = `${size.width}px`;
  playerElement.style.height = `${size.height}px`;
  playerElement.style.maxWidth = '100%';
  playerElement.style.maxHeight = fullWindow
    ? 'calc(100vh - var(--amp-bottom-menu-height, 0px))'
    : '100%';
  playerElement.style.objectFit = 'contain';
  playerElement.style.display = 'block';
}

export function bindHtmlVideoPresentation(options: {
  playerElement: HTMLMediaElement;
  allowFullScreen: boolean;
  getPlaceholderPath: () => string;
  isFullWindowMode: () => boolean;
  getFullWindowPlayerSize: () => { width: number; height: number };
  getViewportWidth: () => number;
}): void {
  options.playerElement.addEventListener('loadedmetadata', (evt: Event) => {
    const self = evt.target as HTMLVideoElement;
    if (self.tagName !== 'VIDEO') {
      return;
    }

    if (!self.videoHeight || !self.videoWidth) {
      self.setAttribute('poster', options.getPlaceholderPath());
    }

    if (options.isFullWindowMode()) {
      applyHtmlPlayerSize(self, options.getFullWindowPlayerSize(), true);
      return;
    }

    const viewportWidth = options.getViewportWidth();
    const width = viewportWidth >= 640 ? 640 : viewportWidth - 2;
    applyHtmlPlayerSize(self, {
      width,
      height: Math.floor((width * self.videoHeight) / self.videoWidth),
    }, false);
  });

  if (!options.allowFullScreen) {
    return;
  }

  options.playerElement.addEventListener('click', (evt: Event) => {
    const target = evt.target as HTMLMediaElement;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      target.requestFullscreen?.();
    }
    setTimeout(() => {
      if (options.playerElement.paused) {
        options.playerElement.play();
      }
    }, 10);
  });
}

export function showHtmlPlayerWrapper(embedWrapper: HTMLElement): void {
  embedWrapper.classList.add('max-w-2xl', 'w-max', 'h-max', 'border-0');
  embedWrapper.classList.remove('border', 'w-full', 'h-0', 'opacity-0');
}

export function prepareHtmlPlayerWrapper(options: {
  embedWrapper: HTMLElement;
  playerElement: HTMLElement;
  watchButton: HTMLAnchorElement;
  optionalContainer: HTMLElement;
}): void {
  mountPlayerElement(options.embedWrapper, options.playerElement);
  showHtmlPlayerWrapper(options.embedWrapper);
  resetWatchOriginState(options.watchButton, options.optionalContainer);
}

export function destroyHtmlPreviewPlayer(playerElement: HTMLMediaElement | null): void {
  if (!playerElement) {
    return;
  }

  try {
    playerElement.pause();
  } catch (_error) {
    // Ignore pause failures.
  }

  playerElement.removeAttribute('src');
  while (playerElement.firstChild) {
    playerElement.removeChild(playerElement.firstChild);
  }
  playerElement.load();
}

export function resetWatchOriginState(
  watchButton: HTMLAnchorElement,
  optionalContainer: HTMLElement
): void {
  watchButton.href = '#';
  watchButton.setAttribute('disabled', '');
  optionalContainer.classList.add('hidden', 'opacity-0');
}
