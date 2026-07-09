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
