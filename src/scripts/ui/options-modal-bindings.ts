import { bindAddMediaTrigger } from './app-controls';
import {
  isResponsiveDrawerOpen,
  syncDrawerToggleButtonState,
} from './drawers';
import {
  expandMediaManagementWhenOptionsModalVisible,
  type OptionsModalController,
  type PlaylistDescModalController,
} from './modals';

interface AmbientMutationObserverTarget extends Node {}

interface AmbientOptionsModalBindingsOptions {
  triggerButton: HTMLButtonElement | null;
  closeButton: HTMLButtonElement | null;
  optionsButton: HTMLButtonElement | null;
  playlistButton: HTMLButtonElement | null;
  settingsButton: HTMLButtonElement | null;
  modal: HTMLElement | null;
  drawerPlaylist: HTMLElement | null;
  drawerSettings: HTMLElement | null;
  collapseMenu: HTMLElement | null;
  optionsModal: OptionsModalController;
  playlistDescModal: PlaylistDescModalController;
  playlistDescCloseButton: HTMLButtonElement | null;
  playlistDescBackdrop: HTMLElement | null;
  playlistDescManagementLink: HTMLAnchorElement | null;
  getActiveCategoryId(): number | null;
  clearCategory(): void;
  updateCategory(): void;
  syncMediaCategoryField(preferredCategoryId?: number | null): void;
  syncMediaVolumeField(): void;
  ensureAccordionPanel(panelId: string): void;
  openPlaylistManagementCategoryCreate(): void;
  closeMediaEditCategoryDropdown(restoreFocus?: boolean): void;
  closeMediaEditModal(restoreFocus?: boolean): void;
  trapMediaEditModalFocus(evt: KeyboardEvent): void;
  isMediaEditModalVisible(): boolean;
  isMediaEditCategoryDropdownVisible(): boolean;
  scrollToFocusItem(): void;
  watcher(
    target: AmbientMutationObserverTarget | AmbientMutationObserverTarget[] | null,
    callback: (mutation: MutationRecord) => void,
    option?: MutationObserverInit
  ): void;
}

export interface AmbientOptionsModalBindings {
  hideOptionsModal(): void;
  isOptionsModalVisible(): boolean;
  openMediaManagement(presetCategoryId?: number | null): void;
  showOptionsModal(): void;
}

function isElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

