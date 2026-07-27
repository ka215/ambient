import { applyHtmlPlayerSize } from './html-player-view';

export function getBottomMenuHeight(
  menuElement: HTMLElement | null,
  getViewportHeight: () => number
): number {
  if (!menuElement) {
    return 0;
  }

  const rect = menuElement.getBoundingClientRect();
  return Math.max(0, Math.ceil(getViewportHeight() - rect.top));
}

export function getFullWindowPlayerSize(options: {
  viewportWidth: number;
  viewportHeight: number;
  bottomMenuHeight: number;
}): { width: number; height: number } {
  const aspectRatio = 16 / 9;
  const width = Math.max(1, options.viewportWidth);
  const height = Math.max(1, options.viewportHeight - options.bottomMenuHeight);
  const availableRatio = width / height;

  if (availableRatio > aspectRatio) {
    return {
      width: Math.floor(height * aspectRatio),
      height,
    };
  }

  return {
    width,
    height: Math.floor(width / aspectRatio),
  };
}

export function getStandardPlayerSize(viewportWidth: number): { width: number; height: number } {
  const width = viewportWidth >= 640 ? 640 : viewportWidth - 2;
  return {
    width,
    height: Math.floor((9 * width) / 16),
  };
}

export function getPlayerSizeForCurrentMode(options: {
  fullWindow: boolean;
  viewportWidth: number;
  viewportHeight: number;
  bottomMenuHeight: number;
}): { width: number; height: number } {
  return options.fullWindow
    ? getFullWindowPlayerSize({
        viewportWidth: options.viewportWidth,
        viewportHeight: options.viewportHeight,
        bottomMenuHeight: options.bottomMenuHeight,
      })
    : getStandardPlayerSize(options.viewportWidth);
}

export function syncActivePlayerSize(options: {
  player: any;
  htmlPlayer: HTMLVideoElement | null;
  size: { width: number; height: number };
  fullWindow: boolean;
}): void {
  if (options.player && typeof options.player === 'object' && typeof options.player.getIframe === 'function') {
    const youTubePlayer = options.player.getIframe();
    youTubePlayer.width = String(options.size.width);
    youTubePlayer.height = String(options.size.height);
  }

  if (options.htmlPlayer && options.htmlPlayer.tagName === 'VIDEO') {
    applyHtmlPlayerSize(options.htmlPlayer, options.size, options.fullWindow);
  }
}
