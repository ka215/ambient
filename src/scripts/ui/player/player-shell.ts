import type { MediaItem } from '../../types/ambient';

export interface MediaCaptionOptions {
  mediaData: MediaItem;
  captionElement: HTMLElement;
  sanitizeTitle: (value: string) => string;
  sanitizeArtist: (value: string) => string;
  onUpdated?: () => void;
}

export function buildMediaCaptionText(options: {
  mediaData: MediaItem;
  sanitizeTitle: (value: string) => string;
  sanitizeArtist: (value: string) => string;
}): {
  titleText: string;
  artistText: string;
} {
  return {
    titleText: options.sanitizeTitle(options.mediaData.title || '') || 'Unknown media',
    artistText: options.sanitizeArtist(options.mediaData.artist || ''),
  };
}

export function updateMediaCaptionView(options: MediaCaptionOptions): void {
  const {
    mediaData,
    captionElement,
    sanitizeTitle,
    sanitizeArtist,
    onUpdated,
  } = options;

  while (captionElement.firstChild) {
    captionElement.removeChild(captionElement.firstChild);
  }

  const textWrap = document.createElement('div');
  textWrap.classList.add('marquee-inner');

  const { titleText, artistText } = buildMediaCaptionText({
    mediaData,
    sanitizeTitle,
    sanitizeArtist,
  });

  const titleElm = document.createElement('span');
  titleElm.className = 'media-caption-title';
  titleElm.textContent = titleText;
  textWrap.appendChild(titleElm);

  if (artistText !== '') {
    const separatorElm = document.createElement('span');
    separatorElm.className = 'media-caption-separator';
    separatorElm.textContent = ' ─ ';
    textWrap.appendChild(separatorElm);

    const artistElm = document.createElement('span');
    artistElm.className = 'media-caption-artist';
    artistElm.textContent = artistText;
    textWrap.appendChild(artistElm);
  }

  captionElement.appendChild(textWrap);
  onUpdated?.();
}

export function syncCaptionMarquee(
  bodyElement: HTMLElement,
  captionElement: HTMLElement,
  fallbackWidth: number
): void {
  const isFullWindowCaptionVisible = bodyElement.classList.contains('amp-full-window')
    && bodyElement.classList.contains('amp-menu-minimized');
  if (bodyElement.classList.contains('amp-full-window') && !isFullWindowCaptionVisible) {
    return;
  }

  const marqueeNode = captionElement.querySelector('.marquee-inner') as HTMLElement | null;
  if (!marqueeNode) {
    return;
  }

  (captionElement.querySelectorAll('.marquee-inner[aria-hidden="true"]') as NodeListOf<HTMLElement>).forEach((elm) => {
    elm.remove();
  });
  marqueeNode.getAnimations().forEach((animation) => animation.cancel());

  const marqueeClone = marqueeNode.cloneNode(true) as HTMLElement;
  const marqueeDuration = Math.max(8, Math.floor((marqueeNode.clientWidth || 0) / 32));
  const captionWidth = captionElement.clientWidth || fallbackWidth;

  if ((marqueeNode.clientWidth || 0) > captionWidth || (marqueeNode.clientWidth || 0) > 640) {
    marqueeClone.setAttribute('aria-hidden', 'true');
    captionElement.appendChild(marqueeClone);
    (captionElement.querySelectorAll('.marquee-inner') as NodeListOf<HTMLElement>).forEach((elm) => {
      elm.animate(
        {
          translate: ['0px', 'calc(-100% - 8px)'],
        },
        {
          duration: marqueeDuration * 1000,
          iterations: Infinity,
        }
      );
    });
    return;
  }

  while (captionElement.firstChild) {
    captionElement.removeChild(captionElement.firstChild);
  }
  captionElement.appendChild(marqueeClone);
}

export function renderMediaCaption(options: MediaCaptionOptions & {
  bodyElement: HTMLElement;
  fallbackWidth: number;
}): void {
  updateMediaCaptionView({
    mediaData: options.mediaData,
    captionElement: options.captionElement,
    sanitizeTitle: options.sanitizeTitle,
    sanitizeArtist: options.sanitizeArtist,
    onUpdated: () => {
      syncCaptionMarquee(options.bodyElement, options.captionElement, options.fallbackWidth);
      options.onUpdated?.();
    },
  });
}

