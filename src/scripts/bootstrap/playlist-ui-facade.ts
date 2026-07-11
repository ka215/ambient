export interface PlaylistUiFacadeBindings {
  getActiveCategoryId(): number | null;
  syncTargetCategorySelection(): void;
  syncMediaCategoryField(preferredCategoryId?: number | null): void;
  updatePlaylist(): void;
  clearCategory(): void;
  updateCategory(): void;
}

export interface PlaylistUiFacade {
  getActiveCategoryId(): number | null;
  syncTargetCategorySelection(): void;
  syncMediaCategoryField(preferredCategoryId?: number | null): void;
  updatePlaylist(): void;
  clearCategory(): void;
  updateCategory(): void;
}

export function createPlaylistUiFacade(
  getBindings: () => PlaylistUiFacadeBindings | null
): PlaylistUiFacade {
  return {
    getActiveCategoryId: () => getBindings()?.getActiveCategoryId() ?? null,
    syncTargetCategorySelection: () => {
      getBindings()?.syncTargetCategorySelection();
    },
    syncMediaCategoryField: (preferredCategoryId?: number | null) => {
      getBindings()?.syncMediaCategoryField(preferredCategoryId ?? null);
    },
    updatePlaylist: () => {
      getBindings()?.updatePlaylist();
    },
    clearCategory: () => {
      getBindings()?.clearCategory();
    },
    updateCategory: () => {
      getBindings()?.updateCategory();
    },
  };
}
