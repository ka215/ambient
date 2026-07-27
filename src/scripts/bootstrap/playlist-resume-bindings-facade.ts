import type { createPlaylistResumeBindings } from '../state/playlist-resume-bindings';

type PlaylistResumeBindingsOptions = Parameters<typeof createPlaylistResumeBindings>[0];

export interface CreatePlaylistResumeBindingsFacadeOptions {
  status: PlaylistResumeBindingsOptions['status'];
  playlistResume: PlaylistResumeBindingsOptions['playlistResume'];
  sanitizeMediaText: PlaylistResumeBindingsOptions['sanitizeMediaText'];
  titleMaxLength: number;
  artistMaxLength: number;
  hasStoredMyPlaylist: PlaylistResumeBindingsOptions['hasStoredMyPlaylist'];
  isCloudMode: PlaylistResumeBindingsOptions['isCloudMode'];
  myPlaylistName: string;
  hasPlaylist: PlaylistResumeBindingsOptions['hasPlaylist'];
  onCategoryResumeApplied: PlaylistResumeBindingsOptions['onCategoryResumeApplied'];
  onMediaResumeApplied: PlaylistResumeBindingsOptions['onMediaResumeApplied'];
}

export function createPlaylistResumeBindingsFacade(
  options: CreatePlaylistResumeBindingsFacadeOptions
): PlaylistResumeBindingsOptions {
  return {
    status: options.status,
    playlistResume: options.playlistResume,
    sanitizeMediaText: options.sanitizeMediaText,
    titleMaxLength: options.titleMaxLength,
    artistMaxLength: options.artistMaxLength,
    hasStoredMyPlaylist: options.hasStoredMyPlaylist,
    isCloudMode: options.isCloudMode,
    myPlaylistName: options.myPlaylistName,
    hasPlaylist: options.hasPlaylist,
    onCategoryResumeApplied: options.onCategoryResumeApplied,
    onMediaResumeApplied: options.onMediaResumeApplied,
  };
}
