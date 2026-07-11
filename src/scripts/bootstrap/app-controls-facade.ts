import type { MediaItem } from '../types/ambient';
import type { PlaylistMode } from '../ui/playlist-view';
import type { InitializeAppControlsRuntimeOptions } from './app-controls-runtime-init';

export interface CreateAmbientAppControlsFacadeOptions {
  status: {
    prev: number | null;
    next: number | null;
    ctg: number | null;
    current: number | null;
    media?: MediaItem[] | null;
  };
  listElement: HTMLElement;
  getPlaylistMode(): PlaylistMode;
  clearDeleteSelections(): void;
  resetReorderState(): void;
  clearMediaEditContext(): void;
  updatePlaylistModeUi(): void;
  updatePlaylist(): void;
  deleteSelectedIds: Set<number>;
  syncDeleteSelectionIndicator(itemElm: HTMLElement, selected: boolean): void;
  isPlaylistInteractionLocked(): boolean;
  openDescriptionModal(payload: {
    titleText: string;
    artistText: string;
    descText: string;
    trigger: HTMLElement;
  }): void;
  getDescriptionPayload(target: HTMLElement | null): {
    titleText: string;
    artistText: string;
    descText: string;
    trigger: HTMLElement;
  } | null;
  openMediaEditModal(item: MediaItem, trigger: HTMLElement): void;
  loadPlaylist(playlist: string): void;
  canDiscardEditMode(): boolean;
  hideMediaEditModal(): void;
  resetPlaylistMode(): void;
  carouselPrevButton: HTMLButtonElement | null;
  carouselNextButton: HTMLButtonElement | null;
  refreshButton: HTMLButtonElement | null;
  windowFullButton: HTMLButtonElement | null;
  windowFullToggle: HTMLInputElement | null;
  menuCollapseButton: HTMLButtonElement | null;
  playButton: HTMLButtonElement | null;
  pauseButton: HTMLButtonElement | null;
  menuElement: HTMLElement | null;
  playItem(target: HTMLElement): void;
  playItemById(playId: number): void;
  isFullWindowMode(): boolean;
  setFullWindowMode(enabled: boolean, forceApply?: boolean, persist?: boolean): void;
  setMenuMinimized(minimized: boolean): void;
  getPlayer(): {
    getPlayerState(): number;
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
  } | null | undefined;
}

export function createAmbientAppControlsFacade(
  options: CreateAmbientAppControlsFacadeOptions
): Pick<InitializeAppControlsRuntimeOptions, 'playlist' | 'playerControls'> {
  return {
    playlist: {
      listElement: options.listElement,
      getPlaylistMode: options.getPlaylistMode,
      clearDeleteSelections: options.clearDeleteSelections,
      resetReorderState: options.resetReorderState,
      clearMediaEditContext: options.clearMediaEditContext,
      updatePlaylistModeUi: options.updatePlaylistModeUi,
      updatePlaylist: options.updatePlaylist,
      deleteSelectedIds: options.deleteSelectedIds,
      syncDeleteSelectionIndicator: options.syncDeleteSelectionIndicator,
      isPlaylistInteractionLocked: options.isPlaylistInteractionLocked,
      openDescriptionModal: options.openDescriptionModal,
      getDescriptionPayload: options.getDescriptionPayload,
      resolveMediaItem: (amId) => options.status.media?.find((item) => item.amId === amId) || null,
      openMediaEditModal: options.openMediaEditModal,
      loadPlaylist: options.loadPlaylist,
      applyCategoryChange: (newCtgId) => {
        options.status.ctg = newCtgId;
        options.status.prev = null;
        options.status.current = null;
        options.status.next = null;
      },
      canDiscardEditMode: options.canDiscardEditMode,
      hideMediaEditModal: options.hideMediaEditModal,
      resetPlaylistMode: options.resetPlaylistMode,
    },
    playerControls: {
      carouselPrevButton: options.carouselPrevButton,
      carouselNextButton: options.carouselNextButton,
      refreshButton: options.refreshButton,
      windowFullButton: options.windowFullButton,
      windowFullToggle: options.windowFullToggle,
      menuCollapseButton: options.menuCollapseButton,
      playButton: options.playButton,
      pauseButton: options.pauseButton,
      menuElement: options.menuElement,
      playItem: options.playItem,
      playItemById: options.playItemById,
      isFullWindowMode: options.isFullWindowMode,
      setFullWindowMode: options.setFullWindowMode,
      setMenuMinimized: options.setMenuMinimized,
      getPlayer: options.getPlayer,
    },
  };
}
