import type { PlaylistStartupAction } from './playlist-startup';

export function executeInitialPlaylistStartup<TMediaContext>(options: {
  action: PlaylistStartupAction<TMediaContext>;
  requestCategoryResume(category: string | null): void;
  requestMediaResume(media: TMediaContext | null): void;
  selectPlaylistOption(playlist: string): void;
  loadPlaylist(playlist: string): Promise<void> | void;
  initMyPlaylistFromStorage(): void;
  setPlaylistReadyState(isReady: boolean): void;
  releaseAppBoot(): void;
}): void {
  switch (options.action.type) {
    case 'resume':
      options.requestCategoryResume(options.action.category);
      options.requestMediaResume(options.action.media);
      options.selectPlaylistOption(options.action.playlist);
      void options.loadPlaylist(options.action.playlist);
      break;
    case 'autoload_myplaylist':
      options.initMyPlaylistFromStorage();
      options.releaseAppBoot();
      break;
    case 'autoload_current_playlist':
      void options.loadPlaylist(options.action.playlist);
      break;
    case 'ready':
      options.setPlaylistReadyState(true);
      options.releaseAppBoot();
      break;
  }
}
