import type { InitializePlaylistRuntimeWiringOptions } from './playlist-runtime-wiring-init';

export interface CreatePlaylistRuntimeWiringFacadeOptions {
  status: InitializePlaylistRuntimeWiringOptions['status'];
  ambientData: InitializePlaylistRuntimeWiringOptions['ambientData'];
  myPlaylistName: string;
  hasStoredMyPlaylist: InitializePlaylistRuntimeWiringOptions['hasStoredMyPlaylist'];
  selectElement: HTMLSelectElement | null;
  sanitizeMediaItem: InitializePlaylistRuntimeWiringOptions['sanitizeMediaItem'];
  applyPendingCategoryResume: InitializePlaylistRuntimeWiringOptions['applyPendingCategoryResume'];
  applyPendingMediaResume: InitializePlaylistRuntimeWiringOptions['applyPendingMediaResume'];
  updatePlaylist: InitializePlaylistRuntimeWiringOptions['updatePlaylist'];
  updatePlayStatus: InitializePlaylistRuntimeWiringOptions['updatePlayStatus'];
  getDefaultMediaItemForCurrentView: InitializePlaylistRuntimeWiringOptions['getDefaultMediaItemForCurrentView'];
  logger: InitializePlaylistRuntimeWiringOptions['logger'];
  resetPlaylistRuntimeState: InitializePlaylistRuntimeWiringOptions['resetPlaylistRuntimeState'];
  applyCloudEditRestrictions: InitializePlaylistRuntimeWiringOptions['applyCloudEditRestrictions'];
  setPlaylistReadyState: InitializePlaylistRuntimeWiringOptions['setPlaylistReadyState'];
  beginPlaylistLoad: InitializePlaylistRuntimeWiringOptions['beginPlaylistLoad'];
  isPlaylistLoadActive: InitializePlaylistRuntimeWiringOptions['isPlaylistLoadActive'];
  finishPlaylistLoad: InitializePlaylistRuntimeWiringOptions['finishPlaylistLoad'];
  releaseAppBootGate: InitializePlaylistRuntimeWiringOptions['releaseAppBootGate'];
  fetchData: InitializePlaylistRuntimeWiringOptions['fetchData'];
  baseUrl: string;
}

export function createPlaylistRuntimeWiringFacade(
  options: CreatePlaylistRuntimeWiringFacadeOptions
): InitializePlaylistRuntimeWiringOptions {
  return {
    status: options.status,
    ambientData: options.ambientData,
    myPlaylistName: options.myPlaylistName,
    hasStoredMyPlaylist: options.hasStoredMyPlaylist,
    selectElement: options.selectElement,
    sanitizeMediaItem: options.sanitizeMediaItem,
    applyPendingCategoryResume: options.applyPendingCategoryResume,
    applyPendingMediaResume: options.applyPendingMediaResume,
    updatePlaylist: options.updatePlaylist,
    updatePlayStatus: options.updatePlayStatus,
    getDefaultMediaItemForCurrentView: options.getDefaultMediaItemForCurrentView,
    logger: options.logger,
    resetPlaylistRuntimeState: options.resetPlaylistRuntimeState,
    applyCloudEditRestrictions: options.applyCloudEditRestrictions,
    setPlaylistReadyState: options.setPlaylistReadyState,
    beginPlaylistLoad: options.beginPlaylistLoad,
    isPlaylistLoadActive: options.isPlaylistLoadActive,
    finishPlaylistLoad: options.finishPlaylistLoad,
    releaseAppBootGate: options.releaseAppBootGate,
    fetchData: options.fetchData,
    baseUrl: options.baseUrl,
  };
}
