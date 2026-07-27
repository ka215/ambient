import type { PlaylistUiFacade } from './playlist-ui-facade';

export interface MediaEditPlaylistHelpers {
  clearCategory(): void;
  updateCategory(): void;
  syncMediaCategoryField(preferredCategoryId?: number | null): void;
  getActiveCategoryId(): number | null;
  updatePlaylist(): void;
}

export function createMediaEditPlaylistHelpers(
  getPlaylistUiFacade: () => PlaylistUiFacade
): MediaEditPlaylistHelpers {
  return {
    clearCategory: () => {
      getPlaylistUiFacade().clearCategory();
    },
    updateCategory: () => {
      getPlaylistUiFacade().updateCategory();
    },
    syncMediaCategoryField: (preferredCategoryId?: number | null) => {
      getPlaylistUiFacade().syncMediaCategoryField(preferredCategoryId ?? null);
    },
    getActiveCategoryId: () => getPlaylistUiFacade().getActiveCategoryId(),
    updatePlaylist: () => {
      getPlaylistUiFacade().updatePlaylist();
    },
  };
}
