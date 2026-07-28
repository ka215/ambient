import type { PlaylistUiFacade } from './playlist-ui-facade';

export interface CreateManagementPlaylistUiHelpersOptions {
  playlistUiFacade: PlaylistUiFacade;
  getCurrentMediaId(): number | null;
  getFirstMediaId(): number | null;
  updatePlayStatus(amId: number): void;
}

export interface ManagementPlaylistUiHelpers {
  updatePlaylist(): void;
  clearCategory(): void;
  updateCategory(): void;
  syncMediaCategoryField(preferredCategoryId?: number | null): void;
  syncPlaybackAfterMediaAdd(): void;
  onCategoryCreated(): void;
  onCategoriesMutated(): void;
}

export function createManagementPlaylistUiHelpers(
  options: CreateManagementPlaylistUiHelpersOptions
): ManagementPlaylistUiHelpers {
  return {
    updatePlaylist: () => {
      options.playlistUiFacade.updatePlaylist();
    },
    clearCategory: () => {
      options.playlistUiFacade.clearCategory();
    },
    updateCategory: () => {
      options.playlistUiFacade.updateCategory();
    },
    syncMediaCategoryField: (preferredCategoryId?: number | null) => {
      options.playlistUiFacade.syncMediaCategoryField(
        preferredCategoryId ?? options.playlistUiFacade.getActiveCategoryId()
      );
    },
    syncPlaybackAfterMediaAdd: () => {
      const currentMediaId = options.getCurrentMediaId();
      if (currentMediaId !== null) {
        options.updatePlayStatus(currentMediaId);
        return;
      }

      const firstMediaId = options.getFirstMediaId();
      if (firstMediaId !== null) {
        options.updatePlayStatus(firstMediaId);
      }
    },
    onCategoryCreated: () => {
      options.playlistUiFacade.clearCategory();
      options.playlistUiFacade.updateCategory();
    },
    onCategoriesMutated: () => {
      options.playlistUiFacade.clearCategory();
      options.playlistUiFacade.updateCategory();
      options.playlistUiFacade.updatePlaylist();
    },
  };
}
