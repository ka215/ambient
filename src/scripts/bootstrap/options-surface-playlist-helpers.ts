import type { PlaylistUiFacade } from './playlist-ui-facade';

export interface OptionsSurfacePlaylistHelpers {
  getActiveCategoryId(): number | null;
  clearCategory(): void;
  updateCategory(): void;
  syncMediaCategoryField(preferredCategoryId?: number | null): void;
}

export function createOptionsSurfacePlaylistHelpers(
  playlistUiFacade: PlaylistUiFacade
): OptionsSurfacePlaylistHelpers {
  return {
    getActiveCategoryId: () => playlistUiFacade.getActiveCategoryId(),
    clearCategory: () => {
      playlistUiFacade.clearCategory();
    },
    updateCategory: () => {
      playlistUiFacade.updateCategory();
    },
    syncMediaCategoryField: (preferredCategoryId?: number | null) => {
      playlistUiFacade.syncMediaCategoryField(
        preferredCategoryId ?? playlistUiFacade.getActiveCategoryId()
      );
    },
  };
}
