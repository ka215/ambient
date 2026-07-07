import Sortable from 'sortablejs';
import type { MediaItem } from '../types/ambient';
import { createPlaylistModeRuntimeController } from './playlist-mode-runtime';
import { bindPlaylistConfirmModalControls, bindPlaylistModeControls } from './playlist-mode-controls';
import { createPlaylistConfirmModalController } from './modals';
import { createPlaylistReorderRuntimeController } from './playlist-reorder-runtime';
import type { PlaylistMode } from './playlist-view';

export interface PlaylistModeBindingsResult {
  closePlaylistModeMenu(): void;
  destroyPlaylistSortable(): void;
  ensurePlaylistSortable(): void;
  isPlaylistInteractionLocked(): boolean;
  isReorderDirty(): boolean;
  resetReorderState(): void;
  setPlaylistMode(nextMode: PlaylistMode): void;
  syncDeleteSelectionIndicator(itemElm: HTMLElement, isSelected: boolean): void;
  syncPlaylistModeAvailability(visibleItemCount: number): void;
  updatePlaylistModeUi(): void;
}

export function bindAmbientPlaylistMode(options: {
  playlistModeUi: {
    button: HTMLButtonElement | null;
    menu: HTMLElement | null;
    buttonIcon: HTMLElement | null;
    buttonLabel: HTMLElement | null;
  };
  defaultPlaylistModeButtonIcon: string;
  defaultPlaylistModeButtonLabel: string;
  listElement: HTMLElement;
  confirmModal: {
    modal: HTMLElement | null;
    title: HTMLElement | null;
    body: HTMLElement | null;
    applyButton: HTMLButtonElement | null;
    cancelButton: HTMLButtonElement | null;
  };
  getPlaylistMode(): PlaylistMode;
  setPlaylistModeState(mode: PlaylistMode): void;
  getStatus(): {
    ctg: number | null;
    media: MediaItem[] | null;
    playlist: string | null;
  };
  setMediaItems(mediaItems: MediaItem[]): void;
  getVisibleItems(): MediaItem[];
  canMutatePlaylist(): boolean;
  canUseReorderMode(): boolean;
  isCloud(): boolean;
  myPlaylistName: string;
  hasStoredMyPlaylist(): boolean;
  getDeleteSelectedIds(): Set<number>;
  clearDeleteSelections(): void;
  canDiscardEditLeave(): boolean;
  discardEditState(): void;
  updatePlaylist(): void;
  syncModeButton(mode: PlaylistMode): void;
  syncDeleteSelectionIndicator(itemElm: HTMLElement, isSelected: boolean): void;
  persistCurrentPlaylistMutation(): Promise<{ ok: boolean; message: string }>;
  updateNotice(notification: NotificationPayload): void;
  getLocalizedMessage(key: string, fallback?: string): string;
}): PlaylistModeBindingsResult {
  const deleteSelectedIds = options.getDeleteSelectedIds();

  const playlistConfirmModal = createPlaylistConfirmModalController({
    modal: options.confirmModal.modal,
    title: options.confirmModal.title,
    body: options.confirmModal.body,
  });

  const playlistReorderRuntime = createPlaylistReorderRuntimeController({
    listElement: options.listElement,
    getCategoryId: () => options.getStatus().ctg,
    getVisibleItems: options.getVisibleItems,
    getMediaItems: () => options.getStatus().media,
    setMediaItems: options.setMediaItems,
    canMutatePlaylist: options.canMutatePlaylist,
    canUseReorderMode: options.canUseReorderMode,
    sortableLibrary: Sortable,
    onPersist: () => {},
  });

  async function commitDeleteSelections(): Promise<void> {
    if (!options.canMutatePlaylist()) {
      deleteSelectedIds.clear();
      options.updateNotice({
        type: 'error',
        message: options.getLocalizedMessage('mediaEditSaveFailed', 'Failed to save media changes.'),
        delay: 2600,
      });
      return;
    }

    const status = options.getStatus();
    if (!status.media || deleteSelectedIds.size === 0) {
      return;
    }

    const previousMedia = status.media;
    const nextMedia = previousMedia.filter((item: MediaItem) => !deleteSelectedIds.has(item.amId));
    options.setMediaItems(nextMedia);
    deleteSelectedIds.clear();
    options.setPlaylistModeState('normal');
    playlistModeRuntime.updateUi();
    options.updatePlaylist();

    const persistResult = await options.persistCurrentPlaylistMutation();
    if (!persistResult.ok) {
      options.setMediaItems(previousMedia);
      options.updatePlaylist();
      options.updateNotice({
        type: 'error',
        message: persistResult.message || options.getLocalizedMessage('mediaEditSaveFailed', 'Failed to save media changes.'),
        delay: 2600,
      });
      return;
    }

    options.updateNotice({
      type: 'success',
      message: persistResult.message || options.getLocalizedMessage('Playlist saved successfully.', 'Playlist saved successfully.'),
      delay: 2200,
    });
  }

  const playlistModeRuntime = createPlaylistModeRuntimeController({
    playlistModeUi: options.playlistModeUi,
    getMode: options.getPlaylistMode,
    setModeState: options.setPlaylistModeState,
    syncModeButton: options.syncModeButton,
    getStatus: options.getStatus,
    canMutatePlaylist: options.canMutatePlaylist,
    sortableAvailable: () => typeof Sortable !== 'undefined' && typeof Sortable.create === 'function',
    isCloud: options.isCloud,
    myPlaylistName: options.myPlaylistName,
    hasStoredMyPlaylist: options.hasStoredMyPlaylist,
    getDeleteSelectionCount: () => deleteSelectedIds.size,
    clearDeleteSelections: options.clearDeleteSelections,
    resetReorderState: () => {
      playlistReorderRuntime.reset();
    },
    captureReorderSnapshot: () => {
      playlistReorderRuntime.captureSnapshot();
    },
    syncReorderWorkingIdsFromDom: () => {
      playlistReorderRuntime.syncWorkingIdsFromDom();
    },
    restoreReorderInitialOrder: () => {
      playlistReorderRuntime.restoreInitialOrder();
    },
    isReorderDirty: () => playlistReorderRuntime.isDirty(),
    canDiscardEditLeave: options.canDiscardEditLeave,
    discardEditState: options.discardEditState,
    updatePlaylist: options.updatePlaylist,
    openDeleteConfirm: () => {
      const title = options.playlistModeUi.button?.dataset['confirmDeleteTitle'] || 'Delete selected items?';
      const body = options.playlistModeUi.button?.dataset['confirmDeleteBody'] || 'Selected items will be removed from your playlist.';
      playlistConfirmModal.open(title, body, () => {
        void commitDeleteSelections();
      }, () => {
        if (options.getPlaylistMode() === 'reorder') {
          playlistReorderRuntime.restoreInitialOrder();
          options.updatePlaylist();
        }
      });
    },
    openReorderConfirm: () => {
      const title = options.playlistModeUi.button?.dataset['confirmReorderTitle'] || 'Apply reordered sequence?';
      const body = options.playlistModeUi.button?.dataset['confirmReorderBody'] || 'Apply the current item order to your playlist.';
      playlistConfirmModal.open(title, body, () => {
        playlistReorderRuntime.applyChanges();
        options.setPlaylistModeState('normal');
        playlistModeRuntime.updateUi();
        options.updatePlaylist();
      }, () => {
        if (options.getPlaylistMode() === 'reorder') {
          playlistReorderRuntime.restoreInitialOrder();
          options.updatePlaylist();
        }
      });
    },
  });

  if (options.playlistModeUi.button && options.playlistModeUi.menu) {
    bindPlaylistModeControls({
      button: options.playlistModeUi.button,
      menu: options.playlistModeUi.menu,
      onModeButtonClick: () => {
        playlistModeRuntime.handleModeButtonClick();
      },
      onModeSelect: (nextMode) => {
        playlistModeRuntime.setMode(nextMode);
      },
      closeMenu: () => {
        playlistModeRuntime.closeMenu();
      },
    });
    playlistModeRuntime.updateUi();
  }

  bindPlaylistConfirmModalControls({
    modal: options.confirmModal.modal,
    applyButton: options.confirmModal.applyButton,
    cancelButton: options.confirmModal.cancelButton,
    onApply: () => {
      playlistConfirmModal.apply();
    },
    onCancel: () => {
      playlistConfirmModal.cancel();
    },
  });

  return {
    closePlaylistModeMenu: () => playlistModeRuntime.closeMenu(),
    destroyPlaylistSortable: () => playlistReorderRuntime.reset(),
    ensurePlaylistSortable: () => {
      if (options.getPlaylistMode() !== 'reorder') {
        playlistReorderRuntime.reset();
        return;
      }
      playlistReorderRuntime.ensureSortable();
    },
    isPlaylistInteractionLocked: () => playlistModeRuntime.isInteractionLocked(),
    isReorderDirty: () => playlistReorderRuntime.isDirty(),
    resetReorderState: () => playlistReorderRuntime.reset(),
    setPlaylistMode: (nextMode) => playlistModeRuntime.setMode(nextMode),
    syncDeleteSelectionIndicator: options.syncDeleteSelectionIndicator,
    syncPlaylistModeAvailability: (visibleItemCount) => playlistModeRuntime.onViewItemCountChanged(visibleItemCount),
    updatePlaylistModeUi: () => playlistModeRuntime.updateUi(),
  };
}
