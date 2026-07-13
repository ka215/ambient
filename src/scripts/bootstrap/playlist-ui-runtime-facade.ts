import type { InitializePlaylistUiRuntimeOptions } from './playlist-ui-runtime-init';

export interface CreatePlaylistUiRuntimeFacadeOptions {
  document: Document;
  status: InitializePlaylistUiRuntimeOptions['status'];
  getOption: InitializePlaylistUiRuntimeOptions['getOption'];
  playlistMode: InitializePlaylistUiRuntimeOptions['playlistMode'];
  setPlaylistMode: InitializePlaylistUiRuntimeOptions['setPlaylistMode'];
  deleteSelectedIds: InitializePlaylistUiRuntimeOptions['deleteSelectedIds'];
  getEditSelectedId: InitializePlaylistUiRuntimeOptions['getEditSelectedId'];
  playlistList: InitializePlaylistUiRuntimeOptions['playlistList'];
  targetCategorySelect: InitializePlaylistUiRuntimeOptions['targetCategorySelect'];
  mediaCategorySelect: InitializePlaylistUiRuntimeOptions['mediaCategorySelect'];
  canUseReorderMode: InitializePlaylistUiRuntimeOptions['canUseReorderMode'];
  canMutateCurrentPlaylist: InitializePlaylistUiRuntimeOptions['canMutateCurrentPlaylist'];
  ambientData: InitializePlaylistUiRuntimeOptions['ambientData'];
  getNoMediaImagePath: InitializePlaylistUiRuntimeOptions['getNoMediaImagePath'];
  openMediaManagement: InitializePlaylistUiRuntimeOptions['openMediaManagement'];
  trimTitle: InitializePlaylistUiRuntimeOptions['trimTitle'];
  destroyPlaylistSortable: InitializePlaylistUiRuntimeOptions['destroyPlaylistSortable'];
  closePlaylistDescModal: InitializePlaylistUiRuntimeOptions['closePlaylistDescModal'];
  syncPlaylistModeAvailability: InitializePlaylistUiRuntimeOptions['syncPlaylistModeAvailability'];
  closePlaylistModeMenu: InitializePlaylistUiRuntimeOptions['closePlaylistModeMenu'];
  setPlaylistReadyState: InitializePlaylistUiRuntimeOptions['setPlaylistReadyState'];
  resetReorderState: InitializePlaylistUiRuntimeOptions['resetReorderState'];
  updatePlaylistModeUi: InitializePlaylistUiRuntimeOptions['updatePlaylistModeUi'];
  ensurePlaylistSortable: InitializePlaylistUiRuntimeOptions['ensurePlaylistSortable'];
  execDebug: InitializePlaylistUiRuntimeOptions['execDebug'];
  logger: InitializePlaylistUiRuntimeOptions['logger'];
  applyCloudEditRestrictions: InitializePlaylistUiRuntimeOptions['applyCloudEditRestrictions'];
  onShuffleItemsChanged: InitializePlaylistUiRuntimeOptions['onShuffleItemsChanged'];
}

export function createPlaylistUiRuntimeFacade(
  options: CreatePlaylistUiRuntimeFacadeOptions
): InitializePlaylistUiRuntimeOptions {
  return {
    document: options.document,
    status: options.status,
    getOption: options.getOption,
    playlistMode: options.playlistMode,
    setPlaylistMode: options.setPlaylistMode,
    deleteSelectedIds: options.deleteSelectedIds,
    getEditSelectedId: options.getEditSelectedId,
    playlistList: options.playlistList,
    targetCategorySelect: options.targetCategorySelect,
    mediaCategorySelect: options.mediaCategorySelect,
    canUseReorderMode: options.canUseReorderMode,
    canMutateCurrentPlaylist: options.canMutateCurrentPlaylist,
    ambientData: options.ambientData,
    getNoMediaImagePath: options.getNoMediaImagePath,
    openMediaManagement: options.openMediaManagement,
    trimTitle: options.trimTitle,
    destroyPlaylistSortable: options.destroyPlaylistSortable,
    closePlaylistDescModal: options.closePlaylistDescModal,
    syncPlaylistModeAvailability: options.syncPlaylistModeAvailability,
    closePlaylistModeMenu: options.closePlaylistModeMenu,
    setPlaylistReadyState: options.setPlaylistReadyState,
    resetReorderState: options.resetReorderState,
    updatePlaylistModeUi: options.updatePlaylistModeUi,
    ensurePlaylistSortable: options.ensurePlaylistSortable,
    execDebug: options.execDebug,
    logger: options.logger,
    applyCloudEditRestrictions: options.applyCloudEditRestrictions,
    onShuffleItemsChanged: options.onShuffleItemsChanged,
  };
}
