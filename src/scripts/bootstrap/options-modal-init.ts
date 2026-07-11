import { bindAmbientOptionsModal } from '../ui/options-modal-bindings';
import { isElement } from '../shared/dom-utils';
import { ensureAccordionPanel as ensureAccordionPanelView, openPlaylistManagementCategoryCreate as openPlaylistManagementCategoryCreateView, type OptionsModalController, type PlaylistDescModalController } from '../ui/modals';
import { isMediaEditModalVisible as isMediaEditModalVisibleView, trapMediaEditModalFocus as trapMediaEditModalFocusView } from '../ui/media-edit/modal-view';
import { scrollPlaylistToCurrentFocus } from '../ui/playlist-view';
import { syncAmbientResolvedMediaVolumeField } from '../ui/forms/category-volume-bindings';

type BindAmbientOptionsModalOptions = Parameters<typeof bindAmbientOptionsModal>[0];

export interface InitializeOptionsModalBindingsOptions {
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
  mediaEditModal: HTMLElement | null;
  mediaVolumeInput: HTMLInputElement | null;
  defaultMediaVolumeDisplay: HTMLElement | null;
  playlistList: HTMLElement;
  defaultVolume: number;
  getVolumeOption(): number | null;
  getActiveCategoryId(): number | null;
  clearCategory(): void;
  updateCategory(): void;
  syncMediaCategoryField(preferredCategoryId?: number | null): void;
  closeMediaEditCategoryDropdown(restoreFocus?: boolean): void;
  closeMediaEditModal(restoreFocus?: boolean): void;
  isMediaEditCategoryDropdownVisible(): boolean;
  watcher: BindAmbientOptionsModalOptions['watcher'];
}

export function initializeOptionsModalBindings(options: InitializeOptionsModalBindingsOptions) {
  return bindAmbientOptionsModal({
    triggerButton: options.triggerButton,
    closeButton: options.closeButton,
    optionsButton: options.optionsButton,
    playlistButton: options.playlistButton,
    settingsButton: options.settingsButton,
    modal: options.modal,
    drawerPlaylist: options.drawerPlaylist,
    drawerSettings: options.drawerSettings,
    collapseMenu: options.collapseMenu,
    optionsModal: options.optionsModal,
    playlistDescModal: options.playlistDescModal,
    playlistDescCloseButton: options.playlistDescCloseButton,
    playlistDescBackdrop: options.playlistDescBackdrop,
    playlistDescManagementLink: options.playlistDescManagementLink,
    getActiveCategoryId: options.getActiveCategoryId,
    clearCategory: options.clearCategory,
    updateCategory: options.updateCategory,
    syncMediaCategoryField: options.syncMediaCategoryField,
    syncMediaVolumeField: () => {
      syncAmbientResolvedMediaVolumeField({
        input: options.mediaVolumeInput,
        display: options.defaultMediaVolumeDisplay,
        volume: options.getVolumeOption(),
        defaultVolume: options.getVolumeOption(),
        fallbackVolume: options.defaultVolume,
      });
    },
    ensureAccordionPanel: (panelId) => {
      ensureAccordionPanelView(panelId);
    },
    openPlaylistManagementCategoryCreate: () => {
      openPlaylistManagementCategoryCreateView();
    },
    closeMediaEditCategoryDropdown: options.closeMediaEditCategoryDropdown,
    closeMediaEditModal: options.closeMediaEditModal,
    trapMediaEditModalFocus: (evt) => {
      trapMediaEditModalFocusView({
        modalElement: isElement(options.mediaEditModal) ? options.mediaEditModal : null,
        event: evt,
      });
    },
    isMediaEditModalVisible: () => isMediaEditModalVisibleView(isElement(options.mediaEditModal) ? options.mediaEditModal : null),
    isMediaEditCategoryDropdownVisible: options.isMediaEditCategoryDropdownVisible,
    scrollToFocusItem: () => {
      scrollPlaylistToCurrentFocus(options.playlistList);
    },
    watcher: options.watcher,
  });
}
