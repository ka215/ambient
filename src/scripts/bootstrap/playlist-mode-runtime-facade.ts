import type { InitializePlaylistModeRuntimeOptions } from './playlist-mode-runtime-init';

export interface CreatePlaylistModeRuntimeFacadeOptions {
  document: Document;
  playlistModeUi: InitializePlaylistModeRuntimeOptions['playlistModeUi'];
  defaultPlaylistModeButtonIcon: string;
  defaultPlaylistModeButtonLabel: string;
  listElement: HTMLElement;
  getPlaylistMode: InitializePlaylistModeRuntimeOptions['getPlaylistMode'];
  setPlaylistModeState: InitializePlaylistModeRuntimeOptions['setPlaylistModeState'];
  getCategoryId: InitializePlaylistModeRuntimeOptions['getCategoryId'];
  getMediaItems: InitializePlaylistModeRuntimeOptions['getMediaItems'];
  getPlaylistName: InitializePlaylistModeRuntimeOptions['getPlaylistName'];
  setMediaItems: InitializePlaylistModeRuntimeOptions['setMediaItems'];
  canMutateCurrentPlaylist: InitializePlaylistModeRuntimeOptions['canMutateCurrentPlaylist'];
  myPlaylistName: string;
  hasStoredMyPlaylist: InitializePlaylistModeRuntimeOptions['hasStoredMyPlaylist'];
  getDeleteSelectedIds: InitializePlaylistModeRuntimeOptions['getDeleteSelectedIds'];
  clearDeleteSelections: InitializePlaylistModeRuntimeOptions['clearDeleteSelections'];
  canDiscardEditLeave: InitializePlaylistModeRuntimeOptions['canDiscardEditLeave'];
  discardEditState: InitializePlaylistModeRuntimeOptions['discardEditState'];
  updatePlaylist: InitializePlaylistModeRuntimeOptions['updatePlaylist'];
  persistCurrentPlaylistMutation: InitializePlaylistModeRuntimeOptions['persistCurrentPlaylistMutation'];
  updateNotice: InitializePlaylistModeRuntimeOptions['updateNotice'];
  getLocalizedMessage: InitializePlaylistModeRuntimeOptions['getLocalizedMessage'];
}

export function createPlaylistModeRuntimeFacade(
  options: CreatePlaylistModeRuntimeFacadeOptions
): InitializePlaylistModeRuntimeOptions {
  return {
    document: options.document,
    playlistModeUi: options.playlistModeUi,
    defaultPlaylistModeButtonIcon: options.defaultPlaylistModeButtonIcon,
    defaultPlaylistModeButtonLabel: options.defaultPlaylistModeButtonLabel,
    listElement: options.listElement,
    getPlaylistMode: options.getPlaylistMode,
    setPlaylistModeState: options.setPlaylistModeState,
    getCategoryId: options.getCategoryId,
    getMediaItems: options.getMediaItems,
    getPlaylistName: options.getPlaylistName,
    setMediaItems: options.setMediaItems,
    canMutateCurrentPlaylist: options.canMutateCurrentPlaylist,
    myPlaylistName: options.myPlaylistName,
    hasStoredMyPlaylist: options.hasStoredMyPlaylist,
    getDeleteSelectedIds: options.getDeleteSelectedIds,
    clearDeleteSelections: options.clearDeleteSelections,
    canDiscardEditLeave: options.canDiscardEditLeave,
    discardEditState: options.discardEditState,
    updatePlaylist: options.updatePlaylist,
    persistCurrentPlaylistMutation: options.persistCurrentPlaylistMutation,
    updateNotice: options.updateNotice,
    getLocalizedMessage: options.getLocalizedMessage,
  };
}
