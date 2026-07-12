import type { InitializeOptionsSurfaceRuntimeOptions } from './options-surface-runtime-init';

export interface CreateOptionsSurfaceFacadeOptions {
  document: Document;
  alertElement: HTMLElement | null;
  noticeController: InitializeOptionsSurfaceRuntimeOptions['noticeController'];
  triggerButton: InitializeOptionsSurfaceRuntimeOptions['triggerButton'];
  closeButton: InitializeOptionsSurfaceRuntimeOptions['closeButton'];
  optionsButton: InitializeOptionsSurfaceRuntimeOptions['optionsButton'];
  playlistButton: InitializeOptionsSurfaceRuntimeOptions['playlistButton'];
  settingsButton: InitializeOptionsSurfaceRuntimeOptions['settingsButton'];
  modal: InitializeOptionsSurfaceRuntimeOptions['modal'];
  drawerPlaylist: InitializeOptionsSurfaceRuntimeOptions['drawerPlaylist'];
  drawerSettings: InitializeOptionsSurfaceRuntimeOptions['drawerSettings'];
  collapseMenu: InitializeOptionsSurfaceRuntimeOptions['collapseMenu'];
  optionsModal: InitializeOptionsSurfaceRuntimeOptions['optionsModal'];
  playlistDescModal: InitializeOptionsSurfaceRuntimeOptions['playlistDescModal'];
  playlistDescCloseButton: InitializeOptionsSurfaceRuntimeOptions['playlistDescCloseButton'];
  playlistDescBackdrop: InitializeOptionsSurfaceRuntimeOptions['playlistDescBackdrop'];
  mediaEditModal: InitializeOptionsSurfaceRuntimeOptions['mediaEditModal'];
  mediaVolumeInput: InitializeOptionsSurfaceRuntimeOptions['mediaVolumeInput'];
  playlistList: InitializeOptionsSurfaceRuntimeOptions['playlistList'];
  defaultVolume: number;
  getVolumeOption: InitializeOptionsSurfaceRuntimeOptions['getVolumeOption'];
  getActiveCategoryId: InitializeOptionsSurfaceRuntimeOptions['getActiveCategoryId'];
  clearCategory: InitializeOptionsSurfaceRuntimeOptions['clearCategory'];
  updateCategory: InitializeOptionsSurfaceRuntimeOptions['updateCategory'];
  syncMediaCategoryField: InitializeOptionsSurfaceRuntimeOptions['syncMediaCategoryField'];
  closeMediaEditCategoryDropdown: InitializeOptionsSurfaceRuntimeOptions['closeMediaEditCategoryDropdown'];
  closeMediaEditModal: InitializeOptionsSurfaceRuntimeOptions['closeMediaEditModal'];
  isMediaEditCategoryDropdownVisible: InitializeOptionsSurfaceRuntimeOptions['isMediaEditCategoryDropdownVisible'];
}

export function createOptionsSurfaceFacade(
  options: CreateOptionsSurfaceFacadeOptions
): InitializeOptionsSurfaceRuntimeOptions {
  return {
    document: options.document,
    alertElement: options.alertElement,
    noticeController: options.noticeController,
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
    mediaEditModal: options.mediaEditModal,
    mediaVolumeInput: options.mediaVolumeInput,
    playlistList: options.playlistList,
    defaultVolume: options.defaultVolume,
    getVolumeOption: options.getVolumeOption,
    getActiveCategoryId: options.getActiveCategoryId,
    clearCategory: options.clearCategory,
    updateCategory: options.updateCategory,
    syncMediaCategoryField: options.syncMediaCategoryField,
    closeMediaEditCategoryDropdown: options.closeMediaEditCategoryDropdown,
    closeMediaEditModal: options.closeMediaEditModal,
    isMediaEditCategoryDropdownVisible: options.isMediaEditCategoryDropdownVisible,
  };
}
