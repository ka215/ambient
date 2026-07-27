import type { MediaItem } from '../types/ambient';
import {
  canUseAnyPlaylistMode,
  canUsePlaylistEditMode,
  canUsePlaylistReorderMode,
  getPlaylistItemsForView,
  resolvePlaylistModeButtonAction,
  resolvePlaylistModeTransition,
  shouldResetPlaylistOperationMode,
} from '../state/playlist-mode-state';
import type { PlaylistMode } from './playlist-view';
import {
  closePlaylistModeMenu as closePlaylistModeMenuView,
  syncPlaylistModeAvailabilityButton,
  togglePlaylistModeMenu as togglePlaylistModeMenuView,
  updatePlaylistModeMenuState,
} from './playlist-view';

export interface PlaylistModeRuntimeController {
  closeMenu(): void;
  getVisibleItems(): MediaItem[];
  handleModeButtonClick(): void;
  isInteractionLocked(): boolean;
  onViewItemCountChanged(visibleItemCount: number): void;
  setMode(nextMode: PlaylistMode): void;
  updateUi(): void;
}

export function createPlaylistModeRuntimeController(options: {
  playlistModeUi: {
    button: HTMLButtonElement | null;
    menu: HTMLElement | null;
    buttonIcon: HTMLElement | null;
    buttonLabel: HTMLElement | null;
  };
  getMode: () => PlaylistMode;
  setModeState: (mode: PlaylistMode) => void;
  syncModeButton: (mode: PlaylistMode) => void;
  getStatus: () => {
    ctg: number | null;
    media: MediaItem[] | null;
    playlist: string | null;
  };
  canMutatePlaylist: () => boolean;
  sortableAvailable: () => boolean;
  isCloud: () => boolean;
  myPlaylistName: string;
  hasStoredMyPlaylist: () => boolean;
  getDeleteSelectionCount: () => number;
  clearDeleteSelections: () => void;
  resetReorderState: () => void;
  captureReorderSnapshot: () => void;
  syncReorderWorkingIdsFromDom: () => void;
  restoreReorderInitialOrder: () => void;
  isReorderDirty: () => boolean;
  canDiscardEditLeave: () => boolean;
  discardEditState: () => void;
  updatePlaylist: () => void;
  openDeleteConfirm: () => void;
  openReorderConfirm: () => void;
}): PlaylistModeRuntimeController {
  const getVisibleItems = (): MediaItem[] => {
    const status = options.getStatus();
    return getPlaylistItemsForView(status.media, status.ctg);
  };

  const canUseEditMode = (): boolean => {
    const status = options.getStatus();
    return canUsePlaylistEditMode({
      playlist: status.playlist,
      visibleItems: getVisibleItems(),
      isCloud: options.isCloud(),
      myPlaylistName: options.myPlaylistName,
      hasStoredMyPlaylist: options.hasStoredMyPlaylist(),
    });
  };

  const canUseReorderMode = (): boolean => {
    const status = options.getStatus();
    return canUsePlaylistReorderMode({
      canMutatePlaylist: options.canMutatePlaylist(),
      sortableAvailable: options.sortableAvailable(),
      categoryId: status.ctg,
      visibleItems: getVisibleItems(),
    });
  };

  const closeMenu = (): void => {
    closePlaylistModeMenuView(options.playlistModeUi);
  };

  const toggleMenu = (forceOpen = false): void => {
    togglePlaylistModeMenuView(options.playlistModeUi, forceOpen);
  };

  const updateUi = (): void => {
    const currentMode = options.getMode();
    options.syncModeButton(currentMode);
    updatePlaylistModeMenuState(
      options.playlistModeUi,
      currentMode,
      canUseEditMode(),
      canUseReorderMode()
    );
  };

  const resetOperationMode = (): void => {
    options.clearDeleteSelections();
    options.resetReorderState();
    options.discardEditState();
    options.setModeState('normal');
    updateUi();
  };

  const onViewItemCountChanged = (visibleItemCount: number): void => {
    if (!options.playlistModeUi.button) {
      return;
    }
    const canUsePlaylistModes = canUseAnyPlaylistMode({
      visibleItemCount,
      canUseEditMode: canUseEditMode(),
      canMutatePlaylist: options.canMutatePlaylist(),
    });
    if (!canUsePlaylistModes) {
      closeMenu();
      if (shouldResetPlaylistOperationMode(options.getMode(), canUsePlaylistModes)) {
        resetOperationMode();
      }
    }
    syncPlaylistModeAvailabilityButton(options.playlistModeUi.button, canUsePlaylistModes);
    updateUi();
  };

  const setMode = (nextMode: PlaylistMode): void => {
    const transition = resolvePlaylistModeTransition({
      currentMode: options.getMode(),
      nextMode,
      canUseEditMode: canUseEditMode(),
      canMutatePlaylist: options.canMutatePlaylist(),
      canUseReorderMode: canUseReorderMode(),
    });

    if (transition.kind === 'reject_edit' || transition.kind === 'reject_reorder') {
      closeMenu();
      updateUi();
      return;
    }
    if (transition.kind === 'reject_mutation') {
      closeMenu();
      onViewItemCountChanged(getVisibleItems().length);
      return;
    }
    if (transition.kind === 'same_mode') {
      closeMenu();
      return;
    }
    if (transition.kind === 'confirm_edit_leave') {
      if (!options.canDiscardEditLeave()) {
        closeMenu();
        updateUi();
        return;
      }
      options.discardEditState();
    }
    if (transition.kind === 'apply') {
      if (transition.clearDeleteSelections) {
        options.clearDeleteSelections();
      }
      if (transition.resetReorderOnLeave) {
        options.resetReorderState();
      }
      if (transition.captureReorderOnEnter) {
        options.captureReorderSnapshot();
      }
    }

    options.setModeState(nextMode);
    closeMenu();
    updateUi();
    options.updatePlaylist();
  };

  const handleModeButtonClick = (): void => {
    if (options.getMode() === 'reorder') {
      options.syncReorderWorkingIdsFromDom();
    }

    const action = resolvePlaylistModeButtonAction({
      currentMode: options.getMode(),
      deleteSelectionCount: options.getDeleteSelectionCount(),
      reorderDirty: options.isReorderDirty(),
    });

    if (action.kind === 'toggle_menu') {
      toggleMenu();
      return;
    }

    closeMenu();

    if (action.kind === 'confirm_delete') {
      options.openDeleteConfirm();
      return;
    }

    if (action.kind === 'confirm_reorder') {
      options.openReorderConfirm();
      return;
    }

    if (action.kind === 'exit_delete') {
      options.clearDeleteSelections();
    } else if (action.kind === 'exit_reorder') {
      options.resetReorderState();
    }

    options.setModeState('normal');
    updateUi();
    options.updatePlaylist();
  };

  return {
    closeMenu,
    getVisibleItems,
    handleModeButtonClick,
    isInteractionLocked: () => options.getMode() !== 'normal',
    onViewItemCountChanged,
    setMode,
    updateUi,
  };
}
