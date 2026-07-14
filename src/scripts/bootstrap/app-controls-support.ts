import type { PlaylistMode } from '../ui/playlist-view';

export interface CreateAppControlsSupportOptions {
  getPlaylistMode(): PlaylistMode;
  clearDeleteSelections(): void;
  getPlaylistUiFacade(): {
    updatePlaylist(): void;
  };
  playlistDescModal: {
    open(titleText: string, artistText: string, descText: string, trigger: HTMLElement): void;
  };
  loadPlaylist(playlist: string): Promise<unknown> | void;
  mediaEdit: {
    confirmDiscard(): boolean;
    hideModal(restoreFocus?: boolean): void;
  };
  setPlaylistMode(mode: PlaylistMode): void;
  playItem(target: HTMLElement | null, playId?: number | null): void;
  statusWatcherSupport: {
    isFullWindowMode(): boolean;
    setFullWindowMode(enabled: boolean, syncOption?: boolean, closeDrawers?: boolean): void;
  };
  viewportRuntime: {
    setMenuMinimized(minimized: boolean): void;
  };
  getPlayer(): {
    getPlayerState(): number;
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
  } | null | undefined;
}

export interface AppControlsSupport {
  getPlaylistMode(): PlaylistMode;
  clearDeleteSelections(): void;
  updatePlaylist(): void;
  openDescriptionModal(payload: {
    titleText: string;
    artistText: string;
    descText: string;
    trigger: HTMLElement;
  }): void;
  loadPlaylist(playlist: string): void;
  canDiscardEditMode(): boolean;
  hideMediaEditModal(): void;
  resetPlaylistMode(): void;
  playItem(target: HTMLElement): void;
  playItemById(playId: number): void;
  isFullWindowMode(): boolean;
  setFullWindowMode(enabled: boolean, syncOption?: boolean, closeDrawers?: boolean): void;
  setMenuMinimized(minimized: boolean): void;
  getPlayer(): {
    getPlayerState(): number;
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
  } | null | undefined;
}

export function createAppControlsSupport(
  options: CreateAppControlsSupportOptions
): AppControlsSupport {
  return {
    getPlaylistMode: options.getPlaylistMode,
    clearDeleteSelections: options.clearDeleteSelections,
    updatePlaylist: () => {
      options.getPlaylistUiFacade().updatePlaylist();
    },
    openDescriptionModal: (payload) => {
      options.playlistDescModal.open(payload.titleText, payload.artistText, payload.descText, payload.trigger);
    },
    loadPlaylist: (playlist) => {
      void options.loadPlaylist(playlist);
    },
    canDiscardEditMode: options.mediaEdit.confirmDiscard,
    hideMediaEditModal: () => {
      options.mediaEdit.hideModal(false);
    },
    resetPlaylistMode: () => {
      options.setPlaylistMode('normal');
    },
    playItem: (target) => {
      options.playItem(target);
    },
    playItemById: (playId) => {
      options.playItem(null, playId);
    },
    isFullWindowMode: options.statusWatcherSupport.isFullWindowMode,
    setFullWindowMode: options.statusWatcherSupport.setFullWindowMode,
    setMenuMinimized: (minimized) => {
      options.viewportRuntime.setMenuMinimized(minimized);
    },
    getPlayer: () => options.getPlayer() ?? null,
  };
}
