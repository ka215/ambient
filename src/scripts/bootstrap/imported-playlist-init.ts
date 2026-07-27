export async function activateImportedPlaylistSelection(options: {
  playlistName: string;
  ensurePlaylistOption(playlistName: string): void;
  selectPlaylistOption(playlistName: string): void;
  requestCategoryResume(category: string | null): void;
  requestMediaResume(media: null): void;
  loadPlaylist(playlistName: string, preserveOptionsDuringLoad: boolean): Promise<void>;
}): Promise<void> {
  options.ensurePlaylistOption(options.playlistName);
  options.selectPlaylistOption(options.playlistName);
  options.requestCategoryResume(null);
  options.requestMediaResume(null);
  await options.loadPlaylist(options.playlistName, true);
}

export function createImportedPlaylistActivator(options: {
  ensurePlaylistOption(playlistName: string): void;
  selectPlaylistOption(playlistName: string): void;
  requestCategoryResume(category: string | null): void;
  requestMediaResume(media: null): void;
  loadPlaylist(playlistName: string, preserveOptionsDuringLoad: boolean): Promise<void>;
}): (playlistName: string) => Promise<void> {
  return async (playlistName: string): Promise<void> => {
    await activateImportedPlaylistSelection({
      playlistName,
      ensurePlaylistOption: options.ensurePlaylistOption,
      selectPlaylistOption: options.selectPlaylistOption,
      requestCategoryResume: options.requestCategoryResume,
      requestMediaResume: options.requestMediaResume,
      loadPlaylist: options.loadPlaylist,
    });
  };
}
