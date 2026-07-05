import type { MediaItem } from '../types/ambient';

export function getPlaylistItemsForView(
  mediaItems: MediaItem[] | null | undefined,
  categoryId: number | null | undefined
): MediaItem[] {
  if (!mediaItems) {
    return [];
  }

  if (categoryId === null || categoryId === undefined || Number(categoryId) === -1) {
    return mediaItems;
  }

  return mediaItems.filter((item) => item.catId === Number(categoryId));
}

export function canUsePlaylistEditMode(options: {
  playlist: string | null;
  visibleItems: MediaItem[];
  isCloud: boolean;
  myPlaylistName: string;
  hasStoredMyPlaylist: boolean;
}): boolean {
  if (!options.playlist || options.visibleItems.length === 0) {
    return false;
  }

  if (options.isCloud) {
    return options.playlist === options.myPlaylistName && options.hasStoredMyPlaylist;
  }

  return true;
}

export function canUsePlaylistReorderMode(options: {
  canMutatePlaylist: boolean;
  sortableAvailable: boolean;
  categoryId: number | null | undefined;
  visibleItems: MediaItem[];
}): boolean {
  if (!options.canMutatePlaylist) {
    return false;
  }
  if (!options.sortableAvailable) {
    return false;
  }
  if (Number(options.categoryId) === -1) {
    return false;
  }

  return options.visibleItems.length > 1;
}
