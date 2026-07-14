import type { MediaItem } from '../types/ambient';

export interface CreatePlaylistRuntimeViewSupportOptions {
  status: AMP_STATUS;
  appBoot: {
    setPlaylistReadyState(isReady: boolean): void;
    release(): void;
  };
}

export interface PlaylistRuntimeViewSupport {
  getMediaItems(): MediaItem[] | null;
  getCategoryId(): number | null;
  setPlaylistReadyState(isReady: boolean): void;
  releaseAppBootGate(): void;
}

export function createPlaylistRuntimeViewSupport(
  options: CreatePlaylistRuntimeViewSupportOptions
): PlaylistRuntimeViewSupport {
  return {
    getMediaItems: () => options.status.media,
    getCategoryId: () => options.status.ctg,
    setPlaylistReadyState: (isReady) => {
      options.appBoot.setPlaylistReadyState(isReady);
    },
    releaseAppBootGate: () => {
      options.appBoot.release();
    },
  };
}
