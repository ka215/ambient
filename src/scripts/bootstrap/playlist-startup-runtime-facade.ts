import type { InitializePlaylistStartupRuntimeOptions } from './playlist-startup-runtime-init';

export interface CreatePlaylistStartupRuntimeFacadeOptions {
  ambientData: InitializePlaylistStartupRuntimeOptions['ambientData'];
  hasStoredMyPlaylist: boolean;
  isPlaylistAvailableForResume: InitializePlaylistStartupRuntimeOptions['isPlaylistAvailableForResume'];
  myPlaylistName: string;
  savedPlaylistContext: InitializePlaylistStartupRuntimeOptions['savedPlaylistContext'];
  requestCategoryResume: InitializePlaylistStartupRuntimeOptions['requestCategoryResume'];
  requestMediaResume: InitializePlaylistStartupRuntimeOptions['requestMediaResume'];
  selectElement: HTMLSelectElement | null;
  loadPlaylist: InitializePlaylistStartupRuntimeOptions['loadPlaylist'];
  initMyPlaylistFromStorage: InitializePlaylistStartupRuntimeOptions['initMyPlaylistFromStorage'];
  setPlaylistReadyState: InitializePlaylistStartupRuntimeOptions['setPlaylistReadyState'];
  releaseAppBoot: InitializePlaylistStartupRuntimeOptions['releaseAppBoot'];
}

export function createPlaylistStartupRuntimeFacade(
  options: CreatePlaylistStartupRuntimeFacadeOptions
): InitializePlaylistStartupRuntimeOptions {
  return {
    ambientData: options.ambientData,
    hasStoredMyPlaylist: options.hasStoredMyPlaylist,
    isPlaylistAvailableForResume: options.isPlaylistAvailableForResume,
    myPlaylistName: options.myPlaylistName,
    savedPlaylistContext: options.savedPlaylistContext,
    requestCategoryResume: options.requestCategoryResume,
    requestMediaResume: options.requestMediaResume,
    selectElement: options.selectElement,
    loadPlaylist: options.loadPlaylist,
    initMyPlaylistFromStorage: options.initMyPlaylistFromStorage,
    setPlaylistReadyState: options.setPlaylistReadyState,
    releaseAppBoot: options.releaseAppBoot,
  };
}
