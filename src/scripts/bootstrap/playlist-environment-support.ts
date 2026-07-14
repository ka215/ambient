export interface CreatePlaylistEnvironmentSupportOptions {
  hasStoredMyPlaylist(): boolean;
  isCloudMode(): boolean;
}

export interface PlaylistEnvironmentSupport {
  hasStoredMyPlaylist(): boolean;
  isCloudMode(): boolean;
}

export function createPlaylistEnvironmentSupport(
  options: CreatePlaylistEnvironmentSupportOptions
): PlaylistEnvironmentSupport {
  return {
    hasStoredMyPlaylist: options.hasStoredMyPlaylist,
    isCloudMode: options.isCloudMode,
  };
}
