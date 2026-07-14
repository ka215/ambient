export interface PlaylistModeMenuSupport {
  setClosePlaylistModeMenu(callback: () => void): void;
  closePlaylistModeMenu(): void;
}

export function createPlaylistModeMenuSupport(): PlaylistModeMenuSupport {
  let closeHandler: (() => void) | null = null;

  return {
    setClosePlaylistModeMenu(callback) {
      closeHandler = callback;
    },
    closePlaylistModeMenu() {
      closeHandler?.();
    },
  };
}