export function syncWindowFullButtonState(button: HTMLButtonElement | null, enabled: boolean): void {
  if (!button) {
    return;
  }

  const expandIcon = button.querySelector('.icon-window-expand') as HTMLElement | null;
  const minimizeIcon = button.querySelector('.icon-window-minimize') as HTMLElement | null;
  if (expandIcon) {
    expandIcon.classList.toggle('hidden', enabled);
  }
  if (minimizeIcon) {
    minimizeIcon.classList.toggle('hidden', !enabled);
  }

  button.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  button.classList.toggle('bg-blue-50', enabled);
  button.classList.toggle('dark:bg-gray-800', enabled);

  const labelNodes = Array.from(button.querySelectorAll('span:not(.sr-only)')) as HTMLElement[];
  labelNodes.forEach((node) => {
    node.classList.toggle('text-blue-600', enabled);
    node.classList.toggle('dark:text-blue-500', enabled);
    node.classList.toggle('text-gray-500', !enabled);
    node.classList.toggle('dark:text-gray-400', !enabled);
  });

  [expandIcon].forEach((node) => {
    if (!node) {
      return;
    }
    node.classList.toggle('text-blue-600', enabled);
    node.classList.toggle('dark:text-blue-500', enabled);
    node.classList.toggle('text-gray-500', !enabled);
    node.classList.toggle('dark:text-gray-400', !enabled);
  });
}

export function syncMenuCollapseButtonState(button: HTMLButtonElement | null, minimized: boolean): void {
  if (!button) {
    return;
  }

  const compressIcon = button.querySelector('.icon-menu-compress') as HTMLElement | null;
  const expandIcon = button.querySelector('.icon-menu-expand') as HTMLElement | null;
  if (compressIcon) {
    compressIcon.classList.toggle('hidden', minimized);
  }
  if (expandIcon) {
    expandIcon.classList.toggle('hidden', !minimized);
  }
  button.setAttribute('aria-pressed', minimized ? 'true' : 'false');
}

export function syncPlaybackButtons(
  playButton: HTMLButtonElement,
  pauseButton: HTMLButtonElement,
  hasMedia: boolean
): void {
  if (hasMedia) {
    playButton.removeAttribute('disabled');
    pauseButton.removeAttribute('disabled');
    return;
  }

  playButton.setAttribute('disabled', '');
  playButton.classList.remove('hidden');
  pauseButton.setAttribute('disabled', '');
  pauseButton.classList.add('hidden');
}

export function syncPlaybackButtonState(
  playButton: HTMLButtonElement,
  pauseButton: HTMLButtonElement,
  state: 'playing' | 'paused' | 'disabled'
): void {
  if (state === 'disabled') {
    syncPlaybackButtons(playButton, pauseButton, false);
    return;
  }

  syncPlaybackButtons(playButton, pauseButton, true);
  if (state === 'playing') {
    showPlaybackPauseState(playButton, pauseButton);
    return;
  }

  showPlaybackPlayState(playButton, pauseButton);
}

export function isPlaybackActive(options: {
  currentMediaId: number | null;
  playerType: string | null | undefined;
  youtubePlayer: { getPlayerState?: () => number } | null;
  playButton: HTMLButtonElement;
  pauseButton: HTMLButtonElement;
}): boolean {
  if (options.currentMediaId === null) {
    return false;
  }

  if (
    options.playerType === 'youtube'
    && options.youtubePlayer
    && typeof options.youtubePlayer.getPlayerState === 'function'
  ) {
    try {
      return options.youtubePlayer.getPlayerState() === 1;
    } catch (_error) {
      return options.playButton.classList.contains('hidden') && !options.pauseButton.classList.contains('hidden');
    }
  }

  if (/^(audio|video)$/i.test(String(options.playerType || ''))) {
    const mediaElement = document.querySelector(String(options.playerType)) as HTMLMediaElement | null;
    if (mediaElement) {
      return !mediaElement.paused && !mediaElement.ended;
    }
  }

  return options.playButton.classList.contains('hidden') && !options.pauseButton.classList.contains('hidden');
}

export function showPlaybackPauseState(playButton: HTMLButtonElement, pauseButton: HTMLButtonElement): void {
  playButton.classList.add('hidden');
  pauseButton.classList.remove('hidden');
}

export function showPlaybackPlayState(playButton: HTMLButtonElement, pauseButton: HTMLButtonElement): void {
  pauseButton.classList.add('hidden');
  playButton.classList.remove('hidden');
}
