import type { MediaItem } from '../types/ambient';
import { getDefaultMediaItemForView } from '../state/playlist-mode-state';
import type { PlaylistUiFacade } from './playlist-ui-facade';

export interface CreatePlaylistRuntimeViewHelpersOptions {
  playlistUiFacade: PlaylistUiFacade;
  getMediaItems(): MediaItem[] | null;
  getCategoryId(): number | null;
  setPlaylistReadyState(isReady: boolean): void;
  releaseAppBootGate(): void;
}

export interface PlaylistRuntimeViewHelpers {
  updatePlaylist(): void;
  getDefaultMediaItemForCurrentView(): MediaItem | null;
  setPlaylistReadyState(isReady: boolean): void;
  releaseAppBootGate(): void;
}

export function createPlaylistRuntimeViewHelpers(
  options: CreatePlaylistRuntimeViewHelpersOptions
): PlaylistRuntimeViewHelpers {
  return {
    updatePlaylist: () => {
      options.playlistUiFacade.updatePlaylist();
    },
    getDefaultMediaItemForCurrentView: () => getDefaultMediaItemForView({
      mediaItems: options.getMediaItems(),
      categoryId: options.getCategoryId(),
    }),
    setPlaylistReadyState: options.setPlaylistReadyState,
    releaseAppBootGate: options.releaseAppBootGate,
  };
}
