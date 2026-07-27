import type { InitializeViewportRuntimeWiringOptions } from './viewport-runtime-wiring-init';

export interface CreateViewportRuntimeWiringFacadeOptions {
  body: HTMLElement;
  menu: HTMLElement;
  menuCollapseButton: HTMLButtonElement | null;
  toggleWindowFullInput: HTMLInputElement | null;
  drawerPlaylist: HTMLElement | null;
  drawerSettings: HTMLElement | null;
  playlistButton: HTMLButtonElement | null;
  settingsButton: HTMLButtonElement | null;
  currentWindowSize: InitializeViewportRuntimeWiringOptions['currentWindowSize'];
  buttonWindowFull: HTMLButtonElement | null;
  mediaCaption: HTMLElement;
  status: InitializeViewportRuntimeWiringOptions['status'];
  persistMyPlaylistIfNeeded: InitializeViewportRuntimeWiringOptions['persistMyPlaylistIfNeeded'];
  getPlayer: InitializeViewportRuntimeWiringOptions['getPlayer'];
}

export function createViewportRuntimeWiringFacade(
  options: CreateViewportRuntimeWiringFacadeOptions
): InitializeViewportRuntimeWiringOptions {
  return {
    body: options.body,
    menu: options.menu,
    menuCollapseButton: options.menuCollapseButton,
    toggleWindowFullInput: options.toggleWindowFullInput,
    drawerPlaylist: options.drawerPlaylist,
    drawerSettings: options.drawerSettings,
    playlistButton: options.playlistButton,
    settingsButton: options.settingsButton,
    currentWindowSize: options.currentWindowSize,
    buttonWindowFull: options.buttonWindowFull,
    mediaCaption: options.mediaCaption,
    status: options.status,
    persistMyPlaylistIfNeeded: options.persistMyPlaylistIfNeeded,
    getPlayer: options.getPlayer,
  };
}
