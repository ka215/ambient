import type { NoticeController } from '../ui/notifications';
import { isElement, watcher } from '../shared/dom-utils';
import { initializeOptionsModalRuntime } from './options-modal-runtime-init';

type InitializeOptionsModalRuntimeOptions = Parameters<typeof initializeOptionsModalRuntime>[0];

export type InitializeOptionsSurfaceRuntimeOptions = {
  document: Document;
  alertElement: HTMLElement | null;
  noticeController: NoticeController | null;
} & Omit<InitializeOptionsModalRuntimeOptions, 'document' | 'watcher'>;

export function initializeOptionsSurfaceRuntime(options: InitializeOptionsSurfaceRuntimeOptions) {
  if (isElement(options.alertElement)) {
    options.noticeController?.hideLegacyAlert();
  }

  return initializeOptionsModalRuntime({
    document: options.document,
    triggerButton: options.triggerButton,
    closeButton: options.closeButton,
    optionsButton: options.optionsButton,
    playlistButton: options.playlistButton,
    settingsButton: options.settingsButton,
    modal: options.modal,
    drawerPlaylist: options.drawerPlaylist,
    drawerSettings: options.drawerSettings,
    collapseMenu: options.collapseMenu,
    optionsModal: options.optionsModal as never,
    playlistDescModal: options.playlistDescModal as never,
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
    watcher,
  });
}
