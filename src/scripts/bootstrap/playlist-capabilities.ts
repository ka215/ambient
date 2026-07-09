import Sortable from 'sortablejs';
import type { MediaItem } from '../types/ambient';
import { canUsePlaylistReorderMode, getPlaylistItemsForView } from '../state/playlist-mode-state';

export function canUseAmbientReorderMode(options: {
  canMutatePlaylist: boolean;
  categoryId: number | null;
  mediaItems: MediaItem[] | null;
}): boolean {
  return canUsePlaylistReorderMode({
    canMutatePlaylist: options.canMutatePlaylist,
    sortableAvailable: typeof Sortable !== 'undefined' && typeof Sortable.create === 'function',
    categoryId: options.categoryId,
    visibleItems: getPlaylistItemsForView(options.mediaItems, options.categoryId),
  });
}
