import type { PlaylistUiFacade } from './playlist-ui-facade';

export interface CreatePlaylistSessionSupportOptions {
  status: AMP_STATUS;
  appBoot: {
    setPlaylistReadyState(isReady: boolean): void;
  };
  getPlaylistUiFacade(): PlaylistUiFacade;
  buildPlaylistJson(options: {
    mediaItems: MediaItem[];
    categories: string[];
    playlistOptions: AMP_STATUS['options'];
    seekFormat: boolean;
  }): string;
}

export interface PlaylistSessionSupport {
  setPlaylistReadyState(isReady: boolean): void;
  clearCategory(): void;
  updatePlaylist(): void;
  generatePlaylistJson(seekFormat: boolean): string;
}

export function createPlaylistSessionSupport(
  options: CreatePlaylistSessionSupportOptions
): PlaylistSessionSupport {
  return {
    setPlaylistReadyState: (isReady) => {
      options.appBoot.setPlaylistReadyState(isReady);
    },
    clearCategory: () => {
      options.getPlaylistUiFacade().clearCategory();
    },
    updatePlaylist: () => {
      options.getPlaylistUiFacade().updatePlaylist();
    },
    generatePlaylistJson: (seekFormat) => options.buildPlaylistJson({
      mediaItems: options.status.media || [],
      categories: options.status.category || [],
      playlistOptions: options.status.options,
      seekFormat,
    }),
  };
}
