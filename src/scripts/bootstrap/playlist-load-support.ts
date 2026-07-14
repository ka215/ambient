export interface PlaylistLoadSupport {
  setLoadPlaylist(callback: (playlist: string) => Promise<unknown> | void): void;
  loadPlaylist(playlist: string): Promise<unknown> | void;
}

export function createPlaylistLoadSupport(): PlaylistLoadSupport {
  let loadPlaylistHandler: ((playlist: string) => Promise<unknown> | void) | null = null;

  return {
    setLoadPlaylist(callback) {
      loadPlaylistHandler = callback;
    },
    loadPlaylist(playlist) {
      return loadPlaylistHandler?.(playlist);
    },
  };
}
