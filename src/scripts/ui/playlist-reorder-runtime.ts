import type { MediaItem } from '../types/ambient';
import { createPlaylistReorderSnapshot, isPlaylistReorderDirty } from '../state/playlist-mode-state';
import { readPlaylistItemIdsFromDom } from './playlist-view';

export interface PlaylistReorderRuntimeController {
  applyChanges(): MediaItem[] | null;
  captureSnapshot(): void;
  ensureSortable(): void;
  getInitialIds(): number[];
  getWorkingIds(): number[];
  isDirty(): boolean;
  reset(): void;
  restoreInitialOrder(): void;
  syncWorkingIdsFromDom(): void;
}

export function createPlaylistReorderRuntimeController(options: {
  listElement: HTMLElement;
  getCategoryId: () => number | null;
  getVisibleItems: () => MediaItem[];
  getMediaItems: () => MediaItem[] | null;
  setMediaItems: (mediaItems: MediaItem[]) => void;
  canMutatePlaylist: () => boolean;
  canUseReorderMode: () => boolean;
  sortableLibrary: {
    create(element: HTMLElement, options: Record<string, unknown>): { destroy(): void };
  } | undefined;
  onPersist: () => void;
}): PlaylistReorderRuntimeController {
  let reorderInitialIds: number[] = [];
  let reorderWorkingIds: number[] = [];
  let reorderCategoryId: number | null = null;
  let playlistSortable: { destroy(): void } | null = null;

  const destroySortable = (): void => {
    if (playlistSortable) {
      playlistSortable.destroy();
      playlistSortable = null;
    }
  };

  const reset = (): void => {
    destroySortable();
    reorderInitialIds = [];
    reorderWorkingIds = [];
    reorderCategoryId = null;
  };

  const captureSnapshot = (): void => {
    const snapshot = createPlaylistReorderSnapshot({
      categoryId: options.getCategoryId(),
      visibleItems: options.getVisibleItems(),
    });
    reorderCategoryId = snapshot.reorderCategoryId;
    reorderInitialIds = snapshot.reorderInitialIds;
    reorderWorkingIds = snapshot.reorderWorkingIds;
  };

  const syncWorkingIdsFromDom = (): void => {
    reorderWorkingIds = readPlaylistItemIdsFromDom(options.listElement);
  };

  const applyChanges = (): MediaItem[] | null => {
    if (!options.canMutatePlaylist()) {
      reset();
      return null;
    }
    const mediaItems = options.getMediaItems();
    if (!mediaItems || reorderCategoryId === null || reorderWorkingIds.length === 0) {
      reset();
      return null;
    }

    const mediaById = new Map(mediaItems.map((item) => [item.amId, item]));
    const reorderedItems = reorderWorkingIds
      .map((amId) => mediaById.get(amId))
      .filter((item): item is MediaItem => !!item);
    let reorderIndex = 0;
    const nextMediaItems = mediaItems.map((item) => {
      if (item.catId !== reorderCategoryId) {
        return item;
      }
      const nextItem = reorderedItems[reorderIndex];
      reorderIndex++;
      return nextItem || item;
    });
    options.setMediaItems(nextMediaItems);
    options.onPersist();
    reset();
    return nextMediaItems;
  };

  const ensureSortable = (): void => {
    if (!options.canUseReorderMode()) {
      destroySortable();
      return;
    }
    if (playlistSortable || !options.sortableLibrary) {
      return;
    }
    playlistSortable = options.sortableLibrary.create(options.listElement, {
      animation: 150,
      draggable: 'a[data-playlist-item]',
      forceFallback: true,
      fallbackOnBody: true,
      ghostClass: 'playlist-reorder-ghost',
      chosenClass: 'playlist-reorder-chosen',
      dragClass: 'playlist-reorder-drag',
      onEnd: () => {
        syncWorkingIdsFromDom();
      },
    });
  };

  return {
    applyChanges,
    captureSnapshot,
    ensureSortable,
    getInitialIds: () => [...reorderInitialIds],
    getWorkingIds: () => [...reorderWorkingIds],
    isDirty: () => isPlaylistReorderDirty(reorderInitialIds, reorderWorkingIds),
    reset,
    restoreInitialOrder: () => {
      reorderWorkingIds = [...reorderInitialIds];
    },
    syncWorkingIdsFromDom,
  };
}
