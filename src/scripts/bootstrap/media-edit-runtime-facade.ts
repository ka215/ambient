import type { MediaEditRuntime } from './media-edit-runtime-init';

export interface MediaEditRuntimeFacade {
  isCategoryDropdownVisible: MediaEditRuntime['isMediaEditCategoryDropdownVisible'];
  closeCategoryDropdown: MediaEditRuntime['closeMediaEditCategoryDropdown'];
  closeModal: MediaEditRuntime['closeMediaEditModal'];
  hideModal: MediaEditRuntime['hideMediaEditModal'];
  openModal: MediaEditRuntime['openMediaEditModal'];
  confirmDiscard: MediaEditRuntime['confirmDiscardActiveMediaEditIfNeeded'];
  clearContext: MediaEditRuntime['clearMediaEditContext'];
  discardDraft: MediaEditRuntime['discardActiveMediaEditDraft'];
  persistCurrentPlaylist: MediaEditRuntime['persistMediaEditForCurrentPlaylist'];
  getActiveItem: MediaEditRuntime['getActiveItem'];
}

export function createMediaEditRuntimeFacade(runtime: MediaEditRuntime): MediaEditRuntimeFacade {
  return {
    isCategoryDropdownVisible: runtime.isMediaEditCategoryDropdownVisible,
    closeCategoryDropdown: runtime.closeMediaEditCategoryDropdown,
    closeModal: runtime.closeMediaEditModal,
    hideModal: runtime.hideMediaEditModal,
    openModal: runtime.openMediaEditModal,
    confirmDiscard: runtime.confirmDiscardActiveMediaEditIfNeeded,
    clearContext: runtime.clearMediaEditContext,
    discardDraft: runtime.discardActiveMediaEditDraft,
    persistCurrentPlaylist: runtime.persistMediaEditForCurrentPlaylist,
    getActiveItem: runtime.getActiveItem,
  };
}
