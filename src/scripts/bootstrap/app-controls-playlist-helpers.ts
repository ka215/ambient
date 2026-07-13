import type { MediaItem } from '../types/ambient';
import type { PlaylistMode } from '../ui/playlist-view';

export interface CreateAppControlsPlaylistHelpersOptions {
  getPlaylistMode(): PlaylistMode;
  clearDeleteSelections(): void;
  resetReorderState(): void;
  clearMediaEditContext(): void;
  updatePlaylistModeUi(): void;
  updatePlaylist(): void;
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
}

export interface AppControlsPlaylistHelpers {
  getPlaylistMode(): PlaylistMode;
  clearDeleteSelections(): void;
  resetReorderState(): void;
  clearMediaEditContext(): void;
  updatePlaylistModeUi(): void;
  updatePlaylist(): void;
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
}

export function createAppControlsPlaylistHelpers(
  options: CreateAppControlsPlaylistHelpersOptions
): AppControlsPlaylistHelpers {
  return {
    getPlaylistMode: options.getPlaylistMode,
    clearDeleteSelections: options.clearDeleteSelections,
    resetReorderState: options.resetReorderState,
    clearMediaEditContext: options.clearMediaEditContext,
    updatePlaylistModeUi: options.updatePlaylistModeUi,
    updatePlaylist: options.updatePlaylist,
    isPlaylistInteractionLocked: options.isPlaylistInteractionLocked,
    openDescriptionModal: options.openDescriptionModal,
    getDescriptionPayload: options.getDescriptionPayload,
    openMediaEditModal: options.openMediaEditModal,
    loadPlaylist: options.loadPlaylist,
    canDiscardEditMode: options.canDiscardEditMode,
    hideMediaEditModal: options.hideMediaEditModal,
    resetPlaylistMode: options.resetPlaylistMode,
  };
}
