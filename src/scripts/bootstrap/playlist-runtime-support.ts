import type { MediaItem } from '../types/ambient';
import type { PlaylistMode } from '../ui/playlist-view';
import type { PlaylistUiFacade } from './playlist-ui-facade';

export interface CreatePlaylistRuntimeSupportOptions {
  status: AMP_STATUS;
  appBoot: {
    setPlaylistReadyState(isReady: boolean): void;
  };
  getPlaylistUiFacade(): PlaylistUiFacade;
  buildPlaylistJson(options: {
    mediaItems: MediaItem[];
    categories: string[];
    playlistOptions: AMP_STATUS['options'];
    seekFormat: boolean;
  }): string;
  getPlaylistMode(): PlaylistMode;
  setPlaylistMode(mode: PlaylistMode): void;
  getDeleteSelectedIds(): Set<number>;
  clearDeleteSelections(): void;
  mediaEdit: {
    discardDraft(): void;
    hideModal(restoreFocus?: boolean): void;
    clearContext(): void;
    persistCurrentPlaylist(mediaItems: MediaItem[]): Promise<{ ok: boolean; message: string }>;
    getActiveItem(): MediaItem | null;
  };
  playlistDescModal: {
    close(restoreFocus?: boolean): void;
  };
  mediaManagementActionBridge: {
    open(presetCategoryId?: number | null): void;
  };
}

export interface PlaylistRuntimeSupport {
  setPlaylistReadyState(isReady: boolean): void;
  clearCategory(): void;
  updatePlaylist(): void;
  generatePlaylistJson(seekFormat: boolean): string;
  getPlaylistMode(): PlaylistMode;
  setPlaylistMode(mode: PlaylistMode): void;
  getCategoryId(): number | null;
  getMediaItems(): MediaItem[] | null;
  getPlaylistName(): string | null;
  setMediaItems(mediaItems: MediaItem[] | null): void;
  getDeleteSelectedIds(): Set<number>;
  clearDeleteSelections(): void;
  discardEditState(): void;
  persistCurrentPlaylistMutation(): Promise<{ ok: boolean; message: string }>;
  getEditSelectedId(): number | null;
  openMediaManagement(presetCategoryId?: number | null): void;
  closePlaylistDescModal(): void;
  onShuffleItemsChanged(items: MediaItem[] | null): void;
}

export function createPlaylistRuntimeSupport(
  options: CreatePlaylistRuntimeSupportOptions
): PlaylistRuntimeSupport {
  return {
    setPlaylistReadyState: (isReady) => {
      options.appBoot.setPlaylistReadyState(isReady);
    },
    clearCategory: () => {
      options.getPlaylistUiFacade().clearCategory();
    },
    updatePlaylist: () => {
      options.getPlaylistUiFacade().updatePlaylist();
    },
    generatePlaylistJson: (seekFormat) => options.buildPlaylistJson({
      mediaItems: options.status.media || [],
      categories: options.status.category || [],
      playlistOptions: options.status.options,
      seekFormat,
    }),
    getPlaylistMode: options.getPlaylistMode,
    setPlaylistMode: options.setPlaylistMode,
    getCategoryId: () => options.status.ctg,
    getMediaItems: () => options.status.media,
    getPlaylistName: () => options.status.playlist,
    setMediaItems: (mediaItems) => {
      options.status.media = mediaItems;
    },
    getDeleteSelectedIds: options.getDeleteSelectedIds,
    clearDeleteSelections: options.clearDeleteSelections,
    discardEditState: () => {
      options.mediaEdit.discardDraft();
      options.mediaEdit.hideModal(false);
      options.mediaEdit.clearContext();
    },
    persistCurrentPlaylistMutation: () => options.mediaEdit.persistCurrentPlaylist(options.status.media || []),
    getEditSelectedId: () => options.mediaEdit.getActiveItem()?.amId ?? null,
    openMediaManagement: (presetCategoryId = null) => {
      options.mediaManagementActionBridge.open(presetCategoryId);
    },
    closePlaylistDescModal: () => {
      options.playlistDescModal.close(false);
    },
    onShuffleItemsChanged: (items) => {
      options.status.shuffle = items;
    },
  };
}
