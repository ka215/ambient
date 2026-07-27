export interface CreatePlaylistStartupSupportOptions {
  appBoot: {
    setPlaylistReadyState(isReady: boolean): void;
    release(): void;
  };
}

export interface PlaylistStartupSupport {
  setPlaylistReadyState(isReady: boolean): void;
  releaseAppBoot(): void;
}

export function createPlaylistStartupSupport(
  options: CreatePlaylistStartupSupportOptions
): PlaylistStartupSupport {
  return {
    setPlaylistReadyState: (isReady) => {
      options.appBoot.setPlaylistReadyState(isReady);
    },
    releaseAppBoot: () => {
      options.appBoot.release();
    },
  };
}
