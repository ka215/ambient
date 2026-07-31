import { canOpenMediaEditModal, confirmDiscardMediaEditDraft } from '../domain/media-edit/session-state';
import {
  finalizeMediaEditModalClose,
  focusPlaylistItemById as focusPlaylistItemByIdView,
  openManagedMediaEditModal,
  renderMediaEditSourceBadges as renderMediaEditSourceBadgesView,
  resetMediaEditModalView,
} from '../ui/media-edit/modal-view';
import { isPlaybackActive } from '../ui/player/player-shell';
import type { MediaItem } from '../types/ambient';

export interface InitializeMediaEditModalBindingsOptions {
  status: {
    current: number | null;
    playertype: string | null;
    category: string[] | null;
    options: Record<string, unknown> | null;
  };
  modalElement: HTMLElement | null;
  modalTitleElement: HTMLElement | null;
  modalItemTitleElement: HTMLElement | null;
  modalItemSourceElement: HTMLElement | null;
  modalCloseButton: HTMLElement | null;
  playlistListElement: HTMLElement | null;
  playButton: HTMLButtonElement | null;
  pauseButton: HTMLButtonElement | null;
  youtubePlayer: { getPlayerState?: () => number } | null;
  defaultModalTitle: string;
  playlistMode: () => string;
  closePlaylistModeMenu(): void;
  getLocalizedMessage(key: string, fallback?: string): string;
  getMediaCategoryName(mediaItem: MediaItem): string;
  sanitizeMediaTitle(value: string): string;
  resetMediaEditPreviewState(): void;
  clearMediaEditValidationView(): void;
  closeCategoryDropdown(restoreFocus?: boolean): void;
  bindForm(mediaItem: MediaItem): void;
  updatePlaylist(): void;
  createPreview(mediaItem: MediaItem): void;
  startDurationSyncWait(): void;
  getActiveItem(): MediaItem | null;
  getDraftKey(mediaItem: MediaItem): string;
  canMutateCurrentPlaylist(): boolean;
  applyEditRestrictions(): void;
  updateNotice(notification: NotificationPayload): void;
  hasUnsavedDraft(): boolean;
  isDirty(): boolean;
  discardDraft(): void;
  confirm(message: string): boolean;
}

export function initializeMediaEditModalBindings(options: InitializeMediaEditModalBindingsOptions): {
  confirmDiscardActiveMediaEditIfNeeded: (fallbackMessage?: string) => boolean;
  hideMediaEditModal: (restoreFocus?: boolean) => void;
  closeMediaEditModal: (restoreFocus?: boolean) => void;
  cancelMediaEditModal: (restoreFocus?: boolean) => void;
  openMediaEditModal: (mediaItem: MediaItem, trigger: HTMLElement) => void;
} {
  let activeTrigger: HTMLElement | null = null;

  function confirmDiscardActiveMediaEditIfNeeded(
    fallbackMessage: string = options.getLocalizedMessage(
      'mediaEditDiscardUnsaved',
      'Discard unsaved edits?'
    )
  ): boolean {
    return confirmDiscardMediaEditDraft({
      hasUnsavedDraft: options.hasUnsavedDraft(),
      isDirty: options.isDirty(),
      fallbackMessage,
      getLocalizedMessage: options.getLocalizedMessage,
      confirm: (message) => options.confirm(message),
      discardDraft: options.discardDraft,
    });
  }

  function hideMediaEditModal(restoreFocus = false): void {
    if (!options.modalElement) {
      return;
    }

    const editedMediaId = options.getActiveItem()?.amId ?? null;
    options.resetMediaEditPreviewState();
    options.clearMediaEditValidationView();
    const restoreTarget = activeTrigger;
    activeTrigger = null;

    finalizeMediaEditModalClose({
      restoreFocus,
      preferredFocusId: (
        options.playButton
        && options.pauseButton
        && isPlaybackActive({
          currentMediaId: options.status.current,
          playerType: options.status.playertype,
          youtubePlayer: options.youtubePlayer,
          playButton: options.playButton,
          pauseButton: options.pauseButton,
        })
      ) ? options.status.current : editedMediaId,
      restoreTarget,
      resetModalView: () => {
        resetMediaEditModalView({
          modalElement: options.modalElement,
          titleElement: options.modalTitleElement,
          itemTitleElement: options.modalItemTitleElement,
          itemSourceElement: options.modalItemSourceElement,
          defaultTitle: options.defaultModalTitle,
        });
      },
      closeCategoryDropdown: () => options.closeCategoryDropdown(false),
      focusPlaylistItemById: (amId) => focusPlaylistItemByIdView({
        listElement: options.playlistListElement,
        amId,
      }),
    });
  }

  function closeMediaEditModal(restoreFocus = false): void {
    hideMediaEditModal(restoreFocus);
  }

  function cancelMediaEditModal(restoreFocus = false): void {
    options.discardDraft();
    hideMediaEditModal(restoreFocus);
  }

  function openMediaEditModal(mediaItem: MediaItem, trigger: HTMLElement): void {
    if (!options.canMutateCurrentPlaylist()) {
      options.applyEditRestrictions();
      options.updateNotice({
        type: 'error',
        message: options.getLocalizedMessage('mediaEditSaveFailed', 'Failed to save media changes.'),
        delay: 2600,
      });
      return;
    }

    if (!canOpenMediaEditModal({
      mediaItem,
      activeItem: options.getActiveItem(),
      getDraftKey: options.getDraftKey,
      confirmDiscard: confirmDiscardActiveMediaEditIfNeeded,
      getLocalizedMessage: options.getLocalizedMessage,
    })) {
      return;
    }

    openManagedMediaEditModal({
      mediaItem,
      trigger,
      playlistMode: options.playlistMode(),
      setActiveTrigger: (nextTrigger) => {
        activeTrigger = nextTrigger;
      },
      closePlaylistModeMenu: options.closePlaylistModeMenu,
      buildItemTitle: (item) => options.sanitizeMediaTitle(item.title || '')
        || options.getLocalizedMessage('mediaEditUntitled', 'Untitled media'),
      renderSourceBadges: (item) => {
        renderMediaEditSourceBadgesView({
          container: options.modalItemSourceElement,
          mediaItem: item,
          getLocalizedMessage: options.getLocalizedMessage,
          getCategoryName: options.getMediaCategoryName,
        });
      },
      bindForm: options.bindForm,
      updatePlaylist: options.updatePlaylist,
      createPreview: options.createPreview,
      startDurationSyncWait: options.startDurationSyncWait,
      modalElement: options.modalElement,
      titleElement: options.modalTitleElement,
      itemTitleElement: options.modalItemTitleElement,
      closeButton: options.modalCloseButton,
      defaultTitle: options.defaultModalTitle,
    });
  }

  return {
    confirmDiscardActiveMediaEditIfNeeded,
    hideMediaEditModal,
    closeMediaEditModal,
    cancelMediaEditModal,
    openMediaEditModal,
  };
}
