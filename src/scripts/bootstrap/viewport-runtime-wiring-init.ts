import { setPlaylistOption } from '../state/playlist-options';
import { getBottomMenuHeight as getBottomMenuHeightView, getPlayerSizeForCurrentMode as getPlayerSizeForCurrentModeView } from '../ui/player/player-layout';
import { syncMenuCollapseButtonState, syncWindowFullButtonState } from '../ui/player/player-shell';
import { isFullWindowMode as isFullWindowModeView } from '../ui/viewport';
import { createViewportRuntimeController } from '../ui/viewport-runtime';
import { toggleAmbientCaptionBindings } from './display-runtime';

export interface InitializeViewportRuntimeWiringOptions {
  body: HTMLElement;
  menu: HTMLElement;
  menuCollapseButton: HTMLButtonElement | null;
  toggleWindowFullInput: HTMLInputElement | null;
  drawerPlaylist: HTMLElement | null;
  drawerSettings: HTMLElement | null;
  playlistButton: HTMLButtonElement | null;
  settingsButton: HTMLButtonElement | null;
  currentWindowSize: { width: number; height: number; minFullUIWidth: number };
  buttonWindowFull: HTMLButtonElement | null;
  mediaCaption: HTMLElement;
  status: {
    options: Record<string, unknown> | null;
  };
  persistCurrentPlaylistSettings(): void;
  getPlayer(): unknown;
}

export function initializeViewportRuntimeWiring(options: InitializeViewportRuntimeWiringOptions) {
  const getViewportHeight = (): number => Math.round(window.visualViewport?.height || window.innerHeight);

  return createViewportRuntimeController({
    body: options.body,
    menu: options.menu,
    menuCollapseButton: options.menuCollapseButton,
    toggleInput: options.toggleWindowFullInput,
    drawerElements: {
      playlistDrawer: options.drawerPlaylist,
      settingsDrawer: options.drawerSettings,
      playlistButton: options.playlistButton,
      settingsButton: options.settingsButton,
      playlistCloseButton: document.getElementById('btn-close-playlist') as HTMLButtonElement | null,
      settingsCloseButton: document.getElementById('btn-close-settings') as HTMLButtonElement | null,
    },
    state: options.currentWindowSize,
    getViewportWidth: () => Math.round(window.visualViewport?.width || window.innerWidth),
    getViewportHeight,
    getBottomMenuHeight: () => getBottomMenuHeightView(
      options.menu,
      getViewportHeight
    ),
    getPlayerSizeForCurrentMode: () => getPlayerSizeForCurrentModeView({
      fullWindow: isFullWindowModeView(options.body),
      viewportWidth: options.currentWindowSize.width,
      viewportHeight: options.currentWindowSize.height,
      bottomMenuHeight: getBottomMenuHeightView(
        options.menu,
        getViewportHeight
      ),
    }),
    isFullWindowMode: () => isFullWindowModeView(options.body),
    getPlayer: options.getPlayer,
    getHtmlPlayer: () => document.getElementById('html-player') as HTMLVideoElement | null,
    clearTimer: (timerId) => {
      window.clearTimeout(timerId);
    },
    setTimer: (handler, delay) => window.setTimeout(handler, delay),
    persistFullWindowOption: (enabled) => {
      setPlaylistOption(options.status, 'fullwindow', enabled);
      options.persistCurrentPlaylistSettings();
    },
    syncFullWindowButtonState: (enabled) => {
      syncWindowFullButtonState(options.buttonWindowFull, enabled);
    },
    syncMenuCollapseButtonState: (minimized) => {
      syncMenuCollapseButtonState(options.menuCollapseButton, minimized);
    },
    onCaptionRefresh: () => {
      toggleAmbientCaptionBindings({
        bodyElement: options.body,
        captionElement: options.mediaCaption,
        fallbackWidth: options.currentWindowSize.width,
      });
    },
  });
}
