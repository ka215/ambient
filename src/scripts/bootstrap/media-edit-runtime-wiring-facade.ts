import type { InitializeMediaEditRuntimeWiringOptions } from './media-edit-runtime-wiring-init';

export interface CreateMediaEditRuntimeWiringFacadeOptions {
  elements: InitializeMediaEditRuntimeWiringOptions['elements'];
  status: InitializeMediaEditRuntimeWiringOptions['status'];
  baseUrl: string;
  playlistListElement: HTMLElement;
  playButton: HTMLButtonElement;
  pauseButton: HTMLButtonElement;
  youtubePlayer: InitializeMediaEditRuntimeWiringOptions['youtubePlayer'];
  playlistMode: InitializeMediaEditRuntimeWiringOptions['playlistMode'];
  closePlaylistModeMenu: InitializeMediaEditRuntimeWiringOptions['closePlaylistModeMenu'];
  defaultVolume: number;
  mediaTitleMaxLength: number;
  mediaArtistMaxLength: number;
  mediaDescMaxLength: number;
  disallowedControlChars: RegExp;
  draftStorageKey: string;
  previewPlayerId: string;
  durationSyncTimeoutMs: number;
  durationSyncPollMs: number;
  saveEndpoint: string;
  thumbnailEndpoint: string;
  thumbnailGenerateEndpoint: string;
  getLocalizedMessage: InitializeMediaEditRuntimeWiringOptions['getLocalizedMessage'];
  updateNotice: InitializeMediaEditRuntimeWiringOptions['updateNotice'];
  getOption: InitializeMediaEditRuntimeWiringOptions['getOption'];
  sanitizeMediaText: InitializeMediaEditRuntimeWiringOptions['sanitizeMediaText'];
  persistCloudPlaylist: InitializeMediaEditRuntimeWiringOptions['persistCloudPlaylist'];
  generatePlaylistJson: InitializeMediaEditRuntimeWiringOptions['generatePlaylistJson'];
  updatePlayStatus: InitializeMediaEditRuntimeWiringOptions['updatePlayStatus'];
  getMediaCategoryName: InitializeMediaEditRuntimeWiringOptions['getMediaCategoryName'];
  clearCategory: InitializeMediaEditRuntimeWiringOptions['clearCategory'];
  updateCategory: InitializeMediaEditRuntimeWiringOptions['updateCategory'];
  syncMediaCategoryField: InitializeMediaEditRuntimeWiringOptions['syncMediaCategoryField'];
  getActiveCategoryId: InitializeMediaEditRuntimeWiringOptions['getActiveCategoryId'];
  updatePlaylist: InitializeMediaEditRuntimeWiringOptions['updatePlaylist'];
  canMutateCurrentPlaylist: InitializeMediaEditRuntimeWiringOptions['canMutateCurrentPlaylist'];
  applyEditRestrictions: InitializeMediaEditRuntimeWiringOptions['applyEditRestrictions'];
  confirm: InitializeMediaEditRuntimeWiringOptions['confirm'];
}

export function createMediaEditRuntimeWiringFacade(
  options: CreateMediaEditRuntimeWiringFacadeOptions
): InitializeMediaEditRuntimeWiringOptions {
  return {
    elements: options.elements,
    status: options.status,
    baseUrl: options.baseUrl,
    playlistListElement: options.playlistListElement,
    playButton: options.playButton,
    pauseButton: options.pauseButton,
    youtubePlayer: options.youtubePlayer,
    playlistMode: options.playlistMode,
    closePlaylistModeMenu: options.closePlaylistModeMenu,
    defaultVolume: options.defaultVolume,
    mediaTitleMaxLength: options.mediaTitleMaxLength,
    mediaArtistMaxLength: options.mediaArtistMaxLength,
    mediaDescMaxLength: options.mediaDescMaxLength,
    disallowedControlChars: options.disallowedControlChars,
    draftStorageKey: options.draftStorageKey,
    previewPlayerId: options.previewPlayerId,
    durationSyncTimeoutMs: options.durationSyncTimeoutMs,
    durationSyncPollMs: options.durationSyncPollMs,
    saveEndpoint: options.saveEndpoint,
    thumbnailEndpoint: options.thumbnailEndpoint,
    thumbnailGenerateEndpoint: options.thumbnailGenerateEndpoint,
    getLocalizedMessage: options.getLocalizedMessage,
    updateNotice: options.updateNotice,
    getOption: options.getOption,
    sanitizeMediaText: options.sanitizeMediaText,
    persistCloudPlaylist: options.persistCloudPlaylist,
    generatePlaylistJson: options.generatePlaylistJson,
    updatePlayStatus: options.updatePlayStatus,
    getMediaCategoryName: options.getMediaCategoryName,
    clearCategory: options.clearCategory,
    updateCategory: options.updateCategory,
    syncMediaCategoryField: options.syncMediaCategoryField,
    getActiveCategoryId: options.getActiveCategoryId,
    updatePlaylist: options.updatePlaylist,
    canMutateCurrentPlaylist: options.canMutateCurrentPlaylist,
    applyEditRestrictions: options.applyEditRestrictions,
    confirm: options.confirm,
  };
}
