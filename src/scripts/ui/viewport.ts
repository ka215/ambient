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

export function syncViewportMetricsState(options: {
  getViewportWidth: () => number;
  getViewportHeight: () => number;
  getBottomMenuHeight: () => number;
  onMeasured?: (metrics: {
    width: number;
    height: number;
    offsetTop: number;
    visualBottomInset: number;
  }) => void;
}): void {
  const visualViewport = window.visualViewport;
  const width = options.getViewportWidth();
  const height = options.getViewportHeight();
  const offsetTop = Math.max(0, Math.round(visualViewport?.offsetTop || 0));
  const visualBottomInset = Math.max(0, Math.round(window.innerHeight - height - offsetTop));
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty('--amp-viewport-width', `${width}px`);
  rootStyle.setProperty('--amp-viewport-height', `${height}px`);
  rootStyle.setProperty('--amp-visual-offset-top', `${offsetTop}px`);
  rootStyle.setProperty('--amp-visual-bottom-inset', `${visualBottomInset}px`);
  rootStyle.setProperty('--amp-bottom-menu-height', `${options.getBottomMenuHeight()}px`);
  document.body.style.minHeight = `${height}px`;
  document.body.style.height = `${height}px`;
  options.onMeasured?.({
    width,
    height,
    offsetTop,
    visualBottomInset,
  });
}

export function isFullWindowMode(body: HTMLElement): boolean {
  return body.classList.contains('amp-full-window');
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
  shouldAutoCloseDrawers?: boolean;
  playlistDrawer: HTMLElement | null;
  settingsDrawer: HTMLElement | null;
  playlistCloseButton: HTMLElement | null;
  settingsCloseButton: HTMLElement | null;
}): void {
  options.body.classList.toggle('amp-full-window', options.enabled);

  if (options.toggleInput) {
    options.toggleInput.checked = options.enabled;
  }

  if (!options.enabled || !options.closeDrawers || !options.shouldAutoCloseDrawers) {
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

export function applyMenuMinimizedState(options: {
  body: HTMLElement;
  menu: HTMLElement | null;
  minimized: boolean;
  syncButtonState: (minimized: boolean) => void;
  afterToggle?: () => void;
}): void {
  if (!options.menu) {
    return;
  }

  options.menu.classList.toggle('menu-minimized', options.minimized);
  options.body.classList.toggle('amp-menu-minimized', options.minimized);
  options.syncButtonState(options.minimized);
  options.afterToggle?.();
}
