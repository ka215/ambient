import type { ResponsiveDrawerElements } from './drawers';
import { reconcileResponsiveDrawers } from './drawers';
import { syncActivePlayerSize } from './player/player-layout';

export function bindViewportSyncEvents(options: {
  onResizeSettled: () => void;
  onOrientationChange: () => void;
  onVisualViewportChange: () => void;
  onVisibilityRestore: () => void;
  resizeDelayMs?: number;
}): void {
  let timeoutId = 0;
  const delay = options.resizeDelayMs ?? 300;

  window.addEventListener(
    'resize',
    () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        options.onResizeSettled();
      }, delay);
    },
    false
  );

  window.addEventListener('orientationchange', () => {
    options.onOrientationChange();
  });

  window.visualViewport?.addEventListener('resize', () => {
    options.onVisualViewportChange();
  });

  window.visualViewport?.addEventListener('scroll', () => {
    options.onVisualViewportChange();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      options.onVisibilityRestore();
    }
  });
}

export function syncViewportLayout(options: {
  width: number;
  height: number;
  getBottomMenuHeight: () => number;
  isFullWindow: boolean;
  getPlayerSizeForCurrentMode: () => { width: number; height: number };
  player: any;
  htmlPlayer: HTMLVideoElement | null;
  drawerElements: ResponsiveDrawerElements;
  minFullUiWidth: number;
  onAfterResponsiveLayout: () => void;
}): void {
  document.documentElement.style.setProperty('--amp-bottom-menu-height', `${options.getBottomMenuHeight()}px`);

  const adjustPlayerSize = options.getPlayerSizeForCurrentMode();
  syncActivePlayerSize({
    player: options.player,
    htmlPlayer: options.htmlPlayer,
    size: adjustPlayerSize,
    fullWindow: options.isFullWindow,
  });

  if (options.isFullWindow) {
    return;
  }

  reconcileResponsiveDrawers(
    options.drawerElements,
    options.width,
    options.minFullUiWidth
  );

  options.onAfterResponsiveLayout();
}

export function applyFullWindowMode(options: {
  body: HTMLElement;
  enabled: boolean;
  toggleInput: HTMLInputElement | null;
  closeDrawers: boolean;
  playlistDrawer: HTMLElement | null;
  settingsDrawer: HTMLElement | null;
  playlistCloseButton: HTMLElement | null;
  settingsCloseButton: HTMLElement | null;
}): void {
  options.body.classList.toggle('amp-full-window', options.enabled);

  if (options.toggleInput) {
    options.toggleInput.checked = options.enabled;
  }

  if (!options.enabled || !options.closeDrawers) {
    return;
  }

  const shownLeft = !!options.playlistDrawer && !options.playlistDrawer.classList.contains('-translate-x-full');
  const shownRight = !!options.settingsDrawer && !options.settingsDrawer.classList.contains('translate-x-full');

  if (shownLeft) {
    options.playlistCloseButton?.click();
  }
  if (shownRight) {
    options.settingsCloseButton?.click();
  }
}