export function bindAmbientOptionsModal(options: AmbientOptionsModalBindingsOptions): AmbientOptionsModalBindings {
  const restoreOptionsTriggerFocus = (): void => {
    if (isElement(options.optionsButton)) {
      options.optionsButton.focus();
    }
  };

  const isOptionsModalVisible = (): boolean => {
    return options.optionsModal.isVisible();
  };

  const syncDrawerToggleButtons = (): void => {
    syncDrawerToggleButtonState({
      button: options.playlistButton,
      active: isResponsiveDrawerOpen(options.drawerPlaylist, '-translate-x-full'),
    });
    syncDrawerToggleButtonState({
      button: options.settingsButton,
      active: isResponsiveDrawerOpen(options.drawerSettings, 'translate-x-full'),
    });
  };

  const hideOptionsModal = (): void => {
    options.optionsModal.hide();
  };

  const showOptionsModal = (): void => {
    options.optionsModal.show();
  };

  const bindAddMediaFromDrawer = (addButton: Element): void => {
    bindAddMediaTrigger({
      trigger: addButton,
      onActivate: (evt: Event) => {
        evt.preventDefault();
        evt.stopPropagation();
        openMediaManagement(options.getActiveCategoryId());
      },
    });
  };

  const openMediaManagement = (presetCategoryId: number | null = null): void => {
    options.clearCategory();
    options.updateCategory();
    options.syncMediaCategoryField(presetCategoryId);
    showOptionsModal();
    expandMediaManagementWhenOptionsModalVisible({
      modal: options.modal,
      presetCategoryId,
      ensureAccordionPanel: options.ensureAccordionPanel,
      syncMediaCategoryField: options.syncMediaCategoryField,
      syncMediaVolumeField: options.syncMediaVolumeField,
    });
  };

  options.watcher(options.modal, (mutation: MutationRecord) => {
    if (mutation.type !== 'attributes') {
      return;
    }

    const modalElm = mutation.target as HTMLElement;
    const activeElm = document.activeElement;
    const isModalHidden = modalElm.getAttribute('aria-hidden') === 'true' || modalElm.classList.contains('hidden');
    const isFocusInsideModal = activeElm instanceof HTMLElement && modalElm.contains(activeElm);

    if (isModalHidden && isFocusInsideModal) {
      restoreOptionsTriggerFocus();
    }

    if (isModalHidden) {
      options.optionsModal.cleanupBackdrops();
    }
  }, { attributes: true, childList: false, subtree: false, attributeFilter: ['aria-hidden', 'class'] });

  options.watcher(options.drawerPlaylist, (mutation: MutationRecord) => {
    if (mutation.type !== 'attributes') {
      return;
    }
    syncDrawerToggleButtons();
    if (mutation.attributeName === 'aria-modal' && (mutation.target as HTMLElement).ariaModal === 'true') {
      options.scrollToFocusItem();
    }
  }, { attributes: true, childList: false, subtree: true, attributeFilter: ['aria-modal', 'class'] });

  options.watcher(options.drawerSettings, () => {
    syncDrawerToggleButtons();
  }, { attributes: true, childList: false, subtree: true, attributeFilter: ['aria-modal', 'class'] });

  syncDrawerToggleButtons();

  const addFromDrawerButton = document.getElementById('btn-add-media-from-drawer');
  if (addFromDrawerButton) {
    bindAddMediaFromDrawer(addFromDrawerButton);
  }

  options.watcher(options.collapseMenu, (mutation: MutationRecord) => {
    if (mutation.attributeName !== 'aria-expanded' || (mutation.target as HTMLElement).ariaExpanded !== 'true') {
      return;
    }

    const collapseItemId = (mutation.target as HTMLElement).getAttribute('aria-controls');
    if (!collapseItemId) {
      return;
    }

    const collapseItem = document.getElementById(collapseItemId);
    if (!collapseItem?.firstElementChild) {
      return;
    }

    const panelBody = collapseItem.firstElementChild as HTMLElement;
    panelBody.setAttribute('style', 'max-height: calc(100vh - 420px)');
    panelBody.scrollTop = 0;
  }, { attributes: true, childList: false, subtree: true, attributeFilter: ['aria-expanded'] });

  options.triggerButton?.addEventListener('click', (evt: Event) => {
    evt.preventDefault();
    if (isOptionsModalVisible()) {
      hideOptionsModal();
      return;
    }
    options.clearCategory();
    options.updateCategory();
    options.syncMediaCategoryField();
    showOptionsModal();
  });

  if (options.closeButton) {
    options.closeButton.addEventListener('click', () => {
      restoreOptionsTriggerFocus();
    }, true);

    options.closeButton.addEventListener('click', (evt: Event) => {
      evt.preventDefault();
      hideOptionsModal();
    });
  }

  options.modal?.addEventListener('pointerdown', (evt: PointerEvent) => {
    options.optionsModal.handleBackdropPointerDown(evt);
  });

  options.modal?.addEventListener('click', (evt: Event) => {
    options.optionsModal.handleBackdropClick(evt, restoreOptionsTriggerFocus);
  });

  document.addEventListener('keydown', (evt: KeyboardEvent) => {
    if (evt.key === 'Escape' && options.isMediaEditModalVisible() && options.isMediaEditCategoryDropdownVisible()) {
      evt.preventDefault();
      options.closeMediaEditCategoryDropdown(true);
      return;
    }
    if (evt.key === 'Escape' && options.isMediaEditModalVisible()) {
      evt.preventDefault();
      options.closeMediaEditModal(true);
      return;
    }
    if (evt.key === 'Tab' && options.isMediaEditModalVisible()) {
      options.trapMediaEditModalFocus(evt);
      return;
    }
    if (evt.key === 'Escape' && isOptionsModalVisible()) {
      hideOptionsModal();
      restoreOptionsTriggerFocus();
    } else if (evt.key === 'Escape' && options.playlistDescModal.isOpen()) {
      options.playlistDescModal.close(true);
    }
  });

  options.playlistDescCloseButton?.addEventListener('click', (evt: Event) => {
    evt.preventDefault();
    options.playlistDescModal.close(true);
  });

  options.playlistDescBackdrop?.addEventListener('click', (evt: Event) => {
    evt.preventDefault();
    options.playlistDescModal.close(false);
  });

  options.playlistDescManagementLink?.addEventListener('click', (evt: Event) => {
    evt.preventDefault();
    options.openPlaylistManagementCategoryCreate();
  });

  return {
    hideOptionsModal,
    isOptionsModalVisible,
    openMediaManagement,
    showOptionsModal,
  };
}
