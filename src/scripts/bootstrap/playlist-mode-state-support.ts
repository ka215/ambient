import type { PlaylistMode } from '../ui/playlist-view';

export interface CreatePlaylistModeStateSupportOptions {
  getPlaylistMode(): PlaylistMode;
  setPlaylistMode(mode: PlaylistMode): void;
  getDeleteSelectedIds(): Set<number>;
  clearDeleteSelections(): void;
}

export interface PlaylistModeStateSupport {
  getPlaylistMode(): PlaylistMode;
  setPlaylistMode(mode: PlaylistMode): void;
  getDeleteSelectedIds(): Set<number>;
  clearDeleteSelections(): void;
  resetPlaylistMode(): void;
}

export function createPlaylistModeStateSupport(
  options: CreatePlaylistModeStateSupportOptions
): PlaylistModeStateSupport {
  return {
    getPlaylistMode: options.getPlaylistMode,
    setPlaylistMode: options.setPlaylistMode,
    getDeleteSelectedIds: options.getDeleteSelectedIds,
    clearDeleteSelections: options.clearDeleteSelections,
    resetPlaylistMode: () => {
      options.setPlaylistMode('normal');
    },
  };
}
