import type { InitializePlaylistSessionOptions } from './playlist-session-init';

export interface CreatePlaylistSessionFacadeOptions {
  status: InitializePlaylistSessionOptions['status'];
  playlistLoadGuard: InitializePlaylistSessionOptions['playlistLoadGuard'];
  myPlaylistName: string;
  getRuntimeAmbientData: InitializePlaylistSessionOptions['getRuntimeAmbientData'];
  applyCloudEditRestrictions: InitializePlaylistSessionOptions['applyCloudEditRestrictions'];
  setPlaylistReadyState: InitializePlaylistSessionOptions['setPlaylistReadyState'];
  clearCategory: InitializePlaylistSessionOptions['clearCategory'];
  updatePlaylist: InitializePlaylistSessionOptions['updatePlaylist'];
  generatePlaylistJson: InitializePlaylistSessionOptions['generatePlaylistJson'];
  writeMyPlaylistJson: InitializePlaylistSessionOptions['writeMyPlaylistJson'];
  logger: InitializePlaylistSessionOptions['logger'];
}

export function createPlaylistSessionFacade(
  options: CreatePlaylistSessionFacadeOptions
): InitializePlaylistSessionOptions {
  return {
    status: options.status,
    playlistLoadGuard: options.playlistLoadGuard,
    myPlaylistName: options.myPlaylistName,
    getRuntimeAmbientData: options.getRuntimeAmbientData,
    applyCloudEditRestrictions: options.applyCloudEditRestrictions,
    setPlaylistReadyState: options.setPlaylistReadyState,
    clearCategory: options.clearCategory,
    updatePlaylist: options.updatePlaylist,
    generatePlaylistJson: options.generatePlaylistJson,
    writeMyPlaylistJson: options.writeMyPlaylistJson,
    logger: options.logger,
  };
}
