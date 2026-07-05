import type { MediaItem } from '../types/ambient';
import type { PlaylistMode } from '../ui/playlist-view';

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

export type PlaylistModeTransitionDecision =
  | { kind: 'reject_edit' }
  | { kind: 'reject_mutation' }
  | { kind: 'same_mode' }
  | { kind: 'reject_reorder' }
  | { kind: 'confirm_edit_leave' }
  | { kind: 'apply'; clearDeleteSelections: boolean; resetReorderOnLeave: boolean; captureReorderOnEnter: boolean };

export function resolvePlaylistModeTransition(options: {
  currentMode: PlaylistMode;
  nextMode: PlaylistMode;
  canUseEditMode: boolean;
  canMutatePlaylist: boolean;
  canUseReorderMode: boolean;
}): PlaylistModeTransitionDecision {
  if (options.nextMode === 'edit' && !options.canUseEditMode) {
    return { kind: 'reject_edit' };
  }

  if (options.nextMode !== 'normal' && options.nextMode !== 'edit' && !options.canMutatePlaylist) {
    return { kind: 'reject_mutation' };
  }

  if (options.currentMode === options.nextMode) {
    return { kind: 'same_mode' };
  }

  if (options.nextMode === 'reorder' && !options.canUseReorderMode) {
    return { kind: 'reject_reorder' };
  }

  if (options.currentMode === 'edit' && options.nextMode !== 'edit') {
    return { kind: 'confirm_edit_leave' };
  }

  return {
    kind: 'apply',
    clearDeleteSelections: options.currentMode === 'delete',
    resetReorderOnLeave: options.currentMode === 'reorder' && options.nextMode !== 'reorder',
    captureReorderOnEnter: options.nextMode === 'reorder',
  };
}

export function canUseAnyPlaylistMode(options: {
  visibleItemCount: number;
  canUseEditMode: boolean;
  canMutatePlaylist: boolean;
}): boolean {
  return options.visibleItemCount > 0 && (options.canUseEditMode || options.canMutatePlaylist);
}

export function shouldResetPlaylistOperationMode(currentMode: PlaylistMode, canUsePlaylistModes: boolean): boolean {
  return !canUsePlaylistModes && currentMode !== 'normal';
}
